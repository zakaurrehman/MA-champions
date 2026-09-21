/**
 * Backup and restore, shared by `npm run backup`, `npm run restore` and the
 * round-trip test — so what is tested is what actually runs.
 *
 * Deliberately independent of the app (no `@/` imports, no Next): it has to
 * keep working when the app does not, which is exactly when a backup matters.
 *
 * Plain TypeScript only. Node runs this with type stripping, which cannot
 * handle enums, namespaces or parameter properties.
 */

/** The one thing this module needs from a database. Neon and PGlite both fit. */
export interface Db {
  query(text: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
}

export const BACKUP_VERSION = 1;

interface TableSpec {
  name: string;
  /** Columns that never leave the database. */
  exclude: string[];
}

/**
 * What is backed up.
 *
 * NOT backed up, on purpose:
 *  - admin_auth, password_resets, auth_attempts, order_lookups: credentials,
 *    live security tokens and rate-limit counters. A backup file is a thing that
 *    gets copied around and emailed; it should not contain the keys to the shop.
 *  - customers.password_hash, for the same reason. After a restore those
 *    customers sign in with Google or use "forgotten password" — which works,
 *    because their row (and email) is restored.
 */
export const TABLES: TableSpec[] = [
  { name: 'products', exclude: [] },
  { name: 'orders', exclude: [] },
  { name: 'reviews', exclude: [] },
  { name: 'customers', exclude: ['password_hash'] },
];

export interface BackupFile {
  meta: {
    tool: 'ma-backup';
    version: number;
    createdAt: string;
    counts: Record<string, number>;
    /** Tables that did not exist in the source database. */
    missingTables: string[];
    excludedColumns: Record<string, string[]>;
  };
  tables: Record<string, Record<string, unknown>[]>;
}

const UNDEFINED_TABLE = '42P01';
const isUndefinedTable = (error: unknown): boolean =>
  (error as { code?: string })?.code === UNDEFINED_TABLE;

/** Identifiers are interpolated into SQL, so they must look like identifiers. */
const SAFE_IDENTIFIER = /^[a-z_][a-z0-9_]*$/;
const quote = (identifier: string): string => {
  if (!SAFE_IDENTIFIER.test(identifier)) throw new Error(`Unsafe identifier: ${identifier}`);
  return `"${identifier}"`;
};

interface ColumnInfo {
  dataType: string;
}

/** Column names and types as the database itself reports them. */
async function tableColumns(db: Db, table: string): Promise<Map<string, ColumnInfo>> {
  const rows = await db.query(
    `SELECT column_name, data_type
       FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position`,
    [table]
  );
  return new Map(
    rows.map((r) => [String(r.column_name), { dataType: String(r.data_type) }] as const)
  );
}

/* ------------------------------------------------------------------ export */

export async function exportBackup(db: Db): Promise<BackupFile> {
  const tables: BackupFile['tables'] = {};
  const counts: Record<string, number> = {};
  const missingTables: string[] = [];
  const excludedColumns: Record<string, string[]> = {};

  for (const spec of TABLES) {
    const columns = await tableColumns(db, spec.name);

    // An empty column list means the table does not exist here.
    if (columns.size === 0) {
      missingTables.push(spec.name);
      continue;
    }

    // Excluded columns are left out of the SELECT itself rather than dropped
    // afterwards, so a password hash is never read out of the database at all.
    const wanted = [...columns.keys()].filter((c) => !spec.exclude.includes(c));
    if (spec.exclude.length > 0) excludedColumns[spec.name] = spec.exclude;

    try {
      const rows = await db.query(
        `SELECT ${wanted.map(quote).join(', ')} FROM ${quote(spec.name)} ORDER BY "id"`
      );
      tables[spec.name] = rows;
      counts[spec.name] = rows.length;
    } catch (error) {
      if (isUndefinedTable(error)) {
        missingTables.push(spec.name);
        continue;
      }
      throw error;
    }
  }

  return {
    meta: {
      tool: 'ma-backup',
      version: BACKUP_VERSION,
      createdAt: new Date().toISOString(),
      counts,
      missingTables,
      excludedColumns,
    },
    tables,
  };
}

/**
 * JSON with BigInt support. Postgres bigint columns can arrive as BigInt
 * depending on the driver, and JSON.stringify throws on those.
 */
export function serialiseBackup(file: BackupFile): string {
  return JSON.stringify(file, (_key, value) => (typeof value === 'bigint' ? value.toString() : value), 2);
}

/* ----------------------------------------------------------------- restore */

export function validateBackup(file: unknown): asserts file is BackupFile {
  const f = file as Partial<BackupFile> | null;

  if (!f || typeof f !== 'object' || f.meta?.tool !== 'ma-backup') {
    throw new Error('That file is not a backup made by `npm run backup`.');
  }
  if (f.meta.version !== BACKUP_VERSION) {
    throw new Error(
      `Unsupported backup version ${String(f.meta.version)} (this tool reads version ${BACKUP_VERSION}).`
    );
  }
  if (!f.tables || typeof f.tables !== 'object') {
    throw new Error('The backup has no tables in it.');
  }
}

/** Turns a value from the backup into something the target column will accept. */
function encode(value: unknown, column: ColumnInfo): unknown {
  if (value === null || value === undefined) return null;

  // JSON/JSONB columns want JSON text. Objects and arrays must be stringified;
  // a plain string here is itself a JSON value and needs quoting too.
  if (column.dataType === 'jsonb' || column.dataType === 'json') return JSON.stringify(value);

  // Postgres arrays (products.collections) travel as real arrays.
  return value;
}

export interface RestoreResult {
  inserted: number;
  skipped: number;
}

/**
 * Loads a backup into a database.
 *
 * NEVER overwrites. Every insert is ON CONFLICT DO NOTHING, so restoring into a
 * database that already holds newer data cannot damage it — a row that already
 * exists simply stays as it is. That makes this safe to run twice, and safe to
 * point at the wrong database.
 *
 * Row ids are preserved and the sequences are moved past them, so new rows
 * created after a restore never collide with restored ones.
 *
 * The target's tables must already exist (the CLI creates them first).
 */
export async function restoreBackup(
  db: Db,
  file: BackupFile
): Promise<Record<string, RestoreResult>> {
  validateBackup(file);
  const results: Record<string, RestoreResult> = {};

  for (const spec of TABLES) {
    const rows = file.tables[spec.name] ?? [];
    const result: RestoreResult = { inserted: 0, skipped: 0 };
    results[spec.name] = result;
    if (rows.length === 0) continue;

    // Only columns that exist in the target are written. A backup from an older
    // schema restores cleanly, and one from a newer schema drops what this
    // database does not have rather than failing the whole restore.
    const columns = await tableColumns(db, spec.name);
    if (columns.size === 0) throw new Error(`Target database has no "${spec.name}" table.`);

    for (const row of rows) {
      const keys = Object.keys(row).filter((k) => columns.has(k) && !spec.exclude.includes(k));
      if (keys.length === 0) continue;

      const values = keys.map((k) => encode(row[k], columns.get(k)!));
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

      const inserted = await db.query(
        `INSERT INTO ${quote(spec.name)} (${keys.map(quote).join(', ')})
         VALUES (${placeholders})
         ON CONFLICT DO NOTHING
         RETURNING 1 AS ok`,
        values
      );

      if (inserted.length > 0) result.inserted++;
      else result.skipped++;
    }

    await advanceSequence(db, spec.name);
  }

  return results;
}

/** Moves a table's id sequence past the highest restored id. */
async function advanceSequence(db: Db, table: string): Promise<void> {
  const max = await db.query(`SELECT MAX("id") AS max FROM ${quote(table)}`);
  const highest = max[0]?.max;
  if (highest === null || highest === undefined) return;

  await db.query(`SELECT setval(pg_get_serial_sequence($1, 'id'), $2::bigint)`, [
    table,
    String(highest),
  ]);
}

/**
 * Adapts a Db to the tagged-template shape the app's schema helpers expect, so
 * the CLI can reuse ensureAllTables() instead of carrying a second copy of the
 * schema that would drift.
 */
export function asSqlTag(db: Db) {
  return (strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown> => {
    let text = strings[0] ?? '';
    for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1] ?? ''}`;
    return db.query(text, values);
  };
}
