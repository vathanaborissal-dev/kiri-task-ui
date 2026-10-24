'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bug, Check, Loader2, MessageSquare, MoveRight, Paperclip, Workflow } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import {
  DueDateBadge,
  LabelChips,
  PhaseBadge,
  PriorityBadge,
  QaBadge,
} from '@/components/common/badges';
import { AvatarStack } from '@/components/common/user-avatar';
import { ProgressBar } from '@/components/tasks/progress-field';
import { IconButton } from '@/components/common/icon-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Task, TaskStatusRef } from '@/lib/types';
import { cn } from '@/lib/utils';

/** Pointer movement below this is a click; above it the user was dragging. */
const CLICK_SLOP_PX = 5;

export function TaskCard({
  task,
  draggable = true,
  isOverlay,
  moveState,
  statuses,
  onMove,
  tourAnchor,
}: {
  task: Task;
  draggable?: boolean;
  isOverlay?: boolean;
  /** Brief server-sync feedback after an optimistic board move. */
  moveState?: 'saving' | 'saved';
  /** `data-tour` value, set on the one card the guided tour points at. */
  tourAnchor?: string;
  /** When supplied, the card offers a keyboard-reachable "move to" menu. */
  statuses?: TaskStatusRef[];
  onMove?: (task: Task, statusId: string) => void;
}) {
  const router = useRouter();
  const pressOrigin = useRef<{ x: number; y: number } | null>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
    disabled: !draggable || moveState === 'saving',
  });

  const href = `/projects/${task.project.key}/tasks/${task.key}`;

  const open = () => router.push(href);

  return (
    <article
      ref={setNodeRef}
      {...(tourAnchor ? { 'data-tour': tourAnchor } : {})}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onPointerDown={(event) => {
        pressOrigin.current = { x: event.clientX, y: event.clientY };
        listeners?.onPointerDown?.(event);
      }}
      onPointerUp={(event) => {
        // A drop also ends in a click; only navigate when the pointer stayed put.
        const origin = pressOrigin.current;
        pressOrigin.current = null;
        if (!origin) return;
        const moved =
          Math.abs(event.clientX - origin.x) + Math.abs(event.clientY - origin.y) > CLICK_SLOP_PX;
        if (!moved) open();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${task.key}: ${task.title}`}
      aria-busy={moveState === 'saving' || undefined}
      className={cn(
        'cursor-pointer space-y-2 rounded-lg border bg-card p-3 text-left shadow-xs transition-colors',
        // Without this the browser starts a text selection instead of a drag.
        // Touch scrolling is left alone — the touch sensor waits for a short
        // press, so a swipe over a card still scrolls the board.
        draggable && 'touch-manipulation select-none',
        'hover:border-primary/40 hover:bg-accent/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        isDragging && 'opacity-40',
        isOverlay && 'rotate-2 shadow-lg',
        moveState === 'saving' && 'cursor-progress',
      )}
    >
      {/* `items-center` and a fixed height: the move button is 20px tall and
          only present when the viewer can move the card, which otherwise made
          the header — and so the whole card — a different height per card. */}
      <div className="flex min-h-5 items-center justify-between gap-2">
        <span className="font-mono text-[11px] leading-none text-muted-foreground">
          {task.key}
        </span>
        <span className="flex items-center gap-1">
          <PriorityBadge priority={task.priority} compact />
          {moveState && !isOverlay ? (
            <span
              role="status"
              aria-live="polite"
              className={cn(
                'inline-flex h-5 items-center gap-1 rounded-md px-1.5 text-[10px] font-medium',
                moveState === 'saving'
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
              )}
            >
              {moveState === 'saving' ? (
                <Loader2 className="size-3 animate-spin" aria-hidden />
              ) : (
                <Check className="size-3" aria-hidden />
              )}
              {moveState === 'saving' ? 'Saving' : 'Saved'}
            </span>
          ) : statuses && onMove && !isOverlay ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconButton
                  variant="ghost"
                  className="size-5 text-muted-foreground"
                  label={`Move ${task.key} to another status`}
                  onPointerDown={(event) => event.stopPropagation()}
                  onPointerUp={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <MoveRight className="size-3.5" aria-hidden />
                </IconButton>
              </DropdownMenuTrigger>
              {/* Radix portals the menu, but React still bubbles its events
                  through this component, so the card's click-to-open must not
                  see them. */}
              <DropdownMenuContent
                align="end"
                onPointerDown={(event) => event.stopPropagation()}
                onPointerUp={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
              >
                <DropdownMenuLabel className="text-xs">Move to</DropdownMenuLabel>
                {statuses
                  .filter((status) => status.id !== task.status.id)
                  .map((status) => (
                    <DropdownMenuItem key={status.id} onSelect={() => onMove(task, status.id)}>
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: status.color }}
                        aria-hidden
                      />
                      {status.name}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </span>
      </div>

      <p className="text-sm leading-snug font-medium break-anywhere">{task.title}</p>

      <LabelChips labels={task.labels} max={3} />

      <div className="flex flex-wrap items-center gap-1.5">
        {task.phase ? <PhaseBadge phase={task.phase} /> : null}
        <QaBadge status={task.qaStatus} />
        <DueDateBadge date={task.dueDate} />
        {task.issue ? (
          <span
            className="inline-flex items-center gap-1 rounded-full border px-1.5 text-[10px] text-muted-foreground"
            title={`Fixes ${task.issue.key}: ${task.issue.title}`}
          >
            <Bug className="size-2.5" aria-hidden />
            {task.issue.key}
          </span>
        ) : null}
      </div>

      {/* A bar rather than a number: on a board you are scanning columns, and
          a row of percentages is harder to read at a glance than a row of
          fills. Hidden at 0 and on cancelled cards, where it says nothing. */}
      {task.status.category !== 'CANCELED' &&
      (task.progress > 0 || task.status.category === 'DONE') ? (
        <ProgressBar value={task.status.category === 'DONE' ? 100 : task.progress} fill />
      ) : null}

      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {task.counts.subtasks > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Workflow className="size-3" aria-hidden />
              {task.counts.subtasks}
            </span>
          ) : null}
          {task.counts.comments > 0 ? (
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="size-3" aria-hidden />
              {task.counts.comments}
            </span>
          ) : null}
          {task.counts.attachments > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Paperclip className="size-3" aria-hidden />
              {task.counts.attachments}
            </span>
          ) : null}
        </div>
        <AvatarStack users={task.assignees} max={3} size="xs" label="Assignees" />
      </div>
    </article>
  );
}
