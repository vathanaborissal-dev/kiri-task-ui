'use client';

import { CheckCircle2, ListChecks, Plus, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { DateField } from '@/components/common/date-field';
import { Spinner } from '@/components/common/loading';
import { MultiSelect } from '@/components/common/multi-select';
import { AvatarStack } from '@/components/common/user-avatar';
import { DueDateBadge, PriorityBadge } from '@/components/common/badges';
import { ProgressBar } from '@/components/tasks/progress-field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateTaskFromIssue } from '@/lib/hooks/use-issues';
import { useBulkUpdateTasks } from '@/lib/hooks/use-tasks';
import type { Issue, IssueTask, ProjectDetail, ProjectMember } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * The tasks raised against one issue.
 *
 * An issue used to carry a single "fix task", so a bug that needed a migration,
 * a handler change and a regression test either got three unrelated tasks or
 * one vague one. This lists all of them, rolls their percentages up into the
 * issue's own progress, and lets several be moved or re-pointed at once.
 */
export function IssueTasks({
  issue,
  project,
  members,
  permissions,
}: {
  issue: Issue;
  project: ProjectDetail;
  members: ProjectMember[];
  permissions: Set<string>;
}) {
  const router = useRouter();
  const createTask = useCreateTaskFromIssue();
  const bulkUpdate = useBulkUpdateTasks();

  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const can = (permission: string) => permissions.has('*') || permissions.has(permission);
  const tasks = issue.tasks ?? [];
  const rollUp = issue.taskProgress ?? { percent: 0, done: 0, total: tasks.length };

  // A settled issue's tasks are frozen by the API, so the controls that would
  // move them are hidden rather than left to fail.
  const frozen = ['RESOLVED', 'CLOSED', 'WONT_FIX'].includes(issue.status);

  const applyBulk = async (patch: Record<string, unknown>) => {
    try {
      const result = await bulkUpdate.mutateAsync({ taskIds: selected, ...patch });
      toast.success(`${result.updated} ${result.updated === 1 ? 'task' : 'tasks'} updated`);
      setSelected([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update those tasks');
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-medium">
          <Wrench className="size-3.5 text-muted-foreground" aria-hidden />
          Tasks
          {tasks.length > 0 ? (
            <span className="text-xs font-normal text-muted-foreground tabular-nums">
              {rollUp.done} of {rollUp.total} done
            </span>
          ) : null}
        </h3>

        {tasks.length > 0 ? (
          <span className="flex min-w-32 flex-1 items-center gap-2 sm:max-w-56">
            <Progress
              value={rollUp.percent}
              className={cn(
                'h-1.5 flex-1',
                rollUp.percent === 100 &&
                  '[&_[data-slot=progress-indicator]]:bg-emerald-500',
              )}
            />
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {rollUp.percent}%
            </span>
          </span>
        ) : null}

        {can('task:create') && !frozen ? (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto h-8 gap-1.5"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="size-3.5" aria-hidden />
            {tasks.length === 0 ? 'Add fix task' : 'Add task'}
          </Button>
        ) : null}
      </div>

      {/* --- Bulk bar ------------------------------------------------------ */}
      {selected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/40 bg-accent/30 px-3 py-2">
          <span className="text-xs font-medium">{selected.length} selected</span>

          {can('task:change_status') ? (
            <Select onValueChange={(statusId) => void applyBulk({ statusId })}>
              <SelectTrigger size="sm" className="h-8 w-36">
                <SelectValue placeholder="Move to…" />
              </SelectTrigger>
              <SelectContent>
                {project.statuses.map((status) => (
                  <SelectItem key={status.id} value={status.id}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {can('task:update') ? (
            <Select onValueChange={(value) => void applyBulk({ progress: Number(value) })}>
              <SelectTrigger size="sm" className="h-8 w-32">
                <SelectValue placeholder="Progress…" />
              </SelectTrigger>
              <SelectContent>
                {[0, 25, 50, 75, 100].map((step) => (
                  <SelectItem key={step} value={String(step)}>
                    {step}% done
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {can('task:assign') ? (
            <div className="w-40">
              <MultiSelect
                options={members.map((member) => ({
                  value: member.user.id,
                  label: member.user.name,
                }))}
                selected={[]}
                onChange={(addAssigneeIds) =>
                  addAssigneeIds.length ? void applyBulk({ addAssigneeIds }) : undefined
                }
                placeholder="Add helper…"
              />
            </div>
          ) : null}

          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-8"
            onClick={() => setSelected([])}
          >
            Clear
          </Button>
        </div>
      ) : null}

      {/* --- The list ----------------------------------------------------- */}
      {tasks.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
          <ListChecks className="size-4 shrink-0" aria-hidden />
          <span className="flex-1">
            No tasks yet. Raise one so the work shows up on the board and in people&rsquo;s day.
          </span>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {tasks.map((task) => (
            <IssueTaskRow
              key={task.id}
              task={task}
              projectKey={issue.project.key}
              primary={issue.task?.id === task.id}
              selected={selected.includes(task.id)}
              onSelectedChange={(value) =>
                setSelected((current) =>
                  value ? [...current, task.id] : current.filter((id) => id !== task.id),
                )
              }
            />
          ))}
        </ul>
      )}

      {frozen && tasks.length > 0 ? (
        <p className="text-[11px] text-muted-foreground">
          This issue is settled, so its tasks are frozen. Reopen the issue to put them back into
          progress.
        </p>
      ) : null}

      <AddIssueTaskDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        issue={issue}
        members={members}
        canAssign={can('task:assign')}
        canSetDeadline={can('task:manage_deadline')}
        pending={createTask.isPending}
        onSubmit={async (values) => {
          try {
            const result = await createTask.mutateAsync({ idOrKey: issue.key, ...values });
            toast.success(`${result.data.key} created`, {
              action: { label: 'Open', onClick: () => router.push(result.url) },
            });
            setAddOpen(false);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not create that task');
          }
        }}
      />
    </section>
  );
}

function IssueTaskRow({
  task,
  projectKey,
  primary,
  selected,
  onSelectedChange,
}: {
  task: IssueTask;
  projectKey: string;
  /** The task the issue nominates as its main fix. */
  primary: boolean;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
}) {
  const href = `/projects/${projectKey}/tasks/${task.key}`;
  const done = task.status.category === 'DONE';
  const canceled = task.status.category === 'CANCELED';

  return (
    <li
      className={cn(
        'flex items-start gap-2.5 rounded-lg border bg-card px-2.5 py-2 transition-colors hover:border-primary/40 hover:bg-accent/30',
        selected && 'border-primary/60 bg-accent/40',
        canceled && 'opacity-60',
      )}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={(value) => onSelectedChange(value === true)}
        aria-label={`Select ${task.key}`}
        className="mt-0.5"
      />

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <Link
            href={href}
            className="font-mono text-[11px] text-muted-foreground hover:text-foreground"
          >
            {task.key}
          </Link>
          <Link
            href={href}
            className={cn(
              'min-w-0 flex-1 truncate text-sm hover:underline',
              (done || canceled) && 'text-muted-foreground',
              canceled && 'line-through',
            )}
          >
            {task.title}
          </Link>
          {primary ? (
            <span className="shrink-0 rounded-full border px-1.5 text-[10px] text-muted-foreground">
              main fix
            </span>
          ) : null}
          {done ? (
            <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" aria-label="Done" />
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
            title={`Status: ${task.status.name}`}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: task.status.color }}
              aria-hidden
            />
            {task.status.name}
          </span>
          {!canceled ? <ProgressBar value={done ? 100 : task.progress} /> : null}
          <PriorityBadge priority={task.priority} compact />
          <DueDateBadge date={task.dueDate} />
        </div>
      </div>

      <div className="shrink-0 pt-0.5">
        <AvatarStack users={task.assignees} max={3} size="xs" label="Working on it" />
      </div>
    </li>
  );
}

function AddIssueTaskDialog({
  open,
  onOpenChange,
  issue,
  members,
  canAssign,
  canSetDeadline,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issue: Issue;
  members: ProjectMember[];
  canAssign: boolean;
  canSetDeadline: boolean;
  pending: boolean;
  onSubmit: (values: {
    title?: string;
    assigneeIds?: string[];
    startDate?: string | null;
    dueDate?: string | null;
  }) => Promise<void>;
}) {
  const first = (issue.tasks ?? []).length === 0;
  const [title, setTitle] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);

  // Seed from the issue each time it opens, so the dates somebody set on the
  // issue do not have to be typed again on its first task.
  const reset = () => {
    setTitle('');
    setAssigneeIds(issue.assignee ? [issue.assignee.id] : []);
    setStartDate(issue.startDate);
    setDueDate(issue.dueDate);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{first ? 'Add the fix task' : `Add another task to ${issue.key}`}</DialogTitle>
          <DialogDescription>
            It lands on the board as a bug, inherits the issue&rsquo;s environment and priority, and
            carries the issue forward as it moves.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit({
              ...(title.trim() ? { title: title.trim() } : {}),
              ...(assigneeIds.length ? { assigneeIds } : {}),
              startDate,
              dueDate,
            });
          }}
        >
          <Field>
            <FieldLabel htmlFor="issue-task-title">What needs doing?</FieldLabel>
            <Input
              id="issue-task-title"
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={first ? `Fix ${issue.key}: ${issue.title}` : 'Add the regression test'}
            />
            <FieldDescription>
              Leave it blank to use the issue&rsquo;s own title.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel>Who is doing it?</FieldLabel>
            <MultiSelect
              options={members.map((member) => ({
                value: member.user.id,
                label: member.user.name,
                description: member.role.name,
              }))}
              selected={assigneeIds}
              onChange={setAssigneeIds}
              placeholder={canAssign ? 'Nobody yet' : 'Choose yourself'}
              label="Assignees"
            />
            {!canAssign ? (
              <FieldDescription>
                You can only assign work to yourself on this project.
              </FieldDescription>
            ) : null}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field className="min-w-0">
              <FieldLabel>Start date</FieldLabel>
              <DateField
                value={startDate}
                onChange={setStartDate}
                disabled={!canSetDeadline}
                placeholder="Not set"
                label="Start date"
              />
            </Field>
            <Field className="min-w-0">
              <FieldLabel>Deadline</FieldLabel>
              <DateField
                value={dueDate}
                onChange={setDueDate}
                disabled={!canSetDeadline}
                placeholder={canSetDeadline ? 'No deadline' : 'Not permitted'}
                label="Deadline"
              />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2" disabled={pending}>
              {pending ? <Spinner /> : null}
              Create task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
