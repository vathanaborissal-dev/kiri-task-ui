import { Suspense } from 'react';
import { CenteredSpinner } from '@/components/common/loading';
import { LoginForm } from '@/components/auth/login-form';

export const metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <Suspense fallback={<CenteredSpinner />}>
      <LoginForm />
    </Suspense>
  );
}
