'use client';

import { ArrowRight, Bug, CheckCircle2, FlaskConical, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { DueDateBadge, PriorityBadge, QaBadge } from '@/components/common/badges';
import { BoardSkeleton } from '@/components/common/loading';
import { ErrorState } from '@/components/common/error-state';
import { AvatarStack } from '@/components/common/user-avatar';
import { IconButton } from '@/components/common/icon-button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { QA_STATUS_META } from '@/lib/constants';
import { useProject } from '@/lib/hooks/use-projects';
import { usePhaseBoard } from '@/lib/hooks/use-releases';
import { useUpdateTask } from '@/lib/hooks/use-tasks';
import type { PhaseBoard } from '@/lib/types';
import { cn } from '@/lib/utils';

type PhaseTask = PhaseBoard['phases'][number]['tasks'][number];

function PhaseTaskCard({
  task,
  projectKey,
  phases,
  currentPhaseId,
  canMovePhase,
  canSetQa,
  busy,
  onMove,
  onQa,
}: {
  task: PhaseTask;
  projectKey: string;
  phases: { id: string; name: string }[];
  currentPhaseId: string | null;
  canMovePhase: boolean;
  canSetQa: boolean;
  /** Which of this card's actions is in flight, if any. */
  busy: string | null;
  onMove: (taskKey: string, phaseId: string | null) => void;
  onQa: (taskKey: string, qaStatus: string) => void;
}) {
  const nextPhase = phases[phases.findIndex((p) => p.id === currentPhaseId) + 1];

  return (
    <article className="space-y-2 rounded-lg border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/projects/${projectKey}/tasks/${task.key}`}
          className="font-mono text-[11px] text-muted-foreground hover:text-foreground"
        >
          {task.key}
        </Link>
        <PriorityBadge priority={task.priority} compact />
      </div>

      <Link
        href={`/projects/${projectKey}/tasks/${task.key}`}
        className="block text-sm leading-snug font-medium break-anywhere hover:underline"
      >
        {task.title}
      </Link>

      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className="rounded px-1.5 py-0.5 text-[10px]"
          style={{ backgroundColor: `${task.status.color}22`, color: task.status.color }}
        >
          {task.status.name}
        </span>
        <QaBadge status={task.qaStatus} />
        <DueDateBadge date={task.dueDate} />
        {task.release ? (
          <span className="font-mono text-[10px] text-muted-foreground">{task.release.version}</span>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2">
        <AvatarStack users={task.assignees} max={3} size="xs" label="Assignees" />
        <div className="flex items-center gap-1">
          {canSetQa ? (
            <>
              <IconButton
                variant="ghost"
                className="size-6 text-muted-foreground hover:text-emerald-600"
                onClick={() => onQa(task.key, 'PASSED')}
                label="Passed testing"
                pending={busy === 'PASSED'}
                disabled={busy !== null}
              >
                <CheckCircle2 className="size-3.5" aria-hidden />
              </IconButton>
              <IconButton
                variant="ghost"
                className="size-6 text-muted-foreground hover:text-red-600"
                onClick={() => onQa(task.key, 'FAILED')}
                label="Failed testing"
                pending={busy === 'FAILED'}
                disabled={busy !== null}
              >
                <XCircle className="size-3.5" aria-hidden />
              </IconButton>
              <IconButton
                variant="ghost"
                className="size-6 text-muted-foreground hover:text-blue-600"
                onClick={() => onQa(task.key, 'IN_TESTING')}
                label="Now in testing"
                pending={busy === 'IN_TESTING'}
                disabled={busy !== null}
              >
                <FlaskConical className="size-3.5" aria-hidden />
              </IconButton>
            </>
          ) : null}
          {canMovePhase && nextPhase ? (
            <IconButton
              variant="ghost"
              className="size-6 text-muted-foreground hover:text-primary"
              onClick={() => onMove(task.key, nextPhase.id)}
              label={`Promote to ${nextPhase.name}`}
              pending={busy === 'PHASE'}
              disabled={busy !== null}
            >
              <ArrowRight className="size-3.5" aria-hidden />
            </IconButton>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function PhaseBoardView({ projectKey }: { projectKey: string }) {
  const { data: project } = useProject(projectKey);
  const { data, isLoading, isError, error, refetch } = usePhaseBoard(project?.id);
  const updateTask = useUpdateTask();
  // `${taskKey}:${action}` while a request is in flight, so only the button
  // that was pressed spins and the rest of the board stays usable.
  const [busy, setBusy] = useState<string | null>(null);

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isLoading || !data || !project) return <BoardSkeleton />;

  const permissions = new Set(project.myPermissions);
  const can = (permission: string) => permissions.has('*') || permissions.has(permission);

  const move = async (taskKey: string, phaseId: string | null) => {
    setBusy(`${taskKey}:PHASE`);
    try {
      await updateTask.mutateAsync({ idOrKey: taskKey, phaseId });
      toast.success(`${taskKey} promoted`);
      // After the toast: the board redrawing is not what people are waiting to
      // be told, and holding the message back makes the click feel ignored.
      await refetch();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Could not move that task');
    } finally {
      setBusy(null);
    }
  };

  const setQa = async (taskKey: string, qaStatus: string) => {
    setBusy(`${taskKey}:${qaStatus}`);
    try {
      await updateTask.mutateAsync({ idOrKey: taskKey, qaStatus });
      toast.success(`${taskKey} · ${QA_STATUS_META[qaStatus as 'PASSED'].label}`);
      await refetch();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Could not update the testing status');
    } finally {
      setBusy(null);
    }
  };

  const phases = data.phases.map((entry) => entry.phase);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Where each piece of work has reached. Work status, testing status and environment are tracked
        separately, so “done in development” and “verified in UAT” are different things.
      </p>

      <ScrollArea className="w-full pb-3">
        <div className="flex gap-4">
          {data.unphased.length > 0 ? (
            <div className="flex w-80 shrink-0 flex-col gap-2">
              <div className="flex items-center gap-2 px-1">
                <span className="size-2 rounded-full bg-slate-400" aria-hidden />
                <h3 className="text-sm font-medium">Not started</h3>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {data.unphased.length}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 rounded-xl border border-dashed bg-muted/20 p-2">
                {data.unphased.map((task) => (
                  <PhaseTaskCard
                    key={task.id}
                    task={task}
                    projectKey={projectKey}
                    phases={phases}
                    currentPhaseId={null}
                    canMovePhase={can('task:manage_phase')}
                    canSetQa={can('task:manage_qa')}
                    busy={busy?.startsWith(`${task.key}:`) ? busy.split(':')[1]! : null}
                    onMove={(key, phaseId) => void move(key, phaseId)}
                    onQa={(key, qa) => void setQa(key, qa)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {data.phases.map(({ phase, tasks, stats }) => {
            const percent = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
            return (
              <div key={phase.id} className="flex w-80 shrink-0 flex-col gap-2">
                <div className="space-y-1.5 px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: phase.color }}
                      aria-hidden
                    />
                    <h3 className="text-sm font-medium">{phase.name}</h3>
                    {phase.isProduction ? (
                      <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                        live
                      </span>
                    ) : null}
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                      {stats.total}
                    </span>
                  </div>
                  <Progress value={percent} className="h-1" />
                  <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-[11px] text-muted-foreground">
                    <span>{stats.done} done</span>
                    {stats.awaitingTesting > 0 ? (
                      <span className="text-amber-600 dark:text-amber-400">
                        {stats.awaitingTesting} to test
                      </span>
                    ) : null}
                    {stats.qaPassed > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {stats.qaPassed} passed
                      </span>
                    ) : null}
                    {stats.qaFailed > 0 ? (
                      <span className="text-red-600 dark:text-red-400">{stats.qaFailed} failed</span>
                    ) : null}
                    {stats.openIssues > 0 ? (
                      <span className={cn(stats.criticalIssues > 0 && 'text-red-600 dark:text-red-400')}>
                        <Bug className="mr-0.5 inline size-3" aria-hidden />
                        {stats.openIssues}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex min-h-32 flex-1 flex-col gap-2 rounded-xl border border-dashed bg-muted/20 p-2">
                  {tasks.length === 0 ? (
                    <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                      Nothing has reached this phase
                    </p>
                  ) : (
                    tasks.map((task) => (
                      <PhaseTaskCard
                        key={task.id}
                        task={task}
                        projectKey={projectKey}
                        phases={phases}
                        currentPhaseId={phase.id}
                        canMovePhase={can('task:manage_phase')}
                        canSetQa={can('task:manage_qa')}
                        busy={busy?.startsWith(`${task.key}:`) ? busy.split(':')[1]! : null}
                    onMove={(key, phaseId) => void move(key, phaseId)}
                        onQa={(key, qa) => void setQa(key, qa)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

    </div>
  );
}
