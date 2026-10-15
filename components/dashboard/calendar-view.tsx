'use client';

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, Flag, Rocket } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DueDateBadge, PriorityBadge } from '@/components/common/badges';
import { CenteredSpinner } from '@/components/common/loading';
import { ErrorState } from '@/components/common/error-state';
import { PageHeader } from '@/components/common/page-header';
import { AvatarStack } from '@/components/common/user-avatar';
import { IconButton } from '@/components/common/icon-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSchedule } from '@/lib/hooks/use-tasks';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';

type Entry =
  | { kind: 'task'; id: string; date: Date; href: string; label: string; task: NonNullable<ReturnType<typeof useSchedule>['data']>['tasks'][number] }
  | { kind: 'milestone'; id: string; date: Date; href: string; label: string }
  | { kind: 'release'; id: string; date: Date; href: string; label: string };

/** Past its deadline and still not finished or dropped. */
const isOverdue = (entry: Extract<Entry, { kind: 'task' }>) =>
  entry.date.getTime() < Date.now() &&
  entry.task.status.category !== 'DONE' &&
  entry.task.status.category !== 'CANCELED';

export function CalendarView() {
  const { projects } = useAuth();
  const [cursor, setCursor] = useState(() => new Date());
  const [projectKey, setProjectKey] = useState('all');
  const [mineOnly, setMineOnly] = useState(false);
  const [view, setView] = useState<'month' | 'timeline'>('month');

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const selectedProject = projects.find((p) => p.key === projectKey);

  const { data, isLoading, isError, error, refetch } = useSchedule({
    from: gridStart.toISOString(),
    to: gridEnd.toISOString(),
    ...(selectedProject ? { projectId: selectedProject.id } : {}),
    ...(mineOnly ? { mine: true } : {}),
  });

  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart, gridEnd],
  );

  const entries: Entry[] = useMemo(() => {
    if (!data) return [];
    const list: Entry[] = [];
    for (const task of data.tasks) {
      if (!task.dueDate) continue;
      list.push({
        kind: 'task',
        id: task.id,
        date: new Date(task.dueDate),
        href: `/projects/${task.project.key}/tasks/${task.key}`,
        label: `${task.key} ${task.title}`,
        task,
      });
    }
    for (const milestone of data.milestones) {
      if (!milestone.dueDate) continue;
      list.push({
        kind: 'milestone',
        id: milestone.id,
        date: new Date(milestone.dueDate),
        href: `/projects/${milestone.project.key}`,
        label: milestone.name,
      });
    }
    for (const release of data.releases) {
      const when = release.releasedAt ?? release.plannedDate;
      if (!when) continue;
      list.push({
        kind: 'release',
        id: release.id,
        date: new Date(when),
        href: `/projects/${release.project.key}/releases/${release.id}`,
        label: `${release.version}${release.name ? ` · ${release.name}` : ''}`,
      });
    }
    return list;
  }, [data]);

  const byDay = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const entry of entries) {
      const key = format(entry.date, 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    }
    return map;
  }, [entries]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Calendar"
        description="Deadlines, milestones and releases across your projects."
        actions={
          <Tabs value={view} onValueChange={(value) => setView(value as typeof view)}>
            <TabsList>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <IconButton
          variant="outline"
          onClick={() => setCursor(subMonths(cursor, 1))}
          label="Previous month"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </IconButton>
        <span className="min-w-36 text-center text-sm font-medium">
          {format(cursor, 'MMMM yyyy')}
        </span>
        <IconButton
          variant="outline"
          onClick={() => setCursor(addMonths(cursor, 1))}
          label="Next month"
        >
          <ChevronRight className="size-4" aria-hidden />
        </IconButton>
        <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>
          Today
        </Button>

        <Select value={projectKey} onValueChange={setProjectKey}>
          <SelectTrigger size="sm" className="h-9 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.key}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Only mine
          <Switch checked={mineOnly} onCheckedChange={setMineOnly} />
        </label>
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isLoading || !data ? (
        <CenteredSpinner label="Loading schedule…" />
      ) : view === 'month' ? (
        <Card className="overflow-hidden p-0">
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b bg-muted/30">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div
                  key={day}
                  className="px-2 py-1.5 text-center text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                const dayEntries = byDay.get(key) ?? [];
                return (
                  <div
                    key={key}
                    className={cn(
                      'min-h-24 space-y-1 border-r border-b p-1.5 last:border-r-0',
                      !isSameMonth(day, cursor) && 'bg-muted/20 text-muted-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-grid size-5 place-items-center rounded-full text-xs',
                        isToday(day) && 'bg-primary font-semibold text-primary-foreground',
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayEntries.slice(0, 3).map((entry) => {
                      // A deadline that has already passed should not look like
                      // any other day's work.
                      const late = entry.kind === 'task' && isOverdue(entry);
                      return (
                      <Link
                        key={`${entry.kind}-${entry.id}`}
                        href={entry.href}
                        className={cn(
                          'block truncate rounded px-1 py-0.5 text-[11px] transition-colors hover:bg-accent',
                          entry.kind === 'release' && 'bg-chart-5/15 text-chart-5',
                          entry.kind === 'milestone' && 'bg-chart-3/15 text-chart-3',
                          entry.kind === 'task' && 'bg-muted',
                          late && 'bg-destructive/10 font-medium text-destructive',
                        )}
                        title={late ? `${entry.label} — overdue` : entry.label}
                      >
                        {entry.kind === 'release' ? '🚀 ' : entry.kind === 'milestone' ? '📍 ' : ''}
                        {entry.label}
                      </Link>
                      );
                    })}
                    {dayEntries.length > 3 ? (
                      <span className="block px-1 text-[10px] text-muted-foreground">
                        +{dayEntries.length - 3} more
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <CalendarDays className="size-5 text-muted-foreground" aria-hidden />
                <p className="text-sm text-muted-foreground">
                  Nothing scheduled in {format(cursor, 'MMMM yyyy')}.
                </p>
              </CardContent>
            </Card>
          ) : (
            [...entries]
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .map((entry) => (
                <Link
                  key={`${entry.kind}-${entry.id}`}
                  href={entry.href}
                  className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-accent/30"
                >
                  <span className="w-20 shrink-0 text-xs text-muted-foreground">
                    {format(entry.date, 'EEE d MMM')}
                  </span>
                  {entry.kind === 'release' ? (
                    <Rocket className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  ) : entry.kind === 'milestone' ? (
                    <Flag className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  ) : null}
                  <span className="min-w-0 flex-1 truncate text-sm">{entry.label}</span>
                  {entry.kind === 'task' ? (
                    <>
                      <PriorityBadge priority={entry.task.priority} compact />
                      <DueDateBadge date={entry.task.dueDate} />
                      <AvatarStack users={entry.task.assignees} max={2} size="xs" label="Assignees" />
                    </>
                  ) : null}
                </Link>
              ))
          )}
          {entries.some((e) => isSameDay(e.date, new Date())) ? null : null}
        </div>
      )}
    </div>
  );
}
