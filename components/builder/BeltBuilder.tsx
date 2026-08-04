'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BUILD_SIZES,
  DEFAULT_BUILD,
  ENGRAVING_MAX,
  LEATHERS,
  PLATE_COUNTS,
  PLATE_MATERIALS,
  SILHOUETTES,
  STITCHES,
  buildPriceIsIndicative,
  computeBuildPrice,
  loadBuild,
  saveBuild,
  type BuildState,
} from '@/lib/builder';
import { formatPrice } from '@/lib/products';
import BeltPreview from './BeltPreview';
import OptionGrid from './OptionGrid';
import ArtworkUpload from './ArtworkUpload';
import ReviewStep from './ReviewStep';

const STEPS = ['Style', 'Plates', 'Leather', 'Artwork', 'Engraving', 'Review'] as const;

export default function BeltBuilder() {
  const [build, setBuild] = useState<BuildState>(DEFAULT_BUILD);
  const [step, setStep] = useState(0);
  const [restored, setRestored] = useState(false);

  /* Restore any saved build after hydration. */
  useEffect(() => {
    const saved = loadBuild();
    if (saved) {
      setBuild(saved);
      setRestored(Boolean(saved.artwork));
    }
  }, []);

  /* Persist on every change so nobody loses a build to a stray tab close. */
  useEffect(() => {
    saveBuild(build);
  }, [build]);

  const price = useMemo(() => computeBuildPrice(build), [build]);
  const indicative = buildPriceIsIndicative();

  const set = <K extends keyof BuildState>(key: K, value: BuildState[K]) =>
    setBuild((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_minmax(22rem,32rem)] lg:items-start lg:gap-14">
      {/* ---------------- Steps ---------------- */}
      <div className="order-2 lg:order-1">
        {/* Step nav */}
        <ol className="rail mb-10 flex gap-1 border-b border-line">
          {STEPS.map((label, i) => (
            <li key={label} className="shrink-0">
              <button
                type="button"
                onClick={() => setStep(i)}
                aria-current={i === step ? 'step' : undefined}
                className={`whitespace-nowrap border-b-2 px-4 py-3 font-body text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
                  i === step
                    ? 'border-primary text-link'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                <span className="tabular-nums">{i + 1}</span>
                <span className="ml-2">{label}</span>
              </button>
            </li>
          ))}
        </ol>

        {step === 0 && (
          <OptionGrid
            legend="Base silhouette"
            name="silhouette"
            items={SILHOUETTES}
            value={build.silhouette}
            onChange={(id) => set('silhouette', id)}
          />
        )}

        {step === 1 && (
          <div className="flex flex-col gap-9">
            <OptionGrid
              legend="Plate material"
              name="plateMaterial"
              items={PLATE_MATERIALS}
              value={build.plateMaterial}
              onChange={(id) => set('plateMaterial', id)}
            />
            <OptionGrid
              legend="Plate count"
              name="plateCount"
              items={PLATE_COUNTS}
              value={build.plateCount}
              onChange={(id) => set('plateCount', id)}
              columns={3}
            />
            <OptionGrid
              legend="Size"
              name="size"
              items={BUILD_SIZES}
              value={build.size}
              onChange={(id) => set('size', id)}
            />
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-9">
            <OptionGrid
              legend="Leather colour"
              name="leather"
              items={LEATHERS}
              value={build.leather}
              onChange={(id) => set('leather', id)}
              columns={3}
            />
            <OptionGrid
              legend="Stitching"
              name="stitch"
              items={STITCHES}
              value={build.stitch}
              onChange={(id) => set('stitch', id)}
              columns={3}
            />
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="mb-4 font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle">
              Your artwork
            </h2>
            {restored && !build.artwork?.previewUrl && build.artwork && (
              <p className="mb-4 rounded-[--radius-plate] border border-subtle/25 bg-surface px-4 py-3 text-2xs leading-relaxed text-muted">
                We saved your build, but files cannot be stored in the browser between visits.
                Re-attach <strong className="text-ink">{build.artwork.name}</strong> to see it on
                the preview.
              </p>
            )}
            <ArtworkUpload artwork={build.artwork} onChange={(a) => set('artwork', a)} />
          </div>
        )}

        {step === 4 && (
          <div>
            <label
              htmlFor="engraving"
              className="mb-4 block font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle"
            >
              Nameplate engraving
            </label>
            <input
              id="engraving"
              type="text"
              value={build.engraving}
              maxLength={ENGRAVING_MAX}
              onChange={(e) => set('engraving', e.target.value)}
              placeholder="Champion name, team or date"
              className="w-full rounded-[--radius-plate] border border-subtle/25 bg-canvas px-4 py-3.5 font-body text-base text-ink placeholder:text-subtle/60 focus:border-primary focus:outline-none"
            />
            <div className="mt-2 flex justify-between gap-4">
              <span className="text-2xs text-muted">
                Engraved on the nameplate. Leave blank for none.
              </span>
              <span aria-live="polite" className="shrink-0 text-2xs tabular-nums text-subtle">
                {build.engraving.length}/{ENGRAVING_MAX}
              </span>
            </div>
          </div>
        )}

        {step === 5 && <ReviewStep build={build} price={price} />}

        {/* Step controls */}
        <div className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-[--radius-plate] border border-subtle/40 px-5 py-2.5 font-body text-xs font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-primary hover:text-link disabled:pointer-events-none disabled:opacity-40"
          >
            Back
          </button>

          {step < STEPS.length - 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              className="rounded-[--radius-plate] bg-primary px-6 py-2.5 font-display text-sm uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover"
            >
              Next: {STEPS[step + 1]}
            </button>
          )}
        </div>
      </div>

      {/* ---------------- Live preview ---------------- */}
      <div className="order-1 lg:sticky lg:top-24 lg:order-2">
        <div className="border-plate rounded-[--radius-plate] bg-surface p-5">
          <BeltPreview build={build} />

          <div className="mt-5 flex items-end justify-between gap-4 border-t border-line pt-5">
            <div>
              <p className="font-body text-2xs uppercase tracking-[0.18em] text-subtle">
                Running total
              </p>
              <p aria-live="polite" className="font-display text-3xl text-plated">
                {formatPrice(price)}
              </p>
            </div>
            <p className="max-w-[14rem] text-right text-2xs leading-snug text-muted">
              Your build is saved automatically
            </p>
          </div>

          {indicative && (
            <p className="mt-3 text-2xs leading-relaxed text-subtle">
              Indicative only. Plate count, size and engraving do not change this figure yet —
              your final price is confirmed on your written quote.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
