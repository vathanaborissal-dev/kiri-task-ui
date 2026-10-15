'use client';

import { Bug, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { CreateIssueDialog } from '@/components/issues/create-issue-dialog';
import { AppearancePanel } from '@/components/layout/appearance-panel';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { openCommandPalette } from '@/components/layout/command-palette';
import { NotificationBell } from '@/components/layout/notification-bell';
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/providers/auth-provider';

export function Topbar() {
  const { canAnywhere } = useAuth();
  const [taskOpen, setTaskOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <SidebarTrigger className="-ml-1 shrink-0" />
      {/* The separator primitive sets `self-stretch` for a vertical rule, which
          with a fixed height degrades to flex-start and pins it to the top of
          the bar. Override it outright. */}
      <Separator orientation="vertical" className="mr-1 hidden h-5 self-center! md:block" />
      <Breadcrumbs />

      {/* Everything else hangs off the right edge; breadcrumbs own the left. */}
      <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
        {/* A real search field on a laptop, an icon on a phone — same palette. */}
        <Button
          variant="outline"
          data-tour="topbar-search"
          className="mr-1 hidden h-9 w-56 justify-start gap-2 px-3 font-normal text-muted-foreground lg:flex"
          onClick={openCommandPalette}
        >
          <Search className="size-4 shrink-0" aria-hidden />
          <span className="truncate">Search…</span>
          <kbd className="ml-auto rounded border bg-muted px-1.5 font-mono text-[10px]">⌘K</kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={openCommandPalette}
          aria-label="Search"
        >
          <Search className="size-4" aria-hidden />
        </Button>

        {canAnywhere('issue:create') ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                data-tour="topbar-report-issue"
                onClick={() => setIssueOpen(true)}
                aria-label="Report an issue"
              >
                <Bug className="size-4" aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Report an issue</TooltipContent>
          </Tooltip>
        ) : null}

        {/* Appearance owns colour mode as well as preset and font, so there is
            no separate light/dark button. It therefore has to be reachable on a
            phone too, where it used to be hidden behind the `sm` breakpoint. */}
        <span className="inline-flex" data-tour="topbar-appearance">
          <AppearancePanel />
        </span>
        <NotificationBell />

        {canAnywhere('task:create') ? (
          <Button size="sm" className="ml-1 gap-1.5" onClick={() => setTaskOpen(true)}>
            <Plus className="size-4" aria-hidden />
            <span className="hidden lg:inline">New task</span>
            <span className="sr-only lg:hidden">New task</span>
          </Button>
        ) : null}
      </div>

      <CreateTaskDialog open={taskOpen} onOpenChange={setTaskOpen} />
      <CreateIssueDialog open={issueOpen} onOpenChange={setIssueOpen} />
    </header>
  );
}
