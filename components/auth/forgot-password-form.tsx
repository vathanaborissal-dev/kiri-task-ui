'use client';

import { ArrowLeft, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Spinner } from '@/components/common/loading';
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
import { ApiError, api } from '@/lib/api';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email }, skipRefresh: true });
      setSent(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not send the email.');
    } finally {
      setPending(false);
    }
  };

  if (sent) {
    return (
      <Card>
        <CardHeader className="space-y-3">
          <div className="grid size-10 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <MailCheck className="size-5" aria-hidden />
          </div>
          <CardTitle className="text-lg">Check your email</CardTitle>
          <CardDescription>
            If {email} belongs to an account, a reset link is on its way. The link is valid for one
            hour.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full gap-2">
            <Link href="/login">
              <ArrowLeft className="size-4" aria-hidden />
              Back to sign in
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Reset your password</CardTitle>
        <CardDescription>We will email you a link to choose a new one.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
            />
            {error ? <FieldError>{error}</FieldError> : null}
          </Field>
          <Button type="submit" className="w-full gap-2" disabled={pending}>
            {pending ? <Spinner /> : null}
            Send reset link
          </Button>
          <Button asChild variant="ghost" className="w-full gap-2">
            <Link href="/login">
              <ArrowLeft className="size-4" aria-hidden />
              Back to sign in
            </Link>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
