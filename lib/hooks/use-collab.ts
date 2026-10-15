'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, qs } from '@/lib/api';
import type { ActivityEntry, Attachment, Comment, Paged, UserSummary } from '@/lib/types';

export type CommentTarget = {
  taskId?: string;
  issueId?: string;
  releaseId?: string;
  hotfixId?: string;
  projectId?: string;
};

const targetKey = (target: CommentTarget) =>
  target.taskId ?? target.issueId ?? target.hotfixId ?? target.releaseId ?? target.projectId ?? '';

export const useComments = (target: CommentTarget, enabled = true) =>
  useQuery({
    queryKey: ['comments', targetKey(target)],
    queryFn: () => api<Paged<Comment>>(`/comments${qs({ pageSize: 100, ...target })}`),
    enabled: enabled && Boolean(targetKey(target)),
  });

export const useMentionables = (projectId: string | undefined) =>
  useQuery({
    queryKey: ['mentionables', projectId],
    queryFn: () =>
      api<{ data: (UserSummary & { roleName: string })[] }>(
        `/comments/mentionables${qs({ projectId })}`,
      ).then((r) => r.data),
    enabled: Boolean(projectId),
    staleTime: 5 * 60_000,
  });

export const useCommentMutations = (target: CommentTarget) => {
  const queryClient = useQueryClient();
  const done = () => {
    void queryClient.invalidateQueries({ queryKey: ['comments', targetKey(target)] });
    void queryClient.invalidateQueries({ queryKey: ['activity'] });
    if (target.taskId) void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    if (target.issueId) void queryClient.invalidateQueries({ queryKey: ['issues'] });
  };

  return {
    create: useMutation({
      mutationFn: (body: { body: string; mentionUserIds?: string[]; attachmentIds?: string[]; parentId?: string }) =>
        api<{ data: Comment }>('/comments', { method: 'POST', body: { ...target, ...body } }),
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: ({ commentId, ...body }: { commentId: string; body: string; mentionUserIds?: string[] }) =>
        api(`/comments/${commentId}`, { method: 'PATCH', body }),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (commentId: string) => api(`/comments/${commentId}`, { method: 'DELETE' }),
      onSuccess: done,
    }),
  };
};

export const useUploadAttachments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ files, target }: { files: File[]; target: CommentTarget }) => {
      const formData = new FormData();
      for (const file of files) formData.append('files', file);
      for (const [key, value] of Object.entries(target)) {
        if (value) formData.append(key, value);
      }
      return api<{ data: Attachment[] }>('/attachments', { method: 'POST', formData }).then(
        (r) => r.data,
      );
    },
    onSuccess: (_d, v) => {
      if (v.target.taskId) void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (v.target.issueId) void queryClient.invalidateQueries({ queryKey: ['issues'] });
      if (v.target.hotfixId) void queryClient.invalidateQueries({ queryKey: ['hotfixes'] });
    },
  });
};

export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) =>
      api(`/attachments/${attachmentId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['issues'] });
      void queryClient.invalidateQueries({ queryKey: ['hotfixes'] });
    },
  });
};

export type ActivityFilters = {
  projectId?: string;
  taskId?: string;
  issueId?: string;
  hotfixId?: string;
  releaseId?: string;
  actorId?: string;
  entityType?: string;
  action?: string;
  page?: number;
  pageSize?: number;
};

export const useActivity = (filters: ActivityFilters, enabled = true) =>
  useQuery({
    queryKey: ['activity', filters],
    queryFn: () => api<Paged<ActivityEntry>>(`/activity${qs({ pageSize: 30, ...filters })}`),
    enabled,
  });

export const useAuditLog = (filters: ActivityFilters) =>
  useQuery({
    queryKey: ['activity', 'audit', filters],
    queryFn: () => api<Paged<ActivityEntry>>(`/activity/audit${qs({ pageSize: 50, ...filters })}`),
  });
