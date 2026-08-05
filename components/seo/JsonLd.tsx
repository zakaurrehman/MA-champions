/**
 * Renders a JSON-LD block.
 *
 * `JSON.stringify` is what makes this safe: the value is data we constructed,
 * never raw user input, and stringify escapes the quotes and backslashes that
 * would otherwise break out of the script tag.
 */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Escape `<` so a string containing "</script>" cannot terminate the tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
