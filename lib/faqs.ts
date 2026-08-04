import raw from '@/data/faqs.json';

export interface Faq {
  id: string;
  category: string;
  question: string;
  answer: string;
  /** true where the answer avoids a figure we have not confirmed yet. */
  needsConfirmation: boolean;
}

async function loadFaqs(): Promise<Faq[]> {
  return raw.faqs as Faq[];
}

export async function getFaqs(): Promise<Faq[]> {
  return loadFaqs();
}

/** Grouped in the order categories first appear, so the page reads sensibly. */
export async function getFaqsByCategory(): Promise<[string, Faq[]][]> {
  const faqs = await loadFaqs();
  const map = new Map<string, Faq[]>();

  for (const faq of faqs) {
    const list = map.get(faq.category) ?? [];
    list.push(faq);
    map.set(faq.category, list);
  }

  return [...map.entries()];
}
