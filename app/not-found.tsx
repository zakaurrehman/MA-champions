import type { Metadata } from 'next';
import PageShell from '@/components/ui/PageShell';
import Button from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <PageShell
      eyebrow="404"
      title="That belt is not on the rack"
      intro="The page you were after has moved or never existed. Try the collections, or start a build from scratch."
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button href="/build" size="lg">
          Build your belt
        </Button>
        <Button href="/collections" variant="secondary" size="lg">
          Shop collections
        </Button>
      </div>
    </PageShell>
  );
}
