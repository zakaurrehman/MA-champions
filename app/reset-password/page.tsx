import type { Metadata } from 'next';
import PageShell from '@/components/ui/PageShell';
import ResetPasswordForm from '@/components/account/ResetPasswordForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Choose a new password',
  // Never indexed: the URL carries a live reset token.
  robots: { index: false, follow: false, nocache: true },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <PageShell
      eyebrow="Account"
      title="Choose a new password"
      intro="This link works once and expires an hour after it was sent."
    >
      <ResetPasswordForm token={token ?? ''} />
    </PageShell>
  );
}
