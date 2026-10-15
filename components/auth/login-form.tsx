'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
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
import { Spinner } from '@/components/common/loading';
import { ApiError, api } from '@/lib/api';
import type { CurrentUser } from '@/lib/types';

export function LoginForm() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  /**
   * Shake the card on a refused sign-in.
   *
   * Driven imperatively rather than by toggling a class: a class needs a remount
   * (or a frame's gap) to replay, and remounting the card replays every
   * staggered entrance animation inside it, so the whole form appeared to fly in
   * again on each failure. This also lets a second identical rejection restart
   * the animation, which a boolean in state could not.
   */
  const shake = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    cardRef.current?.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-5px)' },
        { transform: 'translateX(4px)' },
        { transform: 'translateX(-3px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: 400, easing: 'ease-in-out' },
    );
  };

  const requestedNext = searchParams.get('next');

  /**
   * Where to land. Someone whose role is workspace-wide oversight wants the
   * portfolio, not a personal task list — but an explicit `next` (a shared
   * link, or a bounce off an expired session) always wins.
   */
  const landingFor = (user: CurrentUser) => {
    if (requestedNext) return requestedNext;
    const permissions = new Set(user.permissions);
    const may = (permission: string) => permissions.has('*') || permissions.has(permission);
    return may('project:view_all') && may('report:view') ? '/overview' : '/dashboard';
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await api<{ user: CurrentUser }>('/auth/login', {
        method: 'POST',
        body: { email, password },
        skipRefresh: true,
      });
      // A full load rather than a client transition: it guarantees the new
      // session starts from an empty cache, whatever the previous one left.
      queryClient.clear();
      window.location.href = result.user.mustChangePassword
        ? '/settings/security?first=1'
        : landingFor(result.user);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Could not sign in. Please try again.',
      );
      shake();
      setPending(false);
    }
  };

  // Only meaningful once a key has actually been pressed, so this reads the
  // modifier state from the event rather than tracking it.
  const trackCapsLock = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(event.getModifierState?.('CapsLock') ?? false);
  };

  return (
    <Card
      ref={cardRef}
      className="animate-in fade-in slide-in-from-bottom-1 gap-0 border bg-card py-0 ring-0 duration-200"
    >
      <CardHeader className="gap-0 space-y-3 border-b px-7 py-6">
        <CardDescription className="font-mono text-[11px] tracking-[0.15em] uppercase">
          Workspace access
        </CardDescription>
        <CardTitle className="text-2xl font-semibold tracking-[-0.02em]">Sign in</CardTitle>
      </CardHeader>
      <CardContent className="px-7 py-7">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              aria-invalid={error ? true : undefined}
              className="h-11 bg-background"
            />
          </Field>

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Link
                href="/forgot-password"
                className="font-mono text-[11px] tracking-[0.15em] text-muted-foreground uppercase underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={trackCapsLock}
                onKeyUp={trackCapsLock}
                onBlur={() => setCapsLock(false)}
                aria-invalid={error ? true : undefined}
                className="h-11 bg-background pr-11"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                // Stretched to the field's full height rather than centred with
                // a transform: `-translate-y-1/2` was silently not applying here,
                // leaving the icon half a button low. Matching the input's 44px
                // `pr-11` also lines the icon up with where the text stops.
                className="absolute inset-y-0 right-0 h-full w-11 text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide the password' : 'Show the password'}
                title={showPassword ? 'Hide the password' : 'Show the password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>

            {/* Mis-typing a password with caps lock on is the single most common
                reason a correct password is rejected — say so before they retry. */}
            {capsLock ? (
              <p
                role="status"
                className="animate-in fade-in slide-in-from-top-1 flex items-center gap-1.5 text-xs text-amber-600 duration-200 dark:text-amber-400"
              >
                <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
                Caps Lock is on
              </p>
            ) : null}

            {error ? (
              <FieldError className="animate-in fade-in slide-in-from-top-1 duration-200">
                {error}
              </FieldError>
            ) : null}
          </Field>

          <Button
            type="submit"
            className="h-11 w-full gap-2 font-mono text-[11px] tracking-[0.15em] uppercase"
            disabled={pending}
          >
            {pending ? (
              <>
                <Spinner />
                Signing in
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
