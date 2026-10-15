import { KiriLogo } from '@/components/layout/kiri-logo';

/** The four environments a project moves through, as the app models them. */
const STAGES = ['Development', 'UAT', 'Pilot', 'Production'];

/**
 * The left half of the sign-in screens, shown from `lg` up.
 *
 * Not a pitch: Kiri Task is invitation-only and internal, so everyone who
 * reaches this screen already knows what it is. The space is given to the one
 * idea the tool is built around — that work is measured as it moves between
 * environments — drawn as a scale rather than described in a headline.
 */
export function AuthBrandPanel() {
  return (
    <div className="relative hidden flex-col justify-center p-12 lg:flex xl:p-16">
      <div className="absolute top-12 left-12 xl:top-16 xl:left-16">
        <KiriLogo />
      </div>

      <div className="max-w-lg space-y-10">
        <div className="space-y-5">
          <h1 className="max-w-md text-[2.75rem] leading-[1.05] font-semibold tracking-[-0.035em] text-balance">
            Every change, measured to production.
          </h1>
          <p className="max-w-[24rem] text-[0.9375rem] leading-relaxed text-muted-foreground">
            Tasks, issues, releases and hotfixes for the team — tracked from the first commit through
            to production.
          </p>
        </div>

        {/* --- The measured scale ------------------------------------------ */}
        <div>
        <div className="mb-10 flex items-baseline justify-between font-mono text-[11px] tracking-[0.15em] uppercase">
          <span className="text-foreground">Lifecycle</span>
          <span className="text-muted-foreground">04 stations</span>
        </div>

        <div className="relative">
          {/* Ticks sit on the rule, so the two never drift apart. */}
          <div className="auth-scale h-2.5 w-full opacity-70" />
          <div className="h-px w-full bg-foreground/30" />

          <div
            className="auth-station absolute -top-1 left-0 size-2.5 -translate-x-1/2 rounded-full bg-primary ring-4 ring-background"
            aria-hidden
          />

          <ol className="mt-4 grid grid-cols-4">
            {STAGES.map((stage, position) => (
              <li
                key={stage}
                className={
                  position === 0
                    ? 'text-left'
                    : position === STAGES.length - 1
                      ? 'text-right'
                      : 'text-center'
                }
              >
                <span className="block font-mono text-[11px] tracking-[0.15em] text-muted-foreground/60 tabular-nums">
                  {String(position + 1).padStart(2, '0')}
                </span>
                <span className="mt-1 block text-sm text-foreground">{stage}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      </div>

      <div className="absolute right-12 bottom-12 left-12 flex items-center gap-3 font-mono text-[11px] tracking-[0.15em] text-muted-foreground uppercase xl:right-16 xl:bottom-16 xl:left-16">
        <span>Invitation only</span>
        <span className="h-px flex-1 bg-border" aria-hidden />
        <span>Kiri Task</span>
      </div>
    </div>
  );
}
