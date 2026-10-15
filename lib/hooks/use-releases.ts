'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, qs } from '@/lib/api';
import {
  isSampleProject,
  sampleHotfixes,
  samplePhaseBoard,
  sampleReleases,
} from '@/lib/sample-project';
import type { Hotfix, Paged, PhaseBoard, Release, ReleaseDetail } from '@/lib/types';

export type ReleaseFilters = {
  projectId?: string;
  status?: string[];
  phaseId?: string[];
  isHotfix?: boolean;
  search?: string;
  sort?: 'createdAt' | 'plannedDate' | 'releasedAt' | 'version';
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
};

export const releaseKeys = {
  all: ['releases'] as const,
  list: (filters: ReleaseFilters) => ['releases', 'list', filters] as const,
  detail: (id: string) => ['releases', 'detail', id] as const,
  phaseBoard: (projectId: string) => ['releases', 'phase-board', projectId] as const,
};

export const useReleases = (filters: ReleaseFilters = {}, enabled = true) =>
  useQuery({
    queryKey: releaseKeys.list(filters),
    queryFn: () =>
      isSampleProject(filters.projectId)
        ? Promise.resolve(sampleReleases)
        : api<Paged<Release>>(`/releases${qs({ pageSize: 50, ...filters })}`),
    enabled,
  });

export const useRelease = (id: string | undefined) =>
  useQuery({
    queryKey: releaseKeys.detail(id ?? ''),
    queryFn: () => api<{ data: ReleaseDetail }>(`/releases/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });

export const usePhaseBoard = (projectId: string | undefined) =>
  useQuery({
    queryKey: releaseKeys.phaseBoard(projectId ?? ''),
    queryFn: () =>
      isSampleProject(projectId)
        ? Promise.resolve(samplePhaseBoard)
        : api<{ data: PhaseBoard }>(`/releases/phase-board${qs({ projectId })}`).then((r) => r.data),
    enabled: Boolean(projectId),
  });

const useReleaseInvalidator = () => {
  const queryClient = useQueryClient();
  return (id?: string) => {
    void queryClient.invalidateQueries({ queryKey: releaseKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    if (id) void queryClient.invalidateQueries({ queryKey: releaseKeys.detail(id) });
  };
};

export const useCreateRelease = () => {
  const invalidate = useReleaseInvalidator();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api<{ data: Release }>('/releases', { method: 'POST', body }).then((r) => r.data),
    onSuccess: () => invalidate(),
  });
};

export const useUpdateRelease = () => {
  const invalidate = useReleaseInvalidator();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      api<{ data: Release }>(`/releases/${id}`, { method: 'PATCH', body }).then((r) => r.data),
    onSuccess: (_d, v) => invalidate(v.id),
  });
};

export const useDeleteRelease = () => {
  const invalidate = useReleaseInvalidator();
  return useMutation({
    mutationFn: (id: string) => api(`/releases/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidate(),
  });
};

export const useUpdateReleaseScope = (id: string) => {
  const invalidate = useReleaseInvalidator();
  return useMutation({
    mutationFn: (body: { taskIds?: string[]; issueIds?: string[]; mode: 'add' | 'remove' | 'set' }) =>
      api(`/releases/${id}/scope`, { method: 'POST', body }),
    onSuccess: () => invalidate(id),
  });
};

export const useRecordDeployment = (id: string) => {
  const invalidate = useReleaseInvalidator();
  return useMutation({
    mutationFn: (body: { phaseId: string; status?: string; notes?: string | null; deployedAt?: string | null }) =>
      api(`/releases/${id}/deployments`, { method: 'POST', body }),
    onSuccess: () => invalidate(id),
  });
};

// --- Hotfixes --------------------------------------------------------------

export type HotfixFilters = {
  projectId?: string;
  status?: string[];
  severity?: string[];
  assigneeId?: string[];
  openOnly?: boolean;
  search?: string;
  sort?: 'createdAt' | 'dueDate' | 'severity' | 'status';
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
};

export const hotfixKeys = {
  all: ['hotfixes'] as const,
  list: (filters: HotfixFilters) => ['hotfixes', 'list', filters] as const,
  detail: (idOrKey: string) => ['hotfixes', 'detail', idOrKey] as const,
};

export const useHotfixes = (filters: HotfixFilters = {}, enabled = true) =>
  useQuery({
    queryKey: hotfixKeys.list(filters),
    queryFn: () =>
      isSampleProject(filters.projectId)
        ? Promise.resolve(sampleHotfixes)
        : api<Paged<Hotfix>>(`/hotfixes${qs({ pageSize: 50, ...filters })}`),
    enabled,
  });

export const useHotfix = (idOrKey: string | undefined) =>
  useQuery({
    queryKey: hotfixKeys.detail(idOrKey ?? ''),
    queryFn: () => api<{ data: Hotfix }>(`/hotfixes/${idOrKey}`).then((r) => r.data),
    enabled: Boolean(idOrKey),
  });

const useHotfixInvalidator = () => {
  const queryClient = useQueryClient();
  return (idOrKey?: string) => {
    void queryClient.invalidateQueries({ queryKey: hotfixKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    void queryClient.invalidateQueries({ queryKey: ['issues'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    if (idOrKey) void queryClient.invalidateQueries({ queryKey: hotfixKeys.detail(idOrKey) });
  };
};

export const useCreateHotfix = () => {
  const invalidate = useHotfixInvalidator();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api<{ data: Hotfix }>('/hotfixes', { method: 'POST', body }).then((r) => r.data),
    onSuccess: () => invalidate(),
  });
};

export const useUpdateHotfix = () => {
  const invalidate = useHotfixInvalidator();
  return useMutation({
    mutationFn: ({ idOrKey, ...body }: { idOrKey: string } & Record<string, unknown>) =>
      api<{ data: Hotfix }>(`/hotfixes/${idOrKey}`, { method: 'PATCH', body }).then((r) => r.data),
    onSuccess: (_d, v) => invalidate(v.idOrKey),
  });
};

export const useHotfixDecision = () => {
  const invalidate = useHotfixInvalidator();
  return useMutation({
    mutationFn: ({ idOrKey, approve, comment }: { idOrKey: string; approve: boolean; comment?: string }) =>
      api(`/hotfixes/${idOrKey}/decision`, { method: 'POST', body: { approve, comment } }),
    onSuccess: (_d, v) => invalidate(v.idOrKey),
  });
};

export const useDeleteHotfix = () => {
  const invalidate = useHotfixInvalidator();
  return useMutation({
    mutationFn: (idOrKey: string) => api(`/hotfixes/${idOrKey}`, { method: 'DELETE' }),
    onSuccess: () => invalidate(),
  });
};
