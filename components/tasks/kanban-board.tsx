'use client';

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { BoardSkeleton } from '@/components/common/loading';
import { ErrorState } from '@/components/common/error-state';
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog';
import { TaskCard } from '@/components/tasks/task-card';
import { IconButton } from '@/components/common/icon-button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useBoard, useMoveTask, type TaskFilters } from '@/lib/hooks/use-tasks';
import type { BoardColumn, Task, TaskStatusRef } from '@/lib/types';
import { cn } from '@/lib/utils';

function Column({
  column,
  statuses,
  canCreate,
  canMove,
  isFirstColumn,
  holdsTourCard,
  moveStates,
  onCreate,
  onMove,
}: {
  column: BoardColumn;
  statuses: TaskStatusRef[];
  canCreate: boolean;
  canMove: boolean;
  isFirstColumn: boolean;
  /** This column holds the card the guided tour points at. */
  holdsTourCard: boolean;
  moveStates: Record<string, 'saving' | 'saved'>;
  onCreate: (statusId: string) => void;
  onMove: (task: Task, statusId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.status.id,
    data: { type: 'column', statusId: column.status.id },
  });

  return (
    <div
      id={`board-column-${column.status.id}`}
      className="flex w-[min(80vw,18rem)] shrink-0 snap-start flex-col gap-2 sm:w-72"
    >
      {/* Not sticky: the board's scroller only moves horizontally, so a
          vertical `sticky` here resolved against that viewport and parked the
          header 56px down — on top of the first card, blurring out its key. */}
      <div
        {...(isFirstColumn ? { 'data-tour': 'board-column-header' } : {})}
        className="flex items-center gap-2 px-1"
      >
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: column.status.color }}
          aria-hidden
        />
        <h3 className="truncate text-sm font-medium">{column.status.name}</h3>
        <span className="text-xs text-muted-foreground tabular-nums">{column.count}</span>
        {canCreate ? (
          <IconButton
            variant="ghost"
            className="ml-auto size-6 text-muted-foreground"
            onClick={() => onCreate(column.status.id)}
            label={`New task in ${column.status.name}`}
          >
            <Plus className="size-3.5" aria-hidden />
          </IconButton>
        ) : null}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-32 flex-1 flex-col gap-2 rounded-xl border border-dashed bg-muted/20 p-2 transition-colors',
          isOver && 'border-primary/50 bg-accent/40',
        )}
      >
        <SortableContext
          items={column.tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task, position) => (
            <TaskCard
              key={task.id}
              task={task}
              // The tour points at a real card — the first one in the first
              // column that actually has any, since an empty Backlog is normal.
              {...(holdsTourCard && position === 0 ? { tourAnchor: 'board-card' } : {})}
              {...(canMove ? { statuses, onMove } : {})}
              moveState={moveStates[task.id]}
            />
          ))}
        </SortableContext>
        {column.tasks.length === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-muted-foreground">Nothing here</p>
        ) : null}
      </div>
    </div>
  );
}

export function KanbanBoard({
  projectKey,
  projectId,
  filters,
  canCreate,
  canMove,
}: {
  projectKey: string;
  projectId: string;
  filters: TaskFilters;
  canCreate: boolean;
  canMove: boolean;
}) {
  const { data, isLoading, isError, error, refetch } = useBoard({ ...filters, projectId });
  const moveTask = useMoveTask();
  const [active, setActive] = useState<Task | null>(null);
  const [createStatusId, setCreateStatusId] = useState<string | null>(null);
  const [moveStates, setMoveStates] = useState<Record<string, 'saving' | 'saved'>>({});
  const savedTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(
    () => () => {
      for (const timer of savedTimers.current.values()) clearTimeout(timer);
      savedTimers.current.clear();
    },
    [],
  );

  const sensors = useSensors(
    // Mouse: a few pixels of travel separates a drag from a click.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Touch: a short press, so a finger swiping the board still scrolls it
    // instead of picking a card up.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  /**
   * Scrolls a column into view from the chip row above the board. Moves the
   * board's own scroller rather than calling scrollIntoView, which would also
   * drag the page down past the column header.
   */
  const jumpTo = (statusId: string) => {
    const column = document.getElementById(`board-column-${statusId}`);
    const viewport = column?.closest<HTMLElement>('[data-radix-scroll-area-viewport]');
    if (!column || !viewport) return;
    viewport.scrollTo({ left: column.offsetLeft - 8, behavior: 'smooth' });
  };

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isLoading || !data) return <BoardSkeleton />;

  // The first column with anything in it, so the tour has a card to point at.
  const tourCardColumnId = data.find((column) => column.tasks.length > 0)?.status.id ?? null;

  /** Shared by drag-and-drop and the card's keyboard-reachable move menu. */
  const move = async (task: Task, statusId: string, afterTaskId: string | null = null) => {
    if (statusId === task.status.id && !afterTaskId) return;

    const existingTimer = savedTimers.current.get(task.id);
    if (existingTimer) clearTimeout(existingTimer);
    savedTimers.current.delete(task.id);
    setMoveStates((current) => ({ ...current, [task.id]: 'saving' }));

    try {
      await moveTask.mutateAsync({ idOrKey: task.key, statusId, afterTaskId });
      setMoveStates((current) => ({ ...current, [task.id]: 'saved' }));

      const timer = setTimeout(() => {
        setMoveStates((current) => {
          const next = { ...current };
          delete next[task.id];
          return next;
        });
        savedTimers.current.delete(task.id);
      }, 1_200);
      savedTimers.current.set(task.id, timer);
    } catch (caught) {
      setMoveStates((current) => {
        const next = { ...current };
        delete next[task.id];
        return next;
      });
      // A refusal from the issue gate names the issue and the way out ("KIRI-I4
      // is closed — reopen it before…"), which is longer than the default
      // toast stays up for.
      toast.error(caught instanceof Error ? caught.message : 'Could not move that task', {
        duration: 6000,
      });
    }
  };

  const onDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task | undefined;
    if (task) setActive(task);
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActive(null);
    const { active: dragged, over } = event;
    if (!over) return;

    const task = dragged.data.current?.task as Task | undefined;
    if (!task) return;

    const overData = over.data.current as
      | { type: 'column'; statusId: string }
      | { type: 'task'; task: Task }
      | undefined;

    const statusId =
      overData?.type === 'column'
        ? overData.statusId
        : overData?.type === 'task'
          ? overData.task.status.id
          : null;
    if (!statusId) return;

    // Dropping onto a card places this one directly beneath it.
    const afterTaskId =
      overData?.type === 'task' && overData.task.id !== task.id ? overData.task.id : null;

    await move(task, statusId, afterTaskId);
  };

  return (
    <>
      <DndContext
        sensors={canMove ? sensors : []}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={(event) => void onDragEnd(event)}
        onDragCancel={() => setActive(null)}
      >
        {/* On a phone the columns are off-screen, so give people a way to reach
            them that is not a guess about how far to swipe. */}
        <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:hidden">
          {data.map((column) => (
            <button
              key={column.status.id}
              type="button"
              onClick={() => jumpTo(column.status.id)}
              className="flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-accent"
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: column.status.color }}
                aria-hidden
              />
              {column.status.name}
              <span className="tabular-nums text-muted-foreground">{column.count}</span>
            </button>
          ))}
        </div>

        <ScrollArea className="w-full pb-3">
          <div className="flex snap-x snap-mandatory gap-4 lg:snap-none">
            {data.map((column, position) => (
              <Column
                key={column.status.id}
                column={column}
                isFirstColumn={position === 0}
                holdsTourCard={column.status.id === tourCardColumnId}
                statuses={data.map((entry) => entry.status)}
                canCreate={canCreate}
                canMove={canMove}
                moveStates={moveStates}
                onCreate={setCreateStatusId}
                onMove={(task, statusId) => void move(task, statusId)}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <DragOverlay>
          {active ? <TaskCard task={active} draggable={false} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      <CreateTaskDialog
        open={createStatusId !== null}
        onOpenChange={(open) => !open && setCreateStatusId(null)}
        defaultProjectKey={projectKey}
        {...(createStatusId ? { defaultStatusId: createStatusId } : {})}
      />
    </>
  );
}
