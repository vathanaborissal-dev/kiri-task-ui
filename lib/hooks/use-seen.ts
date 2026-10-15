'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { api } from '@/lib/api';

/**
 * Records that this person has read the changelog or the guide. Stored on the
 * account so the dot does not come back on their next machine, and failures are
 * swallowed — not being told about a release twice is not worth a toast.
 */
export const useMarkSeen = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (what: { changelog?: boolean; guide?: boolean }) => {
      void api('/auth/me/seen', { method: 'POST', body: what })
        .then(() => queryClient.invalidateQueries({ queryKey: ['me'] }))
        .catch(() => undefined);
    },
    [queryClient],
  );
};
