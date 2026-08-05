import type { Metadata } from 'next';
import PageShell from '@/components/ui/PageShell';
import Accordion from '@/components/ui/Accordion';
import Button from '@/components/ui/Button';
import { getFaqs, getFaqsByCategory } from '@/lib/faqs';
import JsonLd from '@/components/seo/JsonLd';
import { faqJsonLd, breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'FAQs — Lead Times, Sizing, Materials & Shipping',
  description:
    'Answers on championship belt lead times, shipping, sizing, the custom design process, plate materials, gold plating, payment and returns.',
  alternates: { canonical: '/faqs' },
};

export default async function FaqsPage() {
  const grouped = await getFaqsByCategory();
  const all = await getFaqs();

  return (
    <PageShell
      eyebrow="FAQs"
      title="Questions, answered"
      intro="Everything we get asked most, answered straight. If your question is not here, ask us — we would rather tell you than have you guess."
    >
      <div className="flex flex-col gap-12">
        {grouped.map(([category, faqs]) => (
          <section key={category} aria-labelledby={`faq-${category.replace(/\s+/g, '-').toLowerCase()}`}>
            <h2
              id={`faq-${category.replace(/\s+/g, '-').toLowerCase()}`}
              className="mb-2 text-xl text-ink"
            >
              {category}
            </h2>
            <div className="border-t border-line">
              {faqs.map((faq) => (
                <Accordion key={faq.id} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-14 border-t border-line pt-10">
        <h2 className="text-2xl text-ink">Still not sure?</h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
          Send us your question, or start a build and add a note — either reaches the same
          people.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button href="/build" size="lg">
            Build your belt
          </Button>
          <Button href="/contact" variant="secondary" size="lg">
            Ask a question
          </Button>
        </div>
      </div>

      {/*
        FAQPage structured data. Emitted from the same source as the visible
        answers, so the two can never drift — Google penalises rich results
        whose markup does not match the page.
      */}
      <JsonLd data={faqJsonLd(all)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'FAQs', path: '/faqs' },
        ])}
      />
    </PageShell>
  );
}
