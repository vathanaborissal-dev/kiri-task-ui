'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, qs } from '@/lib/api';
import {
  isSampleProject,
  sampleMembers,
  sampleProject,
} from '@/lib/sample-project';
import type {
  Milestone,
  MeResponse,
  Paged,
  PhaseRef,
  ProjectDetail,
  ProjectListItem,
  ProjectMember,
  TaskStatusRef,
  UserSummary,
} from '@/lib/types';

export type ProjectFilters = {
  search?: string;
  status?: string;
  includeArchived?: boolean;
  sort?: 'name' | 'createdAt' | 'targetDate' | 'progress';
  page?: number;
  pageSize?: number;
};

export const projectKeys = {
  all: ['projects'] as const,
  list: (filters: ProjectFilters) => ['projects', 'list', filters] as const,
  detail: (idOrKey: string) => ['projects', 'detail', idOrKey] as const,
  members: (idOrKey: string) => ['projects', idOrKey, 'members'] as const,
  assignable: (idOrKey: string) => ['projects', idOrKey, 'assignable'] as const,
  milestones: (idOrKey: string) => ['projects', idOrKey, 'milestones'] as const,
};

export const useProjects = (filters: ProjectFilters = {}) =>
  useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: () => api<Paged<ProjectListItem>>(`/projects${qs({ pageSize: 50, ...filters })}`),
  });

export const useProject = (idOrKey: string | undefined) =>
  useQuery({
    queryKey: projectKeys.detail(idOrKey ?? ''),
    // The tour's stand-in project has no row behind it; serve the fixture from
    // the same hook so every project screen renders unchanged.
    queryFn: () =>
      isSampleProject(idOrKey)
        ? Promise.resolve(sampleProject)
        : api<{ data: ProjectDetail }>(`/projects/${idOrKey}`).then((r) => r.data),
    enabled: Boolean(idOrKey),
  });

export const useProjectMembers = (idOrKey: string | undefined) =>
  useQuery({
    queryKey: projectKeys.members(idOrKey ?? ''),
    queryFn: () =>
      isSampleProject(idOrKey)
        ? Promise.resolve(sampleMembers)
        : api<{ data: ProjectMember[] }>(`/projects/${idOrKey}/members`).then((r) => r.data),
    enabled: Boolean(idOrKey),
  });

export const useAssignableUsers = (idOrKey: string | undefined) =>
  useQuery({
    queryKey: projectKeys.assignable(idOrKey ?? ''),
    queryFn: () =>
      api<{ data: UserSummary[] }>(`/projects/${idOrKey}/assignable-users`).then((r) => r.data),
    enabled: Boolean(idOrKey),
  });

export const useMilestones = (idOrKey: string | undefined) =>
  useQuery({
    queryKey: projectKeys.milestones(idOrKey ?? ''),
    queryFn: () =>
      api<{ data: Milestone[] }>(`/projects/${idOrKey}/milestones`).then((r) => r.data),
    enabled: Boolean(idOrKey),
  });

const invalidateProject = (queryClient: ReturnType<typeof useQueryClient>, idOrKey?: string) => {
  void queryClient.invalidateQueries({ queryKey: projectKeys.all });
  if (idOrKey) void queryClient.invalidateQueries({ queryKey: projectKeys.detail(idOrKey) });
  void queryClient.invalidateQueries({ queryKey: ['me'] });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api<{ data: ProjectDetail }>('/projects', { method: 'POST', body }).then((r) => r.data),
    onSuccess: () => invalidateProject(queryClient),
  });
};

export const useUpdateProject = (idOrKey: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api<{ data: ProjectDetail }>(`/projects/${idOrKey}`, { method: 'PATCH', body }).then(
        (r) => r.data,
      ),
    onSuccess: () => invalidateProject(queryClient, idOrKey),
  });
};

export const useArchiveProject = (idOrKey: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (restore: boolean) =>
      api<{ data: Pick<ProjectDetail, 'id' | 'key' | 'status' | 'archivedAt'> }>(
        `/projects/${idOrKey}/archive`,
        { method: 'POST', body: { restore } },
      ).then((response) => response.data),
    onSuccess: (project, restore) => {
      if (!restore) {
        queryClient.setQueryData<MeResponse>(['me'], (current) =>
          current
            ? {
                ...current,
                projects: current.projects.filter((item) => item.id !== project.id),
              }
            : current,
        );
        queryClient.setQueriesData<Paged<ProjectListItem>>(
          {
            predicate: ({ queryKey }) =>
              queryKey[0] === projectKeys.all[0] && queryKey[1] === 'list',
          },
          (current) => {
            if (!current) return current;
            const data = current.data.filter((item) => item.id !== project.id);
            return {
              ...current,
              data,
              meta: {
                ...current.meta,
                total: Math.max(0, current.meta.total - (current.data.length - data.length)),
              },
            };
          },
        );
      }
      invalidateProject(queryClient, idOrKey);
    },
  });
};

export const useDeleteProject = (idOrKey: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (confirm: string) =>
      api(`/projects/${idOrKey}`, { method: 'DELETE', body: { confirm } }),
    onSuccess: () => invalidateProject(queryClient),
  });
};

export const useProjectMemberMutations = (idOrKey: string) => {
  const queryClient = useQueryClient();
  const done = () => {
    void queryClient.invalidateQueries({ queryKey: projectKeys.members(idOrKey) });
    void queryClient.invalidateQueries({ queryKey: projectKeys.detail(idOrKey) });
    void queryClient.invalidateQueries({ queryKey: projectKeys.assignable(idOrKey) });
  };

  return {
    add: useMutation({
      mutationFn: (body: { userId: string; roleId: string; responsibilities?: string | null }) =>
        api(`/projects/${idOrKey}/members`, { method: 'POST', body }),
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: ({ memberId, ...body }: { memberId: string; roleId?: string; responsibilities?: string | null }) =>
        api(`/projects/${idOrKey}/members/${memberId}`, { method: 'PATCH', body }),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (memberId: string) =>
        api(`/projects/${idOrKey}/members/${memberId}`, { method: 'DELETE' }),
      onSuccess: done,
    }),
  };
};

export const useProjectSettingsMutations = (idOrKey: string) => {
  const queryClient = useQueryClient();
  const done = () => {
    void queryClient.invalidateQueries({ queryKey: projectKeys.detail(idOrKey) });
    void queryClient.invalidateQueries({ queryKey: projectKeys.milestones(idOrKey) });
    void queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  return {
    createStatus: useMutation({
      mutationFn: (body: Record<string, unknown>) =>
        api<{ data: TaskStatusRef }>(`/projects/${idOrKey}/statuses`, { method: 'POST', body }),
      onSuccess: done,
    }),
    updateStatus: useMutation({
      mutationFn: ({ statusId, ...body }: { statusId: string } & Record<string, unknown>) =>
        api(`/projects/${idOrKey}/statuses/${statusId}`, { method: 'PATCH', body }),
      onSuccess: done,
    }),
    deleteStatus: useMutation({
      mutationFn: ({ statusId, moveToStatusId }: { statusId: string; moveToStatusId?: string }) =>
        api(`/projects/${idOrKey}/statuses/${statusId}`, {
          method: 'DELETE',
          body: { moveToStatusId },
        }),
      onSuccess: done,
    }),
    reorderStatuses: useMutation({
      mutationFn: (ids: string[]) =>
        api(`/projects/${idOrKey}/statuses/reorder`, { method: 'POST', body: { ids } }),
      onSuccess: done,
    }),
    createPhase: useMutation({
      mutationFn: (body: Record<string, unknown>) =>
        api<{ data: PhaseRef }>(`/projects/${idOrKey}/phases`, { method: 'POST', body }),
      onSuccess: done,
    }),
    updatePhase: useMutation({
      mutationFn: ({ phaseId, ...body }: { phaseId: string } & Record<string, unknown>) =>
        api(`/projects/${idOrKey}/phases/${phaseId}`, { method: 'PATCH', body }),
      onSuccess: done,
    }),
    deletePhase: useMutation({
      mutationFn: (phaseId: string) =>
        api(`/projects/${idOrKey}/phases/${phaseId}`, { method: 'DELETE' }),
      onSuccess: done,
    }),
    reorderPhases: useMutation({
      mutationFn: (ids: string[]) =>
        api(`/projects/${idOrKey}/phases/reorder`, { method: 'POST', body: { ids } }),
      onSuccess: done,
    }),
    createLabel: useMutation({
      mutationFn: (body: { name: string; color?: string }) =>
        api(`/projects/${idOrKey}/labels`, { method: 'POST', body }),
      onSuccess: done,
    }),
    updateLabel: useMutation({
      mutationFn: ({ labelId, ...body }: { labelId: string; name?: string; color?: string }) =>
        api(`/projects/${idOrKey}/labels/${labelId}`, { method: 'PATCH', body }),
      onSuccess: done,
    }),
    deleteLabel: useMutation({
      mutationFn: (labelId: string) =>
        api(`/projects/${idOrKey}/labels/${labelId}`, { method: 'DELETE' }),
      onSuccess: done,
    }),
    createMilestone: useMutation({
      mutationFn: (body: Record<string, unknown>) =>
        api(`/projects/${idOrKey}/milestones`, { method: 'POST', body }),
      onSuccess: done,
    }),
    updateMilestone: useMutation({
      mutationFn: ({ milestoneId, ...body }: { milestoneId: string } & Record<string, unknown>) =>
        api(`/projects/${idOrKey}/milestones/${milestoneId}`, { method: 'PATCH', body }),
      onSuccess: done,
    }),
    deleteMilestone: useMutation({
      mutationFn: (milestoneId: string) =>
        api(`/projects/${idOrKey}/milestones/${milestoneId}`, { method: 'DELETE' }),
      onSuccess: done,
    }),
  };
};
