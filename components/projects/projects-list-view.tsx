'use client';

import { FolderKanban, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { CardsSkeleton } from '@/components/common/loading';
import { ErrorState } from '@/components/common/error-state';
import { PageHeader } from '@/components/common/page-header';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { ProjectProgressCard } from '@/components/projects/project-progress-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useProjects } from '@/lib/hooks/use-projects';
import { useAuth } from '@/providers/auth-provider';

export function ProjectsListView() {
  const { can } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [sort, setSort] = useState<'name' | 'createdAt' | 'targetDate' | 'progress'>('name');
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useProjects({
    ...(search ? { search } : {}),
    ...(status !== 'all' ? { status } : {}),
    includeArchived,
    sort,
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Projects"
        description="Every project you can see, with live progress."
        actions={
          can('project:create') ? (
            <Button className="gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" aria-hidden />
              New project
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1 sm:max-w-xs">
          <Search
            className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects…"
            className="h-9 pl-8"
          />
        </div>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger size="sm" className="h-9 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any status</SelectItem>
            <SelectItem value="PLANNING">Planning</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ON_HOLD">On hold</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(value) => setSort(value as typeof sort)}>
          <SelectTrigger size="sm" className="h-9 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="progress">Progress</SelectItem>
            <SelectItem value="targetDate">Target date</SelectItem>
            <SelectItem value="createdAt">Newest</SelectItem>
          </SelectContent>
        </Select>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Show archived
          <Switch checked={includeArchived} onCheckedChange={setIncludeArchived} />
        </label>
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <CardsSkeleton cards={4} />
      ) : (data?.data.length ?? 0) === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description={
            can('project:create')
              ? 'Create your first project to get a board, phases and releases.'
              : 'You have not been added to any project yet. Ask an administrator for access.'
          }
          action={
            can('project:create') ? (
              <Button className="gap-1.5" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" aria-hidden />
                New project
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data!.data.map((project) => (
            <ProjectProgressCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
