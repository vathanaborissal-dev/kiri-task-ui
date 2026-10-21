import { KiriLogo } from '@/components/layout/kiri-logo';
import { Skeleton } from '@/components/ui/skeleton';
import type { SidebarVariant } from '@/lib/appearance';
import { cn } from '@/lib/utils';

/**
 * What fills the screen between signing in and the workspace arriving.
 *
 * It draws the real layout — rail, top bar, page header, stat row, two
 * columns — rather than a spinner on an empty page, so the first thing
 * somebody sees already has the shape of the app. Because it takes the same
 * `sidebarDefaultOpen` the real shell does, the chrome does not jump when the
 * session resolves and the actual sidebar takes over.
 *
 * Marked `aria-hidden` with a polite live message alongside it: a screen
 * reader should hear "loading", not a tree of empty boxes.
 */
export function AppShellSkeleton({
  sidebarOpen,
  variant,
}: {
  sidebarOpen: boolean;
  variant: SidebarVariant;
}) {
  // `inset` floats the page on the sidebar's background; the skeleton has to
  // do the same or the chrome shifts the moment the session lands.
  const inset = variant === 'inset';

  return (
    <>
      <p role="status" aria-live="polite" className="sr-only">
        Loading your workspace…
      </p>

      <div
        aria-hidden
        className={cn(
          'flex min-h-dvh w-full animate-in fade-in duration-300',
          inset && 'bg-sidebar p-2',
        )}
      >
        {/* --- rail ------------------------------------------------------- */}
        <div
          className={cn(
            'hidden shrink-0 flex-col gap-6 bg-sidebar p-3 md:flex',
            sidebarOpen ? 'w-64' : 'w-12 items-center',
            !inset && 'border-r',
          )}
        >
          <div className="flex h-8 items-center gap-2.5 px-1">
            <KiriLogo showWordmark={sidebarOpen} />
          </div>

          <div className="w-full space-y-1.5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center gap-2.5 px-1">
                <Skeleton className="size-4 shrink-0 rounded" />
                {sidebarOpen ? (
                  <Skeleton
                    className="h-3.5 rounded"
                    style={{ width: `${[68, 44, 76, 56, 62, 50][index]}%` }}
                  />
                ) : null}
              </div>
            ))}
          </div>

          {sidebarOpen ? (
            <div className="w-full space-y-1.5">
              <Skeleton className="h-2.5 w-16 rounded" />
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-2.5 px-1">
                  <Skeleton className="size-2 shrink-0 rounded-full" />
                  <Skeleton
                    className="h-3.5 rounded"
                    style={{ width: `${[58, 48, 40][index]}%` }}
                  />
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-auto flex w-full items-center gap-2.5 px-1">
            <Skeleton className="size-7 shrink-0 rounded-full" />
            {sidebarOpen ? <Skeleton className="h-3.5 w-24 rounded" /> : null}
          </div>
        </div>

        {/* --- main ------------------------------------------------------- */}
        <div
          className={cn(
            'flex min-w-0 flex-1 flex-col bg-background',
            inset && 'overflow-hidden rounded-xl border shadow-sm',
          )}
        >
          <div className="flex h-14 shrink-0 items-center gap-3 border-b px-4 sm:px-6">
            <Skeleton className="size-7 rounded-md" />
            <Skeleton className="h-3.5 w-28 rounded" />
            <Skeleton className="ml-auto h-8 w-40 rounded-md sm:w-64" />
            <Skeleton className="size-7 rounded-md" />
            <Skeleton className="size-7 rounded-md" />
            <Skeleton className="hidden h-8 w-24 rounded-md sm:block" />
          </div>

          <div className="flex-1 space-y-5 px-4 py-5 sm:px-6 lg:px-8">
            <div className="space-y-2">
              <Skeleton className="h-6 w-56 rounded" />
              <Skeleton className="h-3.5 w-80 max-w-full rounded" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-28 rounded-xl" />
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
