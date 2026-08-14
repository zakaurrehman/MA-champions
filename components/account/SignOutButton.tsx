'use client';

import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const router = useRouter();

  const signOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={signOut}
      className="rounded-[--radius-plate] border border-subtle/40 px-5 py-2.5 font-body text-2xs font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-primary hover:text-link"
    >
      Sign out
    </button>
  );
}
