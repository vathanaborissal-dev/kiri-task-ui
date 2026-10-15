import { AuthBackdrop } from '@/components/auth/auth-backdrop';
import { AuthBrandPanel } from '@/components/auth/auth-brand-panel';
import { AuthThemeToggle } from '@/components/auth/auth-theme-toggle';
import { KiriLogo } from '@/components/layout/kiri-logo';

/**
 * Two panes from `lg` up: the plate on the left, the form on the right.
 *
 * Below that the plate is dropped rather than stacked — on a phone the only
 * thing anybody wants here is the form, and the drawing costs layout and paint
 * for nothing.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-surface relative min-h-dvh lg:grid lg:grid-cols-[1.15fr_1fr]">
      <AuthBackdrop />

      <AuthBrandPanel />

      {/* A single hairline, not a panel edge: the form sits on the same sheet. */}
      <div className="relative flex min-h-dvh flex-col lg:min-h-0 lg:border-l">
        <header className="flex items-center justify-between gap-4 p-6 lg:justify-end lg:p-8">
          <KiriLogo className="max-w-full lg:hidden" />
          <AuthThemeToggle />
        </header>

        <main className="flex flex-1 items-start justify-center px-4 pb-10 sm:items-center lg:px-12">
          <div className="w-full max-w-[22rem]">{children}</div>
        </main>

        <footer className="flex items-center justify-center gap-3 px-6 pb-6 font-mono text-[11px] tracking-[0.15em] text-muted-foreground uppercase lg:justify-start lg:px-12">
          <span className="hidden h-px flex-1 bg-border lg:block" aria-hidden />
          <span>Kiri Task</span>
        </footer>
      </div>
    </div>
  );
}
