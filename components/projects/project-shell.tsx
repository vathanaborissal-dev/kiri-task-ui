'use client';

import { CenteredSpinner } from '@/components/common/loading';
import { ErrorState } from '@/components/common/error-state';
import { ProjectStatusBadge } from '@/components/common/badges';
import { AvatarStack } from '@/components/common/user-avatar';
import { useProject } from '@/lib/hooks/use-projects';

export function ProjectShell({
  projectKey,
  children,
}: {
  projectKey: string;
  children: React.ReactNode;
}) {
  const { data: project, isLoading, isError, error, refetch } = useProject(projectKey);

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isLoading || !project) return <CenteredSpinner label="Loading project…" />;

  return (
    <div className="space-y-5">
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

      {children}
    </div>
  );
}
