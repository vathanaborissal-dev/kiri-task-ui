import { Suspense } from 'react';
import { CenteredSpinner } from '@/components/common/loading';
import { AcceptInvitationForm } from '@/components/auth/accept-invitation-form';

export const metadata = { title: 'Accept your invitation' };

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<CenteredSpinner />}>
      <AcceptInvitationForm />
    </Suspense>
  );
}
