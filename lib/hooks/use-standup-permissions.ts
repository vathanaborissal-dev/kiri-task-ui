'use client';

import { useAuth } from '@/providers/auth-provider';

/**
 * `standup:view_team` can be held workspace-wide or on a single project, so the
 * answer to "is there a team view for me?" is the same question the API asks.
 */
export const useStandupPermissions = () => {
  const { canAnywhere } = useAuth();
  return { canSeeTeam: canAnywhere('standup:view_team') };
};
