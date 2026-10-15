'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useMemo } from 'react';
import { api } from '@/lib/api';
import type { MeResponse, ProjectMembershipSummary } from '@/lib/types';

type AuthValue = {
  user: MeResponse['user'] | null;
  projects: ProjectMembershipSummary[];
  unreadNotifications: number;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  /** Workspace-level permission check. */
  can: (permission: string) => boolean;
  /** Project-level check, using the membership list loaded with the session. */
  canIn: (projectIdOrKey: string | null | undefined, permission: string) => boolean;
  /** True when the user holds the permission on at least one project. */
  canAnywhere: (permission: string) => boolean;
  projectsWith: (permission: string) => ProjectMembershipSummary[];
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<MeResponse>('/auth/me'),
    staleTime: 60_000,
    retry: false,
  });

  const permissions = useMemo(() => new Set(data?.user.permissions ?? []), [data]);
  const isAdmin = permissions.has('*');

  const can = useCallback(
    (permission: string) => isAdmin || permissions.has(permission),
    [isAdmin, permissions],
  );

  const projectPermissions = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const project of data?.projects ?? []) {
      const set = new Set(project.permissions);
      map.set(project.id, set);
      map.set(project.key, set);
    }
    return map;
  }, [data]);

  const canIn = useCallback(
    (projectIdOrKey: string | null | undefined, permission: string) => {
      if (isAdmin) return true;
      if (!projectIdOrKey) return can(permission);
      const set = projectPermissions.get(projectIdOrKey);
      if (!set) return can(permission);
      return set.has('*') || set.has(permission);
    },
    [can, isAdmin, projectPermissions],
  );

  const projectsWith = useCallback(
    (permission: string) =>
      (data?.projects ?? []).filter(
        (project) =>
          isAdmin ||
          permissions.has(permission) ||
          project.permissions.includes(permission) ||
          project.permissions.includes('*'),
      ),
    [data, isAdmin, permissions],
  );

  const canAnywhere = useCallback(
    (permission: string) => isAdmin || permissions.has(permission) || projectsWith(permission).length > 0,
    [isAdmin, permissions, projectsWith],
  );

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['me'] });
  }, [queryClient]);

  const value = useMemo<AuthValue>(
    () => ({
      user: data?.user ?? null,
      projects: data?.projects ?? [],
      unreadNotifications: data?.unreadNotifications ?? 0,
      isLoading,
      isError,
      error,
      can,
      canIn,
      canAnywhere,
      projectsWith,
      refresh,
    }),
    [data, isLoading, isError, error, can, canIn, canAnywhere, projectsWith, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
};

/** Convenience hook: the signed-in user, assumed present inside the app shell. */
export const useCurrentUser = () => {
  const { user } = useAuth();
  return user;
};
