import { cn } from '@/lib/utils';

/**
 * Compass rings behind the sign-in screens.
 *
 * Drawn from `--foreground`, so the same hairlines read as graphite on paper in
 * light and chalk on ink in dark without a second set of values.
 */
export function AuthBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <div className="auth-rings absolute inset-0" />
    </div>
  );
}
