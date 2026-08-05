'use client';

import { useWishlist } from '@/lib/wishlist';
import { useToasts } from '@/lib/toast';
import { useHydrated } from '@/lib/useHydrated';
import { HeartIcon } from '@/components/ui/Icons';

interface Props {
  slug: string;
  name: string;
  /** Floating variant sits over a product card image. */
  variant?: 'floating' | 'inline';
}

export default function WishlistButton({ slug, name, variant = 'floating' }: Props) {
  const slugs = useWishlist((s) => s.slugs);
  const toggle = useWishlist((s) => s.toggle);
  const push = useToasts((s) => s.push);
  const hydrated = useHydrated();

  // Before hydration we cannot know the saved state, so render the neutral
  // (unsaved) appearance rather than guessing and flipping after paint.
  const wished = hydrated && slugs.includes(slug);

  const onClick = () => {
    toggle(slug);
    push(
      wished ? `${name} removed from wishlist` : `${name} saved to wishlist`,
      wished ? undefined : { label: 'View', href: '/wishlist' }
    );
  };

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={wished}
        className="inline-flex items-center gap-2 font-body text-2xs font-semibold uppercase tracking-[0.14em] text-subtle transition-colors hover:text-link"
      >
        <HeartIcon className="h-4 w-4" filled={wished} />
        {wished ? 'Saved' : 'Save'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={wished}
      aria-label={wished ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-canvas/85 text-ink backdrop-blur-sm transition-colors hover:text-link"
    >
      <HeartIcon className="h-4 w-4" filled={wished} />
    </button>
  );
}
