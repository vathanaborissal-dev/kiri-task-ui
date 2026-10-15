'use client';

import { CircleAlert, Target } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ErrorState } from '@/components/common/error-state';
import { CenteredSpinner } from '@/components/common/loading';
import { PageHeader } from '@/components/common/page-header';
import { UserAvatar } from '@/components/common/user-avatar';
import { DayNav, describeDay } from '@/components/standup/day-nav';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { todayKey, useTeamDay } from '@/lib/hooks/use-standup';
import type { DailyPlan, UserSummary } from '@/lib/types';
import { cn } from '@/lib/utils';

const blockersOf = (plan: DailyPlan | null) =>
  (plan?.items ?? []).filter((item) => item.kind === 'BLOCKER' && item.resolvedAt === null);

function PersonCard({
  person,
}: {
  person: { user: UserSummary; plan: DailyPlan | null };
}) {
  const plan = person.plan;
  const focus = (plan?.items ?? []).filter((item) => item.kind === 'FOCUS');
  const blockers = blockersOf(plan);
  const done = focus.filter((item) => item.isDone).length;

  return (
    <Card className={cn(blockers.length > 0 && 'border-destructive/40')}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <UserAvatar user={person.user} size="md" showTooltip={false} />
          <div className="min-w-0 flex-1">
            <Link href={`/team/${person.user.id}`} className="text-sm font-medium hover:underline">
              {person.user.name}
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              {person.user.jobTitle ?? 'No job title'}
            </p>
          </div>
          {focus.length > 0 ? (
            <Badge variant="secondary" className="shrink-0 tabular-nums">
              {done}/{focus.length}
            </Badge>
          ) : null}
          {blockers.length > 0 ? (
            <Badge variant="destructive" className="shrink-0 gap-1">
              <CircleAlert className="size-3" aria-hidden />
              {blockers.length}
            </Badge>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        {!plan || plan.items.length === 0 ? (
          <p className="text-muted-foreground">Nothing written down.</p>
        ) : null}

        {focus.length > 0 ? (
          <div className="space-y-1.5">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Target className="size-3.5" aria-hidden />
              Working on
            </p>
            <ul className="space-y-1">
              {focus.map((item) => (
                <li key={item.id} className="flex gap-2">
                  <span aria-hidden className="text-muted-foreground">
                    •
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn(item.isDone && 'text-muted-foreground line-through')}>
                      {item.body}
                    </span>
                    {item.task ? (
                      <Link
                        href={`/projects/${item.task.project.key}/tasks/${item.task.key}`}
                        className="ml-1.5 whitespace-nowrap font-mono text-xs text-muted-foreground hover:text-foreground"
                      >
                        {item.task.key}
                      </Link>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {blockers.length > 0 ? (
          <div className="space-y-1.5 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5">
            <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
              <CircleAlert className="size-3.5" aria-hidden />
              In the way
            </p>
            <ul className="space-y-1">
              {blockers.map((item) => (
                <li key={item.id} className="flex gap-2">
                  <span aria-hidden className="text-destructive/70">
                    •
                  </span>
                  <span className="min-w-0 flex-1">
                    {item.body}
                    {item.task ? (
                      <Link
                        href={`/projects/${item.task.project.key}/tasks/${item.task.key}`}
                        className="ml-1.5 whitespace-nowrap font-mono text-xs text-muted-foreground hover:text-foreground"
                      >
                        {item.task.key}
                      </Link>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {plan?.note ? (
          <p className="border-t pt-2.5 text-muted-foreground">{plan.note}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function TeamTodayView() {
  const [date, setDate] = useState(todayKey);
  const [blockedOnly, setBlockedOnly] = useState(false);
  const { data, isLoading, isError, error, refetch } = useTeamDay(date);

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isLoading || !data) return <CenteredSpinner label="Loading the team's day…" />;

  const blocked = data.people.filter((person) => blockersOf(person.plan).length > 0);
  const silent = data.people.filter((person) => (person.plan?.items.length ?? 0) === 0);
  const shown = blockedOnly ? blocked : data.people;

  return (
    <div className="space-y-5">
      <PageHeader
        title="The team's day"
        description="What everyone is working on, and what is standing in their way."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <DayNav date={date} onChange={setDate} />
        <div className="flex items-center gap-2">
          <Switch id="blocked-only" checked={blockedOnly} onCheckedChange={setBlockedOnly} />
          <Label htmlFor="blocked-only" className="text-sm font-normal">
            Only people who are blocked
          </Label>
        </div>
      </div>

      {/* The two numbers a lead actually scans for. */}
      <div className="flex flex-wrap gap-2 text-sm">
        <Badge variant={blocked.length > 0 ? 'destructive' : 'secondary'} className="gap-1.5">
          <CircleAlert className="size-3.5" aria-hidden />
          {blocked.length} blocked
        </Badge>
        <Badge variant="secondary">
          {silent.length} with nothing written for {describeDay(date).toLowerCase()}
        </Badge>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nobody is blocked.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((person) => (
            <PersonCard key={person.user.id} person={person} />
          ))}
        </div>
      )}
    </div>
  );
}
