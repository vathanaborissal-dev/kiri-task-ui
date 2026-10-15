'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { CenteredSpinner, Spinner } from '@/components/common/loading';
import { UserAvatar } from '@/components/common/user-avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAccountMutations } from '@/lib/hooks/use-workspace';
import { useAuth } from '@/providers/auth-provider';

const TIMEZONES = [
  'Asia/Phnom_Penh',
  'Asia/Bangkok',
  'Asia/Ho_Chi_Minh',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Kolkata',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'UTC',
];

export function ProfileSettings() {
  const { user, projects, refresh } = useAuth();
  const { updateProfile } = useAccountMutations();
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);

  if (!user) return <CenteredSpinner />;

  const value = (key: string, fallback: unknown) =>
    draft && key in draft ? draft[key] : fallback;

  const save = async () => {
    if (!draft) return;
    try {
      await updateProfile.mutateAsync(draft);
      await refresh();
      setDraft(null);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save your profile');
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your profile</CardTitle>
          <CardDescription>
            This is how your teammates see you across tasks, comments and reports.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <UserAvatar user={user} size="xl" showTooltip={false} />
            <div className="space-y-1">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                {user.globalRole.name} · member of{' '}
                {projects.length === 1 ? '1 project' : `${projects.length} projects`}
              </p>
            </div>
          </div>

          <Field>
            <FieldLabel htmlFor="profile-name">Name</FieldLabel>
            <Input
              id="profile-name"
              value={String(value('name', user.name))}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="profile-job">Job title</FieldLabel>
            <Input
              id="profile-job"
              value={String(value('jobTitle', user.jobTitle ?? ''))}
              onChange={(event) => setDraft({ ...draft, jobTitle: event.target.value })}
              placeholder="Backend developer"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="profile-responsibilities">Responsibilities</FieldLabel>
            <Textarea
              id="profile-responsibilities"
              rows={3}
              value={String(value('responsibilities', ''))}
              onChange={(event) => setDraft({ ...draft, responsibilities: event.target.value })}
              placeholder="What you own day to day — the team sees this on your profile."
            />
            <FieldDescription>
              Project-specific responsibilities are set per project in its settings.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel>Time zone</FieldLabel>
            <Select
              value={String(value('timezone', user.timezone))}
              onValueChange={(timezone) => setDraft({ ...draft, timezone })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((zone) => (
                  <SelectItem key={zone} value={zone}>
                    {zone.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>Used for deadline reminders and Telegram messages.</FieldDescription>
          </Field>

          {draft ? (
            <div className="flex gap-2">
              <Button onClick={() => void save()} className="gap-2" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? <Spinner /> : null}
                Save changes
              </Button>
              <Button variant="ghost" onClick={() => setDraft(null)}>
                Cancel
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
