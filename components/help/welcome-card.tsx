'use client';

import { ArrowRight, BookOpen, CircleHelp, Route, X } from 'lucide-react';
import Link from 'next/link';
import { useTour } from '@/providers/tour-provider';
import { IconButton } from '@/components/common/icon-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useMarkSeen } from '@/lib/hooks/use-seen';
import { useAuth } from '@/providers/auth-provider';

/**
 * Shown on the dashboard until somebody has been through the guide — either by
 * opening it or by dismissing this. One nudge, then it never comes back.
 */
export function WelcomeCard() {
  const { user } = useAuth();
  const markSeen = useMarkSeen();
  const { start } = useTour();

  if (!user || user.guideSeenAt) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex flex-wrap items-center gap-4 py-1">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="flex items-center gap-2 text-sm font-medium">
            <CircleHelp className="size-4 text-primary" aria-hidden />
            New here?
          </p>
          <p className="text-sm text-muted-foreground">
            New to task boards? Start with the simple guide, or take a two-minute tour of the real
            screens.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild className="gap-1.5">
            <Link href="/guide">
              <BookOpen className="size-4" aria-hidden />
              Start beginner guide
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
          <Button variant="ghost" className="gap-1.5" onClick={start}>
            <Route className="size-4" aria-hidden />
            Show me around
          </Button>
          <IconButton
            variant="ghost"
            className="size-8 text-muted-foreground"
            label="Dismiss — I know my way around"
            onClick={() => markSeen({ guide: true })}
          >
            <X className="size-4" aria-hidden />
          </IconButton>
        </div>
      </CardContent>
    </Card>
  );
}
