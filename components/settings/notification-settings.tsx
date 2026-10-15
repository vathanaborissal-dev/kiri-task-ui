'use client';

import { Bell, Mail, Send } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { CenteredSpinner } from '@/components/common/loading';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  useNotificationMutations,
  useNotificationPreferences,
} from '@/lib/hooks/use-workspace';
import type { NotificationPreference } from '@/lib/types';

type Channel = 'web' | 'telegram' | 'email';

export function NotificationSettings() {
  const { data, isLoading, isError, error, refetch } = useNotificationPreferences();
  const { savePreferences } = useNotificationMutations();
  const [draft, setDraft] = useState<Record<string, Partial<Record<Channel, boolean>>>>({});

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isLoading || !data) return <CenteredSpinner label="Loading preferences…" />;

  const valueOf = (preference: NotificationPreference, channel: Channel) =>
    draft[preference.event]?.[channel] ?? preference[channel];

  const set = (event: string, channel: Channel, value: boolean) =>
    setDraft((current) => ({
      ...current,
      [event]: { ...current[event], [channel]: value },
    }));

  const groups = new Map<string, NotificationPreference[]>();
  for (const preference of data.data) {
    if (!groups.has(preference.group)) groups.set(preference.group, []);
    groups.get(preference.group)!.push(preference);
  }

  const dirty = Object.keys(draft).length > 0;

  const save = async () => {
    const settings = Object.entries(draft).map(([event, channels]) => ({ event, ...channels }));
    try {
      await savePreferences.mutateAsync(settings);
      setDraft({});
      toast.success('Notification preferences saved');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Could not save your preferences');
    }
  };

  return (
    <div className="space-y-5">
      {!data.telegramLinked ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-wrap items-center gap-3 pt-5">
            <Send className="size-4 shrink-0 text-primary" aria-hidden />
            <p className="min-w-0 flex-1 text-sm">
              Connect Telegram to know when work is assigned to you, someone comments, or someone
              mentions you. Every message includes a link to the right page.
            </p>
            <Button asChild size="sm">
              <Link href="/settings/telegram">Connect Telegram</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {[...groups.entries()].map(([group, preferences]) => (
        <Card key={group}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{group}</CardTitle>
            <CardDescription className="flex flex-wrap gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <Bell className="size-3.5" aria-hidden />
                In the app
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Send className="size-3.5" aria-hidden />
                Telegram
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-3.5" aria-hidden />
                Email
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {preferences.map((preference) => (
              <div
                key={preference.event}
                className="flex flex-wrap items-center gap-4 border-b pb-3 last:border-0 last:pb-0"
              >
                <div className="min-w-48 flex-1">
                  <p className="text-sm font-medium">{preference.label}</p>
                  <p className="text-xs text-muted-foreground">{preference.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  {(['web', 'telegram', 'email'] as Channel[]).map((channel) => (
                    <label
                      key={channel}
                      className="flex flex-col items-center gap-1 text-[10px] text-muted-foreground"
                    >
                      <Switch
                        checked={valueOf(preference, channel)}
                        disabled={channel === 'telegram' && !data.telegramLinked}
                        onCheckedChange={(value) => set(preference.event, channel, value)}
                        aria-label={`${preference.label} — ${channel}`}
                      />
                      {channel === 'web' ? 'App' : channel === 'telegram' ? 'Telegram' : 'Email'}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {dirty ? (
        <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-xl border bg-card/95 px-4 py-3 shadow-lg backdrop-blur">
          <p className="text-sm text-muted-foreground">You have unsaved changes.</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setDraft({})}>
              Discard
            </Button>
            <Button onClick={() => void save()} disabled={savePreferences.isPending}>
              Save preferences
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
