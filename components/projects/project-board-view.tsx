'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { CenteredSpinner } from '@/components/common/loading';
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { TaskFilterBar } from '@/components/tasks/task-filter-bar';
import { Button } from '@/components/ui/button';
import { useProject, useProjectMembers } from '@/lib/hooks/use-projects';
import type { TaskFilters } from '@/lib/hooks/use-tasks';

export function ProjectBoardView({ projectKey }: { projectKey: string }) {
  const { data: project } = useProject(projectKey);
  const { data: members } = useProjectMembers(projectKey);
  const [filters, setFilters] = useState<TaskFilters>({ topLevelOnly: false });
  const [createOpen, setCreateOpen] = useState(false);

  if (!project) return <CenteredSpinner />;

  const permissions = new Set(project.myPermissions);
  const can = (permission: string) => permissions.has('*') || permissions.has(permission);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <TaskFilterBar
          filters={filters}
          onChange={setFilters}
          project={project}
          members={members ?? []}
          showGroupBy={false}
        />
        {can('task:create') ? (
          // On a phone the filter bar fills the row, so a right-aligned button
          // lands on a line of its own — give it the whole line instead.
          <Button
            size="sm"
            className="h-9 gap-1.5 max-sm:w-full sm:ml-auto"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" aria-hidden />
            New task
          </Button>
        ) : null}
      </div>

      <KanbanBoard
        projectKey={project.key}
        projectId={project.id}
        filters={filters}
        canCreate={can('task:create')}
        canMove={can('task:change_status')}
      />

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultProjectKey={project.key}
      />
    </div>
  );
}
