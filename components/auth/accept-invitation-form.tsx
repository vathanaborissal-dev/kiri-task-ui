'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PasswordRules } from '@/components/auth/password-rules';
import { CenteredSpinner, Spinner } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ApiError, api, qs } from '@/lib/api';

type InvitationPreview = {
  email: string;
  name: string | null;
  roleName: string;
  invitedBy: string;
};

export function AcceptInvitationForm() {
  const token = useSearchParams().get('token') ?? '';
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const { data, isLoading, isError, error: loadError } = useQuery({
    queryKey: ['invitation', token],
    queryFn: () => api<InvitationPreview>(`/auth/invitation${qs({ token })}`, { skipRefresh: true }),
    enabled: Boolean(token),
    retry: false,
  });

  useEffect(() => {
    if (data?.name) setName(data.name);
  }, [data]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirm) {
      setError('The two passwords do not match');
      return;
    }
    setPending(true);
    setError(null);
    try {
      await api('/auth/invitation/accept', {
        method: 'POST',
        body: { token, name, password },
        skipRefresh: true,
      });
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      router.replace('/dashboard');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not accept the invitation.');
      setPending(false);
    }
  };

  if (!token || isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">This invitation is not valid</CardTitle>
          <CardDescription>
            {loadError instanceof ApiError
              ? loadError.message
              : 'The link may have expired or already been used. Ask an administrator to send a new one.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Go to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) return <CenteredSpinner label="Checking your invitation…" />;

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Join the workspace</CardTitle>
        <CardDescription>
          {data.invitedBy} invited you as <strong className="text-foreground">{data.roleName}</strong>.
          Choose a password to finish setting up {data.email}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field>
            <FieldLabel htmlFor="name">Your name</FieldLabel>
            <Input
              id="name"
              required
              minLength={2}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Jane Doe"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <PasswordRules value={password} />
          </Field>
          <Field>
            <FieldLabel htmlFor="confirm">Confirm password</FieldLabel>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
            {error ? <FieldError>{error}</FieldError> : null}
          </Field>
          <Button type="submit" className="w-full gap-2" disabled={pending}>
            {pending ? <Spinner /> : null}
            Create my account
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
