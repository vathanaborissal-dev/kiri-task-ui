'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Laptop, LogOut, ShieldAlert } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { PasswordRules } from '@/components/auth/password-rules';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Spinner } from '@/components/common/loading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api';
import { formatDateTime, formatTimeAgo } from '@/lib/format';
import { useAccountMutations, useSessions } from '@/lib/hooks/use-workspace';
import { useAuth } from '@/providers/auth-provider';

/** Trims a user-agent down to something a person can recognise. */
const describeDevice = (userAgent: string | null): string => {
  if (!userAgent) return 'Unknown device';
  const browser =
    /Edg\//.test(userAgent) ? 'Edge'
    : /OPR\//.test(userAgent) ? 'Opera'
    : /Chrome\//.test(userAgent) ? 'Chrome'
    : /Safari\//.test(userAgent) ? 'Safari'
    : /Firefox\//.test(userAgent) ? 'Firefox'
    : 'Browser';
  const platform =
    /iPhone|iPad/.test(userAgent) ? 'iOS'
    : /Android/.test(userAgent) ? 'Android'
    : /Macintosh/.test(userAgent) ? 'macOS'
    : /Windows/.test(userAgent) ? 'Windows'
    : /Linux/.test(userAgent) ? 'Linux'
    : 'Unknown';
  return `${browser} on ${platform}`;
};

export function SecuritySettings() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const firstTime = useSearchParams().get('first') === '1';

  const { data: sessions } = useSessions();
  const { changePassword, revokeSession, revokeAllSessions } = useAccountMutations();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [signOutAllOpen, setSignOutAllOpen] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (next !== confirm) {
      setError('The two passwords do not match');
      return;
    }
    setError(null);
    try {
      await changePassword.mutateAsync({ currentPassword: current, newPassword: next });
      queryClient.clear();
      toast.success('Password updated', { description: 'Please sign in again.' });
      router.replace('/login');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not change your password');
    }
  };

  return (
    <div className="space-y-5">
      {firstTime || user?.mustChangePassword ? (
        <Alert>
          <ShieldAlert aria-hidden />
          <AlertTitle>Choose your own password</AlertTitle>
          <AlertDescription>
            You are signed in with a password that was generated for you. Set a new one now — you
            will be asked to sign in again afterwards.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Change your password</CardTitle>
          <CardDescription>
            Changing it signs you out everywhere, on every device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <Field>
              <FieldLabel htmlFor="current-password">Current password</FieldLabel>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                required
                value={current}
                onChange={(event) => setCurrent(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-password">New password</FieldLabel>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                value={next}
                onChange={(event) => setNext(event.target.value)}
              />
              <PasswordRules value={next} />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">Confirm new password</FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
              {error ? <FieldError>{error}</FieldError> : null}
            </Field>
            <Button type="submit" className="gap-2" disabled={changePassword.isPending}>
              {changePassword.isPending ? <Spinner /> : null}
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3 pb-3">
          <div className="space-y-1">
            <CardTitle className="text-base">Active sessions</CardTitle>
            <CardDescription>
              Where you are signed in. Sessions expire automatically after a day of inactivity.
            </CardDescription>
          </div>
          {(sessions?.length ?? 0) > 1 ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setSignOutAllOpen(true)}
            >
              <LogOut className="size-4" aria-hidden />
              Sign out everywhere
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-2">
          {(sessions ?? []).map((session) => (
            <div key={session.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
              <Laptop className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  {describeDevice(session.userAgent)}
                  {session.isCurrent ? (
                    <Badge variant="secondary" className="rounded px-1.5 text-[10px]">
                      this device
                    </Badge>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session.ipAddress ?? 'unknown address'} · started{' '}
                  {formatTimeAgo(session.createdAt)} · expires {formatDateTime(session.expiresAt)}
                </p>
              </div>
              {!session.isCurrent ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await revokeSession.mutateAsync(session.id);
                    toast.success('Session signed out');
                  }}
                >
                  Sign out
                </Button>
              ) : null}
            </div>
          ))}
          {(sessions?.length ?? 0) === 0 ? (
            <p className="py-3 text-sm text-muted-foreground">No other active sessions.</p>
          ) : null}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={signOutAllOpen}
        onOpenChange={setSignOutAllOpen}
        title="Sign out of every device?"
        description="You will need to sign in again here as well."
        confirmLabel="Sign out everywhere"
        destructive
        pending={revokeAllSessions.isPending}
        onConfirm={async () => {
          await revokeAllSessions.mutateAsync();
          queryClient.clear();
          router.replace('/login');
        }}
      />
    </div>
  );
}
