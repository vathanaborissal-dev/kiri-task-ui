'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, qs } from '@/lib/api';
import type { DailyPlan, DailyPlanItemKind, TeamDay } from '@/lib/types';

/** `YYYY-MM-DD` for right now, in the browser's own timezone. */
export const todayKey = (): string => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};

export const shiftDay = (key: string, days: number): string => {
  const date = new Date(`${key}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const standupKeys = {
  mine: (date: string) => ['standup', 'me', date] as const,
  team: (date: string) => ['standup', 'team', date] as const,
};

export const useMyDay = (date: string) =>
  useQuery({
    queryKey: standupKeys.mine(date),
    queryFn: () => api<{ data: DailyPlan }>(`/standup/me${qs({ date })}`).then((r) => r.data),
  });

export const useTeamDay = (date: string, enabled = true) =>
  useQuery({
    queryKey: standupKeys.team(date),
    queryFn: () => api<{ data: TeamDay }>(`/standup/team${qs({ date })}`).then((r) => r.data),
    enabled,
  });

/**
 * Every mutation returns the whole plan, so the cache is replaced rather than
 * patched — a bullet list is small and this keeps ordering honest.
 */
export const useDayMutations = (date: string) => {
  const queryClient = useQueryClient();

  const replace = (plan: DailyPlan) => {
    queryClient.setQueryData(standupKeys.mine(date), plan);
    void queryClient.invalidateQueries({ queryKey: ['standup', 'team'] });
  };

  const addItem = useMutation({
    mutationFn: (input: { body: string; kind: DailyPlanItemKind; taskId?: string | null }) =>
      api<{ data: DailyPlan }>('/standup/me/items', {
        method: 'POST',
        body: { date, ...input },
      }).then((r) => r.data),
    onSuccess: replace,
  });

  const updateItem = useMutation({
    mutationFn: ({
      itemId,
      ...body
    }: {
      itemId: string;
      body?: string;
      kind?: DailyPlanItemKind;
      isDone?: boolean;
      resolved?: boolean;
    }) =>
      api<{ data: DailyPlan }>(`/standup/items/${itemId}`, { method: 'PATCH', body }).then(
        (r) => r.data,
      ),
    onSuccess: replace,
  });

  const deleteItem = useMutation({
    mutationFn: (itemId: string) =>
      api<{ data: DailyPlan }>(`/standup/items/${itemId}`, { method: 'DELETE' }).then(
        (r) => r.data,
      ),
    onSuccess: replace,
  });

  const reorder = useMutation({
    mutationFn: (itemIds: string[]) =>
      api<{ data: DailyPlan }>('/standup/me/items/reorder', {
        method: 'POST',
        body: { itemIds },
      }).then((r) => r.data),
    onSuccess: replace,
  });

  const saveNote = useMutation({
    mutationFn: (note: string | null) =>
      api<{ data: DailyPlan }>('/standup/me', { method: 'PUT', body: { date, note } }).then(
        (r) => r.data,
      ),
    onSuccess: replace,
  });

  return { addItem, updateItem, deleteItem, reorder, saveNote };
};
