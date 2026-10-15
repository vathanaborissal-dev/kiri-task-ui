import { cookies } from 'next/headers';
import { AppShell } from '@/components/layout/app-shell';
import { SIDEBAR_COOKIE_NAME } from '@/lib/sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sidebarCookie = (await cookies()).get(SIDEBAR_COOKIE_NAME)?.value;

  return <AppShell sidebarDefaultOpen={sidebarCookie !== 'false'}>{children}</AppShell>;
}
