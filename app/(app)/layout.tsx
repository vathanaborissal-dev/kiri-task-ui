import { cookies } from 'next/headers';
import { AppShell } from '@/components/layout/app-shell';
import { SIDEBAR_COOKIE_NAME } from '@/lib/sidebar';

// Authenticated pages read per-user state (including the saved sidebar state)
// at request time, so they intentionally use a blocking application shell.
export const instant = false;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sidebarCookie = (await cookies()).get(SIDEBAR_COOKIE_NAME)?.value;

  return <AppShell sidebarDefaultOpen={sidebarCookie !== 'false'}>{children}</AppShell>;
}
