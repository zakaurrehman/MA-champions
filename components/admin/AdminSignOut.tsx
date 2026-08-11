'use client';

import { useRouter } from 'next/navigation';

export default function AdminSignOut() {
  const router = useRouter();

  const signOut = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={signOut}
      className="font-body text-2xs font-semibold uppercase tracking-[0.14em] text-subtle hover:text-link"
    >
      Sign out
    </button>
  );
}
