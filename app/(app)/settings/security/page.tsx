import { Suspense } from 'react';
import { CenteredSpinner } from '@/components/common/loading';
import { SecuritySettings } from '@/components/settings/security-settings';

export const metadata = { title: 'Security' };

export default function SecuritySettingsPage() {
  return (
    <Suspense fallback={<CenteredSpinner />}>
      <SecuritySettings />
    </Suspense>
  );
}
