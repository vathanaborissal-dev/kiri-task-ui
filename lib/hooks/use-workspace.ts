'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, qs } from '@/lib/api';
import { isSampleProject, sampleReport } from '@/lib/sample-project';
import type {
  AppNotification,
  DashboardOverview,
  Invitation,
  Issue,
  MyWork,
  NotificationPreference,
  ProjectRef,
  Paged,
  PermissionDefinition,
  PortfolioReport,
  ProjectReport,
  Role,
  SavedFilter,
  Session,
  TeamMember,
  TelegramStatus,
  UserSummary,
  WorkloadEntry,
} from '@/lib/types';

// --- Dashboard -------------------------------------------------------------

export const useOverview = () =>
  useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => api<{ data: DashboardOverview }>('/dashboard/overview').then((r) => r.data),
  });

export const useMyWork = () =>
  useQuery({
    queryKey: ['dashboard', 'my-work'],
    queryFn: () => api<{ data: MyWork }>('/dashboard/my-work').then((r) => r.data),
  });

/**
 * The portfolio report. Gated server-side on `project:view_all` + `report:view`,
 * so callers pass `enabled` rather than letting it 403 on every render.
 */
export const usePortfolio = (
  { weeks = 12, includeArchived = false }: { weeks?: number; includeArchived?: boolean } = {},
  enabled = true,
) =>
  useQuery({
    queryKey: ['dashboard', 'portfolio', weeks, includeArchived],
    queryFn: () =>
      api<{ data: PortfolioReport }>(
        `/dashboard/portfolio${qs({ weeks, includeArchived })}`,
      ).then((r) => r.data),
    enabled,
    placeholderData: (previous) => previous,
  });

export const useProjectReport = (projectId: string | undefined) =>
  useQuery({
    queryKey: ['dashboard', 'project', projectId],
    queryFn: () =>
      isSampleProject(projectId)
        ? Promise.resolve(sampleReport)
        : api<{ data: ProjectReport }>(`/dashboard/projects/${projectId}`).then((r) => r.data),
    enabled: Boolean(projectId),
  });

// --- People ----------------------------------------------------------------

export type UserFilters = {
  search?: string;
  roleId?: string;
  status?: 'all' | 'active' | 'inactive';
  projectId?: string;
  sort?: 'name' | 'createdAt' | 'lastLoginAt';
  page?: number;
  pageSize?: number;
};

export const useTeam = (filters: UserFilters = {}, enabled = true) =>
  useQuery({
    queryKey: ['users', filters],
    queryFn: () => api<Paged<TeamMember>>(`/users${qs({ pageSize: 100, ...filters })}`),
    enabled,
  });

export const useTeamMember = (userId: string | undefined) =>
  useQuery({
    queryKey: ['users', 'detail', userId],
    queryFn: () =>
      api<{
        data: TeamMember & {
          globalRole: { id: string; key: string; name: string; permissions: string[] };
          memberships: {
            responsibilities: string | null;
            joinedAt: string;
            project: { id: string; key: string; name: string; color: string; status: string };
            role: { id: string; key: string; name: string };
          }[];
          workload: {
            openTasks: number;
            openIssues: number;
            overdueTasks: number;
            blockedTasks: number;
            completedTasks: number;
            reportedIssues: number;
            openHotfixes: number;
          };
          completedWindowDays: number;
          issues: (Pick<Issue, 'id' | 'key' | 'title' | 'status' | 'severity' | 'dueDate'> & {
            project: ProjectRef;
          })[];
          recentlyCompleted: {
            id: string;
            key: string;
            title: string;
            completedAt: string | null;
            project: ProjectRef;
          }[];
        };
      }>(`/users/${userId}`).then((r) => r.data),
    enabled: Boolean(userId),
  });

export const useWorkload = (projectId?: string) =>
  useQuery({
    queryKey: ['users', 'workload', projectId],
    queryFn: () =>
      api<{ data: WorkloadEntry[] }>(`/users/workload${qs({ projectId })}`).then((r) => r.data),
  });

export const useInvitations = (enabled = true) =>
  useQuery({
    queryKey: ['users', 'invitations'],
    queryFn: () => api<{ data: Invitation[] }>('/users/invitations').then((r) => r.data),
    enabled,
  });

export const useUserMutations = () => {
  const queryClient = useQueryClient();
  const done = () => {
    void queryClient.invalidateQueries({ queryKey: ['users'] });
    void queryClient.invalidateQueries({ queryKey: ['me'] });
  };

  return {
    invite: useMutation({
      mutationFn: (body: {
        email: string;
        name?: string;
        roleId: string;
        projectGrants?: { projectId: string; roleId: string }[];
      }) =>
        api<{ data: Invitation; emailed: boolean; acceptUrl: string }>('/users/invitations', {
          method: 'POST',
          body,
        }),
      onSuccess: done,
    }),
    revokeInvitation: useMutation({
      mutationFn: (invitationId: string) =>
        api(`/users/invitations/${invitationId}`, { method: 'DELETE' }),
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: ({ userId, ...body }: { userId: string } & Record<string, unknown>) =>
        api<{ data: UserSummary }>(`/users/${userId}`, { method: 'PATCH', body }),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (userId: string) => api(`/users/${userId}`, { method: 'DELETE' }),
      onSuccess: done,
    }),
  };
};

// --- Roles -----------------------------------------------------------------

export const useRoles = (scope?: 'GLOBAL' | 'PROJECT', enabled = true) =>
  useQuery({
    queryKey: ['roles', scope ?? 'all'],
    queryFn: () => api<{ data: Role[] }>(`/roles${qs({ scope })}`).then((r) => r.data),
    staleTime: 5 * 60_000,
    enabled,
  });

export const usePermissionCatalogue = (enabled = true) =>
  useQuery({
    queryKey: ['roles', 'permissions'],
    queryFn: () =>
      api<{ groups: { group: string; permissions: PermissionDefinition[] }[] }>(
        '/roles/permissions',
      ).then((r) => r.groups),
    staleTime: 30 * 60_000,
    enabled,
  });

export const useRoleMutations = () => {
  const queryClient = useQueryClient();
  const done = () => {
    void queryClient.invalidateQueries({ queryKey: ['roles'] });
    void queryClient.invalidateQueries({ queryKey: ['me'] });
  };

  return {
    create: useMutation({
      mutationFn: (body: { name: string; description?: string | null; scope: 'GLOBAL' | 'PROJECT'; permissions: string[] }) =>
        api<{ data: Role }>('/roles', { method: 'POST', body }).then((r) => r.data),
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: ({ roleId, ...body }: { roleId: string } & Record<string, unknown>) =>
        api<{ data: Role }>(`/roles/${roleId}`, { method: 'PATCH', body }).then((r) => r.data),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (roleId: string) => api(`/roles/${roleId}`, { method: 'DELETE' }),
      onSuccess: done,
    }),
  };
};

// --- Notifications ---------------------------------------------------------

export const useNotifications = (unreadOnly = false, pageSize = 40) =>
  useQuery({
    queryKey: ['notifications', { unreadOnly, pageSize }],
    queryFn: () =>
      api<Paged<AppNotification> & { unread: number }>(
        `/notifications${qs({ unreadOnly, pageSize })}`,
      ),
  });

export const useNotificationPreferences = () =>
  useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: () =>
      api<{ data: NotificationPreference[]; telegramLinked: boolean }>(
        '/notifications/preferences',
      ),
  });

export const useNotificationMutations = () => {
  const queryClient = useQueryClient();
  const done = () => {
    void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    void queryClient.invalidateQueries({ queryKey: ['me'] });
  };

  return {
    markRead: useMutation({
      mutationFn: (body: { ids?: string[]; all?: boolean }) =>
        api<{ unread: number }>('/notifications/read', { method: 'POST', body }),
      onSuccess: done,
    }),
    markUnread: useMutation({
      mutationFn: (id: string) =>
        api<{ unread: number }>(`/notifications/${id}/unread`, { method: 'POST' }),
      onSuccess: done,
    }),
    clearRead: useMutation({
      mutationFn: () => api<{ deleted: number }>('/notifications/read', { method: 'DELETE' }),
      onSuccess: done,
    }),
    savePreferences: useMutation({
      mutationFn: (
        settings: { event: string; web?: boolean; telegram?: boolean; email?: boolean }[],
      ) => api('/notifications/preferences', { method: 'PUT', body: { settings } }),
      onSuccess: done,
    }),
  };
};

// --- Telegram --------------------------------------------------------------

export const useTelegramStatus = () =>
  useQuery({
    queryKey: ['telegram', 'status'],
    queryFn: () => api<{ data: TelegramStatus }>('/telegram/status').then((r) => r.data),
  });

export const useTelegramMutations = () => {
  const queryClient = useQueryClient();
  const done = () => {
    void queryClient.invalidateQueries({ queryKey: ['telegram'] });
    void queryClient.invalidateQueries({ queryKey: ['me'] });
    void queryClient.invalidateQueries({ queryKey: ['notifications', 'preferences'] });
  };

  return {
    createCode: useMutation({
      mutationFn: () =>
        api<{
          data: {
            code: string;
            expiresAt: string;
            expiresInMinutes: number;
            deepLink: string | null;
            botUsername: string | null;
          };
        }>('/telegram/link-code', { method: 'POST' }).then((r) => r.data),
    }),
    unlink: useMutation({
      mutationFn: () => api('/telegram/link', { method: 'DELETE' }),
      onSuccess: done,
    }),
    sendTest: useMutation({
      mutationFn: () => api('/telegram/test', { method: 'POST' }),
    }),
    refresh: done,
  };
};

// --- Sessions & profile ----------------------------------------------------

export const useSessions = () =>
  useQuery({
    queryKey: ['auth', 'sessions'],
    queryFn: () => api<{ data: Session[] }>('/auth/sessions').then((r) => r.data),
  });

export const useAccountMutations = () => {
  const queryClient = useQueryClient();
  return {
    updateProfile: useMutation({
      mutationFn: (body: Record<string, unknown>) => api('/auth/me', { method: 'PATCH', body }),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
    }),
    changePassword: useMutation({
      mutationFn: (body: { currentPassword: string; newPassword: string }) =>
        api<{ message: string }>('/auth/change-password', { method: 'POST', body }),
    }),
    revokeSession: useMutation({
      mutationFn: (sessionId: string) =>
        api(`/auth/sessions/${sessionId}`, { method: 'DELETE' }),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] }),
    }),
    revokeAllSessions: useMutation({
      mutationFn: () => api('/auth/sessions', { method: 'DELETE' }),
    }),
  };
};

// --- Saved filters ---------------------------------------------------------

export const useSavedFilters = (scope: 'TASK' | 'ISSUE', projectId?: string) =>
  useQuery({
    queryKey: ['filters', scope, projectId],
    queryFn: () => api<{ data: SavedFilter[] }>(`/filters${qs({ scope, projectId })}`).then((r) => r.data),
  });

export const useFilterMutations = () => {
  const queryClient = useQueryClient();
  const done = () => queryClient.invalidateQueries({ queryKey: ['filters'] });
  return {
    create: useMutation({
      mutationFn: (body: {
        name: string;
        scope: 'TASK' | 'ISSUE';
        query: Record<string, unknown>;
        projectId?: string | null;
        isShared?: boolean;
      }) => api<{ data: SavedFilter }>('/filters', { method: 'POST', body }),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (filterId: string) => api(`/filters/${filterId}`, { method: 'DELETE' }),
      onSuccess: done,
    }),
  };
};
