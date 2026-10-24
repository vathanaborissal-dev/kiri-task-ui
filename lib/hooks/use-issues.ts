'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, qs } from '@/lib/api';
import { isSampleProject, sampleIssues } from '@/lib/sample-project';
import type {
  Grouped,
  Issue,
  IssueStatus,
  IssueTransitionRow,
  IssueTransitions,
  Paged,
} from '@/lib/types';

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
  hasTasks?: boolean;
  sort?: 'createdAt' | 'updatedAt' | 'severity' | 'priority' | 'dueDate' | 'startDate' | 'status';
  order?: 'asc' | 'desc';
  groupBy?: 'none' | 'status' | 'severity' | 'assignee' | 'phase';
  page?: number;
  pageSize?: number;
};

export const issueKeys = {
  all: ['issues'] as const,
  list: (filters: IssueFilters) => ['issues', 'list', filters] as const,
  detail: (idOrKey: string) => ['issues', 'detail', idOrKey] as const,
  transitions: (idOrKey: string) => ['issues', 'transitions', idOrKey] as const,
  workflow: ['issues', 'workflow'] as const,
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

/**
 * The moves this viewer can make on this issue.
 *
 * Asked of the server rather than worked out in the browser: the table and the
 * permissions behind it are the API's, and a UI that guessed would either offer
 * a button that 409s or hide one that would have worked.
 */
export const useIssueTransitions = (idOrKey: string | undefined) =>
  useQuery({
    queryKey: issueKeys.transitions(idOrKey ?? ''),
    queryFn: () =>
      api<{ data: IssueTransitions }>(`/issues/${idOrKey}/transitions`).then((r) => r.data),
    enabled: Boolean(idOrKey),
  });

/** The whole status table, for the "who can change what" reference. */
export const useIssueWorkflow = (enabled = true) =>
  useQuery({
    queryKey: issueKeys.workflow,
    queryFn: () => api<{ data: IssueTransitionRow[] }>('/issues/workflow').then((r) => r.data),
    // Pure code-side data: it only changes when the app is redeployed.
    staleTime: 60 * 60 * 1000,
    enabled,
  });

const useIssueInvalidator = () => {
  const queryClient = useQueryClient();
  return (idOrKey?: string) => {
    void queryClient.invalidateQueries({ queryKey: issueKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['projects'] });
    void queryClient.invalidateQueries({ queryKey: ['activity'] });
    if (idOrKey) {
      void queryClient.invalidateQueries({ queryKey: issueKeys.detail(idOrKey) });
      void queryClient.invalidateQueries({ queryKey: issueKeys.transitions(idOrKey) });
    }
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

export const useBulkUpdateIssues = () => {
  const invalidate = useIssueInvalidator();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { issueIds: string[] } & Record<string, unknown>) =>
      api<{ updated: number; moved: number }>('/issues/bulk', { method: 'POST', body }),
    onSuccess: () => {
      invalidate();
      // A bulk status move can cancel tasks, so their lists are stale too.
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useCreateTaskFromIssue = () => {
  const invalidate = useIssueInvalidator();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      idOrKey,
      ...body
    }: {
      idOrKey: string;
      title?: string;
      assigneeIds?: string[];
      startDate?: string | null;
      dueDate?: string | null;
    }) =>
      api<{ data: { id: string; key: string }; url: string }>(`/issues/${idOrKey}/create-task`, {
        method: 'POST',
        body,
      }),
    onSuccess: (_d, v) => {
      invalidate(v.idOrKey);
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
