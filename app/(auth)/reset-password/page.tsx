import { Suspense } from 'react';
import { CenteredSpinner } from '@/components/common/loading';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata = { title: 'Choose a new password' };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<CenteredSpinner />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
