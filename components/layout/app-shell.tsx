'use client';

import { ErrorState } from '@/components/common/error-state';
import { CenteredSpinner } from '@/components/common/loading';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { CommandPalette } from '@/components/layout/command-palette';
import { TourOverlay } from '@/components/help/tour/tour-overlay';
import { Topbar } from '@/components/layout/topbar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useAppearance } from '@/providers/appearance-provider';
import { useAuth } from '@/providers/auth-provider';
import { RealtimeProvider } from '@/providers/realtime-provider';
import { TourProvider } from '@/providers/tour-provider';

export function AppShell({
  children,
  sidebarDefaultOpen,
}: {
  children: React.ReactNode;
  sidebarDefaultOpen: boolean;
}) {
  const { user, isLoading, isError, error, refresh } = useAuth();
  const { sidebarVariant } = useAppearance();

  if (isLoading && !user) {
    return <CenteredSpinner label="Loading your workspace…" />;
  }

  // A 401 already redirects to the sign-in page, so reaching here means the API
  // was unreachable or answered badly. Say so and offer a way out — this used to
  // sit on a spinner forever.
  if (isError && !user) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16">
        <ErrorState
          error={error}
          title="Could not reach Kiri Task"
          onRetry={() => void refresh()}
        />
      </div>
    );
  }

  // The proxy redirect handles signed-out visitors; this covers a dropped session.
  if (!user) return <CenteredSpinner label="Signing you in…" />;

  return (
    <RealtimeProvider>
      <TourProvider>
        <SidebarProvider defaultOpen={sidebarDefaultOpen}>
          <AppSidebar variant={sidebarVariant} />
          <SidebarInset className="min-w-0 overflow-hidden">
            <Topbar />
            <div className="app-content flex-1 px-4 py-5 sm:px-6 lg:px-8">{children}</div>
          </SidebarInset>
          <CommandPalette />
          {/* Inside the sidebar provider so the tour can open the mobile
              sheet before pointing at something in it. It portals to the
              body, so this does not affect stacking. */}
          <TourOverlay />
        </SidebarProvider>
      </TourProvider>
    </RealtimeProvider>
  );
}
