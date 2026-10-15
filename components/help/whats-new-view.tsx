'use client';

import { BadgeCheck, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Emphasis } from '@/components/help/emphasis';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHANGELOG, CHANGE_KIND_LABEL, type ChangeKind } from '@/lib/changelog';
import { formatDate } from '@/lib/format';
import { useMarkSeen } from '@/lib/hooks/use-seen';
import { cn } from '@/lib/utils';

const KIND_STYLE: Record<ChangeKind, string> = {
  new: 'bg-chart-1/15 text-chart-1 border-chart-1/30',
  improved: 'bg-chart-3/15 text-chart-3 border-chart-3/30',
  fixed: 'bg-muted text-muted-foreground',
};

export function WhatsNewView() {
  const markSeen = useMarkSeen();

  // Opening the page is what "read" means — clear the dot on the way in.
  useEffect(() => {
    markSeen({ changelog: true });
  }, [markSeen]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="What's new"
        description="Everything that has changed in Kiri Task, newest first."
        actions={
          <Button asChild variant="outline" className="gap-1.5">
            <Link href="/guide">
              <BookOpen className="size-4" aria-hidden />
              Beginner guide
            </Link>
          </Button>
        }
      />

      <ol className="space-y-4">
        {CHANGELOG.map((entry, index) => (
          <li key={entry.version}>
            <Card className={cn(index === 0 && 'border-primary/40')}>
              <CardHeader className="gap-1.5 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">{entry.title}</CardTitle>
                  <Badge variant="secondary" className="font-mono text-xs">
                    v{entry.version}
                  </Badge>
                  {index === 0 ? (
                    <Badge className="gap-1">
                      <BadgeCheck className="size-3" aria-hidden />
                      Latest
                    </Badge>
                  ) : null}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatDate(entry.date)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{entry.summary}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {entry.changes.map((change, changeIndex) => (
                    <li key={changeIndex} className="flex flex-wrap items-start gap-2 text-sm">
                      <span
                        className={cn(
                          'mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                          KIND_STYLE[change.kind],
                        )}
                      >
                        {CHANGE_KIND_LABEL[change.kind]}
                      </span>
                      <span className="min-w-0 flex-1 text-muted-foreground">
                        <Emphasis>{change.text}</Emphasis>
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </div>
  );
}
