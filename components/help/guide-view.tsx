'use client';

import {
  ArrowRight,
  BookOpen,
  Bug,
  ChartNoAxesCombined,
  Check,
  Code2,
  Compass,
  Layers,
  ListTree,
  Map,
  Route,
  Rocket,
  Send,
  ShieldCheck,
  SquareKanban,
  Sun,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Emphasis } from '@/components/help/emphasis';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GUIDE, type GuideSection } from '@/lib/guide';
import { useMarkSeen } from '@/lib/hooks/use-seen';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { useTour } from '@/providers/tour-provider';

const ICONS = {
  compass: Compass,
  kanban: SquareKanban,
  layers: Layers,
  bug: Bug,
  rocket: Rocket,
  sun: Sun,
  send: Send,
  shield: ShieldCheck,
  code: Code2,
  chart: ChartNoAxesCombined,
  map: Map,
  list: ListTree,
} as const;

const AUDIENCE_STYLE = {
  Everyone: 'border-border bg-muted text-muted-foreground',
  Developer: 'border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  Manager: 'border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300',
} as const;

function Section({ section }: { section: GuideSection }) {
  const Icon = ICONS[section.icon];
  const variant = section.variant ?? 'list';
  const isOrdered = variant === 'steps';
  const List = isOrdered ? 'ol' : 'ul';

  return (
    <Card id={section.id} className="scroll-mt-20">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="size-4 text-muted-foreground" aria-hidden />
            {section.title}
          </CardTitle>
          {section.audience ? (
            <span
              className={cn(
                'rounded-full border px-2 py-0.5 text-[11px] font-medium',
                AUDIENCE_STYLE[section.audience],
              )}
            >
              {section.audience === 'Everyone' ? 'For everyone' : `For ${section.audience.toLowerCase()}s`}
            </span>
          ) : null}
        </div>
        <CardDescription>{section.intro}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <List
          className={cn(
            variant === 'directory' ? 'grid gap-3 md:grid-cols-2' : 'space-y-4',
          )}
        >
          {section.steps.map((step, index) => (
            <li
              key={step.title}
              className={cn(
                'flex gap-3',
                variant === 'directory' && 'rounded-lg border bg-muted/20 p-3',
              )}
            >
              {isOrdered ? (
                <span
                  aria-hidden
                  className="mt-0.5 inline-grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold tabular-nums text-primary"
                >
                  {index + 1}
                </span>
              ) : variant === 'list' ? (
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              ) : null}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-medium leading-snug">{step.title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <Emphasis>{step.body}</Emphasis>
                </p>
                {step.href ? (
                  <Button asChild variant="link" size="sm" className="h-auto gap-1 px-0 pt-0.5">
                    <Link href={step.href}>
                      {step.linkLabel ?? 'Open'}
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </List>

        {section.takeaway ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm leading-relaxed">
            <span className="font-medium text-foreground">What this gives you: </span>
            <span className="text-muted-foreground">{section.takeaway}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

const START_PATHS = [
  {
    href: '#scrum-basics',
    label: 'I am learning the words',
    detail: 'See every word in simple English.',
    icon: BookOpen,
  },
  {
    href: '#developer-flow',
    label: 'I build the work',
    detail: 'See what to do from start to finish.',
    icon: Code2,
  },
  {
    href: '#manager-flow',
    label: 'I check the team',
    detail: 'See what a manager should check.',
    icon: ChartNoAxesCombined,
  },
] as const;

export function GuideView() {
  const { canAnywhere } = useAuth();
  const markSeen = useMarkSeen();
  const { start } = useTour();

  useEffect(() => {
    markSeen({ guide: true });
  }, [markSeen]);

  const sections = GUIDE.filter(
    (section) => !section.permission || canAnywhere(section.permission),
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="How to use Kiri Task"
        description="A simple guide to your daily work. No special project words needed."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button className="gap-1.5" onClick={start}>
              <Route className="size-4" aria-hidden />
              Show me around
            </Button>
            <Button asChild variant="outline" className="gap-1.5">
              <Link href="/whats-new">What&apos;s new</Link>
            </Button>
          </div>
        }
      />

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4 text-primary" aria-hidden />
            Start with your job
          </CardTitle>
          <CardDescription>
            Kiri Task helps the team answer four questions: What are we building? Who owns it? What
            is stuck? What has reached users?
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {START_PATHS.map((path) => (
            <a
              key={path.href}
              href={path.href}
              className="group rounded-lg border bg-background/70 p-3 transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <path.icon className="size-4 text-primary" aria-hidden />
                {path.label}
                <ArrowRight
                  className="ml-auto size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                {path.detail}
              </span>
            </a>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
        <nav
          aria-label="Guide sections"
          className="flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-20 lg:flex-col lg:overflow-visible lg:pb-0"
        >
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="shrink-0 rounded-lg border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:border-0 lg:px-2"
            >
              {section.title}
            </a>
          ))}
        </nav>

        <div className="min-w-0 space-y-5">
          {sections.map((section) => (
            <Section key={section.id} section={section} />
          ))}
        </div>
      </div>
    </div>
  );
}
