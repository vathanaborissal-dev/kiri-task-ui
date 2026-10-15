'use client';

import { CircleAlert, CircleCheck, Link2, Plus, Target, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { ErrorState } from '@/components/common/error-state';
import { IconButton } from '@/components/common/icon-button';
import { CenteredSpinner } from '@/components/common/loading';
import { PageHeader } from '@/components/common/page-header';
import { DayNav, describeDay } from '@/components/standup/day-nav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useStandupPermissions } from '@/lib/hooks/use-standup-permissions';
import { todayKey, useDayMutations, useMyDay } from '@/lib/hooks/use-standup';
import { useTasks } from '@/lib/hooks/use-tasks';
import type { DailyPlan, DailyPlanItem, DailyPlanItemKind } from '@/lib/types';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';

const NO_TASK = 'none';

/** One bullet: a checkbox, the text, the task it belongs to, and a bin. */
function Bullet({
  item,
  onToggle,
  onDelete,
  pending,
}: {
  item: DailyPlanItem;
  onToggle: () => void;
  onDelete: () => void;
  pending: boolean;
}) {
  const settled = item.kind === 'BLOCKER' ? item.resolvedAt !== null : item.isDone;

  return (
    <li className="group/bullet flex items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/50">
      <Checkbox
        checked={settled}
        disabled={pending}
        onCheckedChange={onToggle}
        className="mt-0.5"
        aria-label={
          item.kind === 'BLOCKER'
            ? `Mark "${item.body}" as unblocked`
            : `Mark "${item.body}" as done`
        }
      />
      <div className="min-w-0 flex-1 space-y-1">
        <p className={cn('text-sm leading-snug', settled && 'text-muted-foreground line-through')}>
          {item.body}
        </p>
        {item.task ? (
          <Link
            href={`/projects/${item.task.project.key}/tasks/${item.task.key}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Link2 className="size-3 shrink-0" aria-hidden />
            <span className="whitespace-nowrap font-mono">{item.task.key}</span>
            <span className="truncate">{item.task.title}</span>
          </Link>
        ) : null}
      </div>
      <IconButton
        variant="ghost"
        className="size-7 text-muted-foreground opacity-0 transition-opacity group-hover/bullet:opacity-100 focus-visible:opacity-100 hover:text-destructive"
        label="Remove this line"
        onClick={onDelete}
        disabled={pending}
      >
        <Trash2 className="size-3.5" aria-hidden />
      </IconButton>
    </li>
  );
}

/** The add-a-bullet row: text, an optional task, and Enter to commit. */
function Composer({
  kind,
  placeholder,
  onAdd,
  pending,
}: {
  kind: DailyPlanItemKind;
  placeholder: string;
  onAdd: (body: string, taskId: string | null) => Promise<void>;
  pending: boolean;
}) {
  const { user } = useAuth();
  const [body, setBody] = useState('');
  const [taskId, setTaskId] = useState<string>(NO_TASK);

  // Only tasks assigned to this person, because that is what a bullet is about.
  const { data: mine } = useTasks(
    { assigneeId: user ? [user.id] : [], pageSize: 50, sort: 'dueDate', order: 'asc' },
    Boolean(user),
  );

  const submit = async () => {
    const text = body.trim();
    if (!text) return;
    await onAdd(text, taskId === NO_TASK ? null : taskId);
    setBody('');
    setTaskId(NO_TASK);
  };

  // The text always gets a line of its own: these cards sit two-up on a laptop,
  // so a single row squeezes the input down to nothing exactly when it matters.
  return (
    <div className="space-y-2 px-2">
      <Input
        value={body}
        placeholder={placeholder}
        disabled={pending}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            void submit();
          }
        }}
        aria-label={placeholder}
        className="h-9 w-full"
      />
      <div className="flex items-center gap-2">
        <Select value={taskId} onValueChange={setTaskId} disabled={pending}>
          <SelectTrigger
            className="h-9 min-w-0 flex-1"
            aria-label={kind === 'BLOCKER' ? 'Task this blocks' : 'Task this is about'}
          >
            <SelectValue placeholder="No task" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_TASK}>No task</SelectItem>
            {(mine?.data ?? []).map((task) => (
              <SelectItem key={task.id} value={task.id}>
                <span className="font-mono text-xs">{task.key}</span>
                <span className="ml-1.5 truncate">{task.title}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="secondary"
          className="h-9 shrink-0 gap-1.5"
          onClick={() => void submit()}
          disabled={pending || body.trim().length === 0}
        >
          <Plus className="size-4" aria-hidden />
          Add
        </Button>
      </div>
    </div>
  );
}

function Section({
  kind,
  plan,
  date,
  readOnly,
}: {
  kind: DailyPlanItemKind;
  plan: DailyPlan;
  date: string;
  readOnly: boolean;
}) {
  const { addItem, updateItem, deleteItem } = useDayMutations(date);
  const items = plan.items.filter((item) => item.kind === kind);
  const focus = kind === 'FOCUS';
  const pending = addItem.isPending || updateItem.isPending || deleteItem.isPending;

  const run = async (work: Promise<unknown>, failure: string) => {
    try {
      await work;
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : failure);
    }
  };

  return (
    <Card data-tour={focus ? 'today-focus' : 'today-blockers'}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {focus ? (
            <Target className="size-4 text-chart-1" aria-hidden />
          ) : (
            <CircleAlert className="size-4 text-destructive" aria-hidden />
          )}
          {focus ? "What I'm working on" : "What's in my way"}
          {items.length > 0 ? (
            <Badge variant="secondary" className="ml-1 tabular-nums">
              {items.length}
            </Badge>
          ) : null}
        </CardTitle>
        <CardDescription>
          {focus
            ? 'The handful of things you expect to move today.'
            : 'Anything slowing you down. Your project leads are told about these, so write them down rather than sitting on them.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">
            {focus
              ? 'Nothing listed yet.'
              : readOnly
                ? 'Nothing was in the way.'
                : 'Nothing in the way — long may it last.'}
          </p>
        ) : (
          <ul className="-mx-2 space-y-0.5">
            {items.map((item) => (
              <Bullet
                key={item.id}
                item={item}
                pending={pending}
                onToggle={() =>
                  void run(
                    updateItem.mutateAsync(
                      focus
                        ? { itemId: item.id, isDone: !item.isDone }
                        : { itemId: item.id, resolved: item.resolvedAt === null },
                    ),
                    'Could not update that line',
                  )
                }
                onDelete={() =>
                  void run(deleteItem.mutateAsync(item.id), 'Could not remove that line')
                }
              />
            ))}
          </ul>
        )}

        {readOnly ? null : (
          <Composer
            kind={kind}
            pending={pending}
            placeholder={focus ? 'Add what you are working on…' : 'Add what is blocking you…'}
            onAdd={(body, taskId) =>
              run(addItem.mutateAsync({ body, kind, taskId }), 'Could not add that line')
            }
          />
        )}
      </CardContent>
    </Card>
  );
}

/** Keyed on the plan id by its parent, so moving to another day remounts it
 *  with that day's note rather than syncing state in an effect. */
function Note({ plan, date, readOnly }: { plan: DailyPlan; date: string; readOnly: boolean }) {
  const { saveNote } = useDayMutations(date);
  const [value, setValue] = useState(plan.note ?? '');

  const dirty = value.trim() !== (plan.note ?? '').trim();

  if (readOnly && !plan.note) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Anything else</CardTitle>
        <CardDescription>
          Context your lead would want: a dependency, a meeting, a half-day off.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Textarea
          rows={3}
          value={value}
          disabled={readOnly}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Optional"
          aria-label="Note for the day"
        />
        {dirty ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={saveNote.isPending}
              onClick={() => {
                saveNote.mutate(value.trim() || null, {
                  onError: (error) =>
                    toast.error(error instanceof Error ? error.message : 'Could not save the note'),
                });
              }}
            >
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setValue(plan.note ?? '')}>
              Cancel
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function TodayView() {
  const [date, setDate] = useState(todayKey);
  const { data: plan, isLoading, isError, error, refetch } = useMyDay(date);
  const { canSeeTeam } = useStandupPermissions();

  // Past days are a record, not a scratchpad — you can read them, not rewrite them.
  const readOnly = date < todayKey();

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isLoading || !plan) return <CenteredSpinner label="Loading your day…" />;

  const done = plan.items.filter((item) => item.kind === 'FOCUS' && item.isDone).length;
  const focusCount = plan.items.filter((item) => item.kind === 'FOCUS').length;

  return (
    <div className="space-y-5">
      <PageHeader
        title={describeDay(date)}
        description="A few bullets on what you are doing and what is in the way. Your leads can see this, so nobody has to ask."
        actions={
          canSeeTeam ? (
            <Button asChild variant="outline" className="gap-1.5">
              <Link href="/today/team">
                <Users className="size-4" aria-hidden />
                The team&apos;s day
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <DayNav date={date} onChange={setDate} />
        {focusCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <CircleCheck className="size-4" aria-hidden />
            {done} of {focusCount} done
          </span>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section kind="FOCUS" plan={plan} date={date} readOnly={readOnly} />
        <Section kind="BLOCKER" plan={plan} date={date} readOnly={readOnly} />
      </div>

      <Note key={plan.id} plan={plan} date={date} readOnly={readOnly} />
    </div>
  );
}
