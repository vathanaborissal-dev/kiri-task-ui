'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';
import { useAuth } from './auth-provider';

/**
 * Subscribes to the API's server-sent event stream so the notification badge
 * and lists update without polling. EventSource reconnects on its own.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const source = new EventSource(`${API_URL}/notifications/stream`, {
      withCredentials: true,
    });

    source.addEventListener('notification', (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as {
          title: string;
          body?: string;
          url?: string;
        };
        toast(payload.title, {
          description: payload.body,
          ...(payload.url
            ? {
                action: {
                  label: 'Open',
                  onClick: () => {
                    window.location.href = payload.url!;
                  },
                },
              }
            : {}),
        });
      } catch {
        /* ignore malformed frames */
      }
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    source.addEventListener('unread', () => {
      void queryClient.invalidateQueries({ queryKey: ['me'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    return () => source.close();
  }, [queryClient, user]);

  return <>{children}</>;
}
