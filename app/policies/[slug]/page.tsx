import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageShell from '@/components/ui/PageShell';
import { getPolicy, POLICY_SLUGS, type PolicySlug } from '@/lib/policies';
import { site } from '@/lib/site';

interface Params {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return POLICY_SLUGS.map((slug) => ({ slug }));
}

function isPolicySlug(value: string): value is PolicySlug {
  return (POLICY_SLUGS as readonly string[]).includes(value);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  if (!isPolicySlug(slug)) return { title: 'Policy not found' };

  const policy = getPolicy(slug);
  return {
    title: policy.title,
    description: policy.intro,
    alternates: { canonical: `/policies/${slug}` },
    // Draft terms should not be indexed and quoted back at us out of context.
    robots: site.policies.approved ? undefined : { index: false, follow: true },
  };
}

export default async function PolicyPage({ params }: Params) {
  const { slug } = await params;
  if (!isPolicySlug(slug)) notFound();

  const policy = getPolicy(slug);
  const { approved, lastUpdated } = site.policies;

  return (
    <PageShell eyebrow="Policies" title={policy.title} intro={policy.intro}>
      {/*
        Shown until the owner has read and approved these. Looking unfinished
        is far cheaper than being contractually bound by terms nobody read.
      */}
      {!approved && (
        <p className="mb-10 rounded-[--radius-plate] border border-primary/40 px-5 py-4 text-sm leading-relaxed text-muted">
          <strong className="text-ink">Draft.</strong> These terms are being finalised and are
          not yet in force. If anything here matters to your order, ask us and we will confirm it
          in writing.
        </p>
      )}

      <div className="max-w-2xl">
        {policy.sections.map((section) => (
          <section key={section.heading} className="mt-10 first:mt-0">
            <h2 className="text-xl text-ink">{section.heading}</h2>

            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-base leading-relaxed text-muted">
                {paragraph}
              </p>
            ))}

            {section.bullets && (
              <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-muted">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <p className="mt-12 border-t border-line pt-6 text-2xs uppercase tracking-[0.14em] text-subtle">
          {lastUpdated ? `Last updated ${lastUpdated}` : 'Not yet published'}
        </p>
      </div>
    </PageShell>
  );
}
