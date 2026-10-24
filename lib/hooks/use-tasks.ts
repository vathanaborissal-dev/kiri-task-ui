'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, qs } from '@/lib/api';
import {
  isSampleProject,
  sampleBoard,
  sampleGroupedTasks,
  sampleTaskList,
} from '@/lib/sample-project';
import type {
  BoardColumn,
  ChecklistItem,
  Grouped,
  Paged,
  ScheduleFeed,
  Task,
  TaskDetail,
} from '@/lib/types';

export type TaskFilters = {
  projectId?: string;
  search?: string;
  statusId?: string[];
  statusCategory?: string[];
  priority?: string[];
  type?: string[];
  qaStatus?: string[];
  phaseId?: string[];
  assigneeId?: string[];
  reporterId?: string;
  labelId?: string[];
  milestoneId?: string;
  releaseId?: string;
  parentTaskId?: string;
  issueId?: string;
  topLevelOnly?: boolean;
  unassigned?: boolean;
  overdue?: boolean;
  dueFrom?: string;
  dueTo?: string;
  dueWithinDays?: number;
  includeDone?: boolean;
  sort?: 'position' | 'dueDate' | 'priority' | 'progress' | 'createdAt' | 'updatedAt' | 'title' | 'key';
  order?: 'asc' | 'desc';
  groupBy?: 'none' | 'status' | 'assignee' | 'priority' | 'phase' | 'milestone';
  page?: number;
  pageSize?: number;
};

export const taskKeys = {
  all: ['tasks'] as const,
  list: (filters: TaskFilters) => ['tasks', 'list', filters] as const,
  board: (filters: TaskFilters) => ['tasks', 'board', filters] as const,
  detail: (idOrKey: string) => ['tasks', 'detail', idOrKey] as const,
  schedule: (params: Record<string, unknown>) => ['tasks', 'schedule', params] as const,
};

export const useTasks = (filters: TaskFilters = {}, enabled = true) =>
  useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () =>
      isSampleProject(filters.projectId)
        ? Promise.resolve(sampleTaskList)
        : api<Paged<Task>>(`/tasks${qs({ ...filters })}`),
    enabled,
  });

export const useGroupedTasks = (filters: TaskFilters, enabled = true) =>
  useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () =>
      isSampleProject(filters.projectId)
        ? Promise.resolve(sampleGroupedTasks)
        : api<Grouped<Task>>(`/tasks${qs({ ...filters })}`),
    enabled,
  });

export const useBoard = (filters: TaskFilters & { projectId: string }, enabled = true) =>
  useQuery({
    queryKey: taskKeys.board(filters),
    queryFn: () =>
      isSampleProject(filters.projectId)
        ? Promise.resolve(sampleBoard)
        : api<{ data: BoardColumn[] }>(`/tasks/board${qs(filters)}`).then((r) => r.data),
    enabled: enabled && Boolean(filters.projectId),
  });

export const useTask = (idOrKey: string | undefined) =>
  useQuery({
    queryKey: taskKeys.detail(idOrKey ?? ''),
    queryFn: () => api<{ data: TaskDetail }>(`/tasks/${idOrKey}`).then((r) => r.data),
    enabled: Boolean(idOrKey),
  });

export const useSchedule = (params: {
  from?: string;
  to?: string;
  projectId?: string;
  mine?: boolean;
}) =>
  useQuery({
    queryKey: taskKeys.schedule(params),
    queryFn: () => api<{ data: ScheduleFeed }>(`/tasks/schedule${qs(params)}`).then((r) => r.data),
  });

/** Invalidates every list/board/detail view that could show this task. */
export const useTaskInvalidator = () => {
  const queryClient = useQueryClient();
  return (idOrKey?: string) => {
    void queryClient.invalidateQueries({ queryKey: taskKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['projects'] });
    void queryClient.invalidateQueries({ queryKey: ['activity'] });
    // Moving a task can carry its issue forward (In Progress → Ready for
    // Testing), so the issue views have to be refetched as well.
    void queryClient.invalidateQueries({ queryKey: ['issues'] });
    if (idOrKey) void queryClient.invalidateQueries({ queryKey: taskKeys.detail(idOrKey) });
  };
};

export const useCreateTask = () => {
  const invalidate = useTaskInvalidator();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api<{ data: TaskDetail }>('/tasks', { method: 'POST', body }).then((r) => r.data),
    onSuccess: () => invalidate(),
  });
};

export const useUpdateTask = () => {
  const invalidate = useTaskInvalidator();
  return useMutation({
    mutationFn: ({ idOrKey, ...body }: { idOrKey: string } & Record<string, unknown>) =>
      api<{ data: TaskDetail }>(`/tasks/${idOrKey}`, { method: 'PATCH', body }).then((r) => r.data),
    onSuccess: (_data, variables) => invalidate(variables.idOrKey),
  });
};

/** Moves a card between columns in a cached board, counts included. */
const applyMove = (
  columns: BoardColumn[] | undefined,
  idOrKey: string,
  statusId: string,
  afterTaskId: string | null | undefined,
): BoardColumn[] | undefined => {
  if (!columns) return columns;

  const moving = columns
    .flatMap((column) => column.tasks)
    .find((task) => task.id === idOrKey || task.key === idOrKey);
  const target = columns.find((column) => column.status.id === statusId);
  if (!moving) return columns;

  const moved: Task | null = target ? { ...moving, status: target.status } : null;

  return columns.map((column) => {
    const without = column.tasks.filter((task) => task.id !== moving.id);
    const had = without.length !== column.tasks.length;

    if (column.status.id !== statusId) {
      return had ? { ...column, tasks: without, count: Math.max(0, column.count - 1) } : column;
    }

    // A filtered board may not render the destination column. In that case
    // removing the card from its visible source is still the correct preview.
    if (!moved) return column;

    // Dropping onto a card places this one directly beneath it.
    const at = afterTaskId ? without.findIndex((task) => task.id === afterTaskId) : -1;
    const tasks =
      at >= 0
        ? [...without.slice(0, at + 1), moved, ...without.slice(at + 1)]
        : [moved, ...without];

    return { ...column, tasks, count: had ? column.count : column.count + 1 };
  });
};

/**
 * Moving a card used to wait for the round trip before anything happened on
 * screen, then invalidate the world — so a drop felt laggy and could appear to
 * snap back. The move is applied to every cached board straight away and rolled
 * back only if the server refuses it.
 */
export const useMoveTask = () => {
  const queryClient = useQueryClient();
  const invalidate = useTaskInvalidator();
  const boards = { queryKey: ['tasks', 'board'] as const };

  return useMutation({
    mutationFn: ({
      idOrKey,
      statusId,
      afterTaskId,
    }: {
      idOrKey: string;
      statusId: string;
      afterTaskId?: string | null;
    }) => api<{ data: Task }>(`/tasks/${idOrKey}/move`, { method: 'POST', body: { statusId, afterTaskId } }),

    onMutate: async ({ idOrKey, statusId, afterTaskId }) => {
      const snapshot = queryClient.getQueriesData<BoardColumn[]>(boards);

      // Paint first. Waiting for cancellation here made the drag overlay
      // disappear before the card changed columns, which looked like a failed
      // drop on slower connections.
      const cancellation = queryClient.cancelQueries(boards);
      queryClient.setQueriesData<BoardColumn[]>(boards, (columns) =>
        applyMove(columns, idOrKey, statusId, afterTaskId),
      );

      // Cancellation can restore the pre-fetch value, so reapply the same
      // deterministic projection once it has settled.
      await cancellation;
      queryClient.setQueriesData<BoardColumn[]>(boards, (columns) =>
        applyMove(columns, idOrKey, statusId, afterTaskId),
      );
      return { snapshot };
    },

    onError: (_error, _variables, context) => {
      for (const [key, data] of context?.snapshot ?? []) queryClient.setQueryData(key, data);
    },

    // Either way, reconcile with the server — on success for the new position
    // and ordering, on failure to be sure the rollback matched reality.
    onSettled: (_data, _error, variables) => invalidate(variables.idOrKey),
  });
};

export const useDeleteTask = () => {
  const invalidate = useTaskInvalidator();
  return useMutation({
    mutationFn: (idOrKey: string) => api(`/tasks/${idOrKey}`, { method: 'DELETE' }),
    onSuccess: () => invalidate(),
  });
};

export const useBulkUpdateTasks = () => {
  const invalidate = useTaskInvalidator();
  return useMutation({
    mutationFn: (body: { taskIds: string[] } & Record<string, unknown>) =>
      api<{ updated: number }>('/tasks/bulk', { method: 'POST', body }),
    onSuccess: () => invalidate(),
  });
};

/**
 * Pulling another developer onto a task, and taking them back off.
 *
 * Separate from `useUpdateTask`'s `assigneeIds` because the API treats it as a
 * different act: anyone already on the task can ask for help, whereas replacing
 * the assignee list needs `task:assign`.
 */
export const useTaskHelpers = (taskIdOrKey: string) => {
  const invalidate = useTaskInvalidator();
  return {
    add: useMutation({
      mutationFn: (body: { userId: string; note?: string }) =>
        api<{ data: TaskDetail }>(`/tasks/${taskIdOrKey}/helpers`, { method: 'POST', body }).then(
          (r) => r.data,
        ),
      onSuccess: () => invalidate(taskIdOrKey),
    }),
    remove: useMutation({
      mutationFn: (userId: string) =>
        api<{ data: TaskDetail }>(`/tasks/${taskIdOrKey}/helpers/${userId}`, {
          method: 'DELETE',
        }).then((r) => r.data),
      onSuccess: () => invalidate(taskIdOrKey),
    }),
  };
};

export const useToggleWatch = () => {
  const invalidate = useTaskInvalidator();
  return useMutation({
    mutationFn: (idOrKey: string) =>
      api<{ watching: boolean }>(`/tasks/${idOrKey}/watch`, { method: 'POST' }),
    onSuccess: (_data, idOrKey) => invalidate(idOrKey),
  });
};

export const useChecklistMutations = (taskIdOrKey: string) => {
  const queryClient = useQueryClient();
  const done = () => {
    void queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskIdOrKey) });
    void queryClient.invalidateQueries({ queryKey: taskKeys.all });
  };

  return {
    add: useMutation({
      mutationFn: (body: { title: string; assigneeId?: string | null; dueDate?: string | null }) =>
        api<{ data: ChecklistItem }>(`/tasks/${taskIdOrKey}/checklist`, { method: 'POST', body }),
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: ({ itemId, ...body }: { itemId: string } & Record<string, unknown>) =>
        api(`/tasks/${taskIdOrKey}/checklist/${itemId}`, { method: 'PATCH', body }),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (itemId: string) =>
        api(`/tasks/${taskIdOrKey}/checklist/${itemId}`, { method: 'DELETE' }),
      onSuccess: done,
    }),
  };
};

export const useLinkMutations = (taskIdOrKey: string) => {
  const queryClient = useQueryClient();
  const done = () => {
    void queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskIdOrKey) });
  };

  return {
    add: useMutation({
      mutationFn: (body: { targetTaskId: string; type: string }) =>
        api(`/tasks/${taskIdOrKey}/links`, { method: 'POST', body }),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (linkId: string) =>
        api(`/tasks/${taskIdOrKey}/links/${linkId}`, { method: 'DELETE' }),
      onSuccess: done,
    }),
  };
};
