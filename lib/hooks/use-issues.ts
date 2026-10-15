'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, qs } from '@/lib/api';
import { isSampleProject, sampleIssues } from '@/lib/sample-project';
import type { Grouped, Issue, IssueStatus, Paged } from '@/lib/types';

export type IssueFilters = {
  projectId?: string;
  search?: string;
  status?: string[];
  severity?: string[];
  priority?: string[];
  phaseId?: string[];
  assigneeId?: string[];
  reporterId?: string;
  labelId?: string[];
  releaseId?: string;
  unassigned?: boolean;
  overdue?: boolean;
  openOnly?: boolean;
  sort?: 'createdAt' | 'updatedAt' | 'severity' | 'priority' | 'dueDate' | 'status';
  order?: 'asc' | 'desc';
  groupBy?: 'none' | 'status' | 'severity' | 'assignee' | 'phase';
  page?: number;
  pageSize?: number;
};

export const issueKeys = {
  all: ['issues'] as const,
  list: (filters: IssueFilters) => ['issues', 'list', filters] as const,
  detail: (idOrKey: string) => ['issues', 'detail', idOrKey] as const,
};

export const useIssues = (filters: IssueFilters = {}, enabled = true) =>
  useQuery({
    queryKey: issueKeys.list(filters),
    queryFn: () =>
      isSampleProject(filters.projectId)
        ? Promise.resolve(sampleIssues)
        : api<Paged<Issue>>(`/issues${qs({ ...filters })}`),
    enabled,
  });

export const useGroupedIssues = (filters: IssueFilters, enabled = true) =>
  useQuery({
    queryKey: issueKeys.list(filters),
    queryFn: () => api<Grouped<Issue>>(`/issues${qs({ ...filters })}`),
    enabled,
  });

export const useIssue = (idOrKey: string | undefined) =>
  useQuery({
    queryKey: issueKeys.detail(idOrKey ?? ''),
    queryFn: () => api<{ data: Issue }>(`/issues/${idOrKey}`).then((r) => r.data),
    enabled: Boolean(idOrKey),
  });

const useIssueInvalidator = () => {
  const queryClient = useQueryClient();
  return (idOrKey?: string) => {
    void queryClient.invalidateQueries({ queryKey: issueKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['projects'] });
    void queryClient.invalidateQueries({ queryKey: ['activity'] });
    if (idOrKey) void queryClient.invalidateQueries({ queryKey: issueKeys.detail(idOrKey) });
  };
};

export const useCreateIssue = () => {
  const invalidate = useIssueInvalidator();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api<{ data: Issue }>('/issues', { method: 'POST', body }).then((r) => r.data),
    onSuccess: () => invalidate(),
  });
};

export const useUpdateIssue = () => {
  const invalidate = useIssueInvalidator();
  return useMutation({
    mutationFn: ({ idOrKey, ...body }: { idOrKey: string } & Record<string, unknown>) =>
      api<{ data: Issue }>(`/issues/${idOrKey}`, { method: 'PATCH', body }).then((r) => r.data),
    onSuccess: (_d, v) => invalidate(v.idOrKey),
  });
};

export const useChangeIssueStatus = () => {
  const invalidate = useIssueInvalidator();
  return useMutation({
    mutationFn: ({
      idOrKey,
      status,
      comment,
    }: {
      idOrKey: string;
      status: IssueStatus;
      comment?: string;
    }) => api(`/issues/${idOrKey}/status`, { method: 'POST', body: { status, comment } }),
    onSuccess: (_d, v) => invalidate(v.idOrKey),
  });
};

export const useDeleteIssue = () => {
  const invalidate = useIssueInvalidator();
  return useMutation({
    mutationFn: (idOrKey: string) => api(`/issues/${idOrKey}`, { method: 'DELETE' }),
    onSuccess: () => invalidate(),
  });
};

export const useCreateTaskFromIssue = () => {
  const invalidate = useIssueInvalidator();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idOrKey: string) =>
      api<{ data: { id: string; key: string }; url: string }>(`/issues/${idOrKey}/create-task`, {
        method: 'POST',
      }),
    onSuccess: (_d, v) => {
      invalidate(v);
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useToggleIssueWatch = () => {
  const invalidate = useIssueInvalidator();
  return useMutation({
    mutationFn: (idOrKey: string) =>
      api<{ watching: boolean }>(`/issues/${idOrKey}/watch`, { method: 'POST' }),
    onSuccess: (_d, v) => invalidate(v),
  });
};
