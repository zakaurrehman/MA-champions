interface Props {
  question: string;
  answer: string;
}

/**
 * Native <details>/<summary>.
 *
 * Deliberately not a JS accordion: this is keyboard-operable and screen-reader
 * correct for free, works before hydration, and — critically for an FAQ page —
 * the answer text is always in the DOM for crawlers even when collapsed.
 */
export default function Accordion({ question, answer }: Props) {
  return (
    <details className="group border-b border-line">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 font-body text-base font-semibold text-ink transition-colors hover:text-link [&::-webkit-details-marker]:hidden">
        {question}
        <span
          aria-hidden="true"
          className="mt-1 shrink-0 text-xl leading-none text-subtle transition-transform duration-200 group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <p className="max-w-2xl pb-6 text-sm leading-relaxed text-muted">{answer}</p>
    </details>
  );
}
