'use client';

import {
  Bug,
  Flame,
  GitBranch,
  ListChecks,
  Rocket,
  Settings,
  SquareKanban,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CenteredSpinner } from '@/components/common/loading';
import { ErrorState } from '@/components/common/error-state';
import { ProjectStatusBadge } from '@/components/common/badges';
import { AvatarStack } from '@/components/common/user-avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useProject } from '@/lib/hooks/use-projects';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '', label: 'Overview', icon: TrendingUp, permission: 'project:view' },
  { href: '/board', label: 'Board', icon: SquareKanban, permission: 'task:view' },
  { href: '/tasks', label: 'Tasks', icon: ListChecks, permission: 'task:view' },
  { href: '/issues', label: 'Issues', icon: Bug, permission: 'issue:view' },
  { href: '/phases', label: 'Phases', icon: GitBranch, permission: 'task:view' },
  { href: '/releases', label: 'Releases', icon: Rocket, permission: 'release:view' },
  { href: '/hotfixes', label: 'Hotfixes', icon: Flame, permission: 'hotfix:view' },
  { href: '/reports', label: 'Reports', icon: TrendingUp, permission: 'report:view' },
  { href: '/settings', label: 'Settings', icon: Settings, permission: 'project:view' },
];

export function ProjectShell({
  projectKey,
  children,
}: {
  projectKey: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: project, isLoading, isError, error, refetch } = useProject(projectKey);

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isLoading || !project) return <CenteredSpinner label="Loading project…" />;

  const base = `/projects/${project.key}`;
  const permissions = new Set(project.myPermissions);
  const can = (permission: string) => permissions.has('*') || permissions.has(permission);

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="size-3 shrink-0 rounded-full"
            style={{ backgroundColor: project.color }}
            aria-hidden
          />
          <h1 className="text-xl font-semibold tracking-tight">{project.name}</h1>
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
            {project.key}
          </span>
          <ProjectStatusBadge status={project.status} />
          {project.myRole ? (
            <span className="text-xs text-muted-foreground">You are {project.myRole.name}</span>
          ) : null}
          <div className="ml-auto">
            <AvatarStack users={project.members.map((m) => m.user)} max={5} label="Project team" />
          </div>
        </div>

        {/* The sidebar lists these sections already, so the tab row is dead
            weight whenever the sidebar is on screen. Below `lg` the sidebar is
            a closed sheet, and this is the only way through the project. */}
        <ScrollArea className="w-full lg:hidden">
          <nav className="flex gap-1 border-b pb-px" aria-label="Project sections">
            {TABS.filter((tab) => can(tab.permission)).map((tab) => {
              const href = `${base}${tab.href}`;
              const active = tab.href === '' ? pathname === base : pathname.startsWith(href);
              return (
                <Link
                  key={tab.href}
                  href={href}
                  className={cn(
                    'flex items-center gap-1.5 rounded-t-md border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors',
                    active
                      ? 'border-primary font-medium text-foreground'
                      : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                  )}
                >
                  <tab.icon className="size-3.5" aria-hidden />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {children}
    </div>
  );
}
