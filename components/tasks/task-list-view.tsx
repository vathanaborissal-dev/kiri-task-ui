'use client';

import { ListChecks, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/empty-state';
import { DateField } from '@/components/common/date-field';
import { CenteredSpinner, ListSkeleton, Spinner } from '@/components/common/loading';
import { ErrorState } from '@/components/common/error-state';
import { MultiSelect } from '@/components/common/multi-select';
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog';
import { TaskFilterBar } from '@/components/tasks/task-filter-bar';
import { TaskRow } from '@/components/tasks/task-row';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PRIORITY_META } from '@/lib/constants';
import { useProject, useProjectMembers } from '@/lib/hooks/use-projects';
import {
  useBulkUpdateTasks,
  useGroupedTasks,
  useTasks,
  type TaskFilters,
} from '@/lib/hooks/use-tasks';

export function TaskListView({ projectKey }: { projectKey: string }) {
  const { data: project } = useProject(projectKey);
  const { data: members } = useProjectMembers(projectKey);
  const [filters, setFilters] = useState<TaskFilters>({
    topLevelOnly: true,
    sort: 'dueDate',
    groupBy: 'none',
    pageSize: 50,
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  const grouped = filters.groupBy && filters.groupBy !== 'none';
  const scoped = { ...filters, projectId: project?.id };

  const flat = useTasks(scoped, Boolean(project) && !grouped);
  const groups = useGroupedTasks(scoped, Boolean(project) && Boolean(grouped));
  const bulkUpdate = useBulkUpdateTasks();

  if (!project) return <CenteredSpinner />;

  const permissions = new Set(project.myPermissions);
  const can = (permission: string) => permissions.has('*') || permissions.has(permission);

  const query = grouped ? groups : flat;
  const tasks = grouped ? [] : (flat.data?.data ?? []);

  const toggle = (id: string, isSelected: boolean) =>
    setSelected((current) =>
      isSelected ? [...current, id] : current.filter((value) => value !== id),
    );

  // Every task currently on screen, grouped or not — "select all" has to mean
  // what is visible, not what the filters would return on another page.
  const visibleIds = grouped
    ? (groups.data?.data ?? []).flatMap((group) => (group.tasks ?? []).map((task) => task.id))
    : tasks.map((task) => task.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

  const applyBulk = async (patch: Record<string, unknown>) => {
    const count = selected.length;
    try {
      const result = await bulkUpdate.mutateAsync({ taskIds: selected, ...patch });
      toast.success(
        `${result.updated} ${result.updated === 1 ? 'task' : 'tasks'} updated`,
      );
      setSelected([]);
    } catch (error) {
      // A refusal from the issue gate names the task and its issue, so it is
      // shown as written rather than flattened to "could not update".
      toast.error(error instanceof Error ? error.message : `Could not update those ${count} tasks`, {
        duration: 6000,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <TaskFilterBar
          filters={filters}
          onChange={setFilters}
          project={project}
          members={members ?? []}
        />
        {can('task:create') ? (
          <Button size="sm" className="ml-auto h-9 gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" aria-hidden />
            New task
          </Button>
        ) : null}
      </div>

      {visibleIds.length > 0 ? (
        <label className="flex w-fit cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <Checkbox
            checked={allVisibleSelected}
            onCheckedChange={(value) =>
              setSelected(value === true ? visibleIds : [])
            }
            aria-label="Select every task shown"
          />
          {allVisibleSelected
            ? `All ${visibleIds.length} shown selected`
            : `Select all ${visibleIds.length} shown`}
        </label>
      ) : null}

      {selected.length > 0 ? (
        <Card className="border-primary/40 bg-accent/30">
          <CardContent className="flex flex-wrap items-center gap-2 py-3">
            <span className="text-sm font-medium">
              {selected.length} selected
            </span>

            {can('task:change_status') ? (
              <Select onValueChange={(statusId) => void applyBulk({ statusId })}>
                <SelectTrigger size="sm" className="h-8 w-40">
                  <SelectValue placeholder="Move to status" />
                </SelectTrigger>
                <SelectContent>
                  {project.statuses.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {can('task:update') ? (
              <Select onValueChange={(priority) => void applyBulk({ priority })}>
                <SelectTrigger size="sm" className="h-8 w-36">
                  <SelectValue placeholder="Set priority" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_META).map(([value, meta]) => (
                    <SelectItem key={value} value={value}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {/* The headline reason for selecting several tasks: reporting the
                same percentage across a batch, one request instead of eight. */}
            {can('task:update') ? (
              <Select onValueChange={(value) => void applyBulk({ progress: Number(value) })}>
                <SelectTrigger size="sm" className="h-8 w-36">
                  <SelectValue placeholder="Set progress" />
                </SelectTrigger>
                <SelectContent>
                  {[0, 25, 50, 75, 100].map((step) => (
                    <SelectItem key={step} value={String(step)}>
                      {step}% done
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {can('task:manage_phase') ? (
              <Select onValueChange={(phaseId) => void applyBulk({ phaseId })}>
                <SelectTrigger size="sm" className="h-8 w-36">
                  <SelectValue placeholder="Move to phase" />
                </SelectTrigger>
                <SelectContent>
                  {project.phases.map((phase) => (
                    <SelectItem key={phase.id} value={phase.id}>
                      {phase.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {can('task:manage_deadline') ? (
              <div className="w-40">
                <DateField
                  value={null}
                  onChange={(dueDate) => (dueDate ? void applyBulk({ dueDate }) : undefined)}
                  placeholder="Set deadline"
                  label="Deadline for the selected tasks"
                />
              </div>
            ) : null}

            {can('task:assign') ? (
              <div className="w-48">
                <MultiSelect
                  options={(members ?? []).map((member) => ({
                    value: member.user.id,
                    label: member.user.name,
                  }))}
                  selected={[]}
                  onChange={(addAssigneeIds) =>
                    addAssigneeIds.length ? void applyBulk({ addAssigneeIds }) : undefined
                  }
                  placeholder="Assign to…"
                />
              </div>
            ) : null}

            {bulkUpdate.isPending ? <Spinner className="ml-1" /> : null}

            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-8 gap-1.5"
              onClick={() => setSelected([])}
            >
              <X className="size-3.5" aria-hidden />
              Clear
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : query.isLoading ? (
        <ListSkeleton rows={6} />
      ) : grouped ? (
        <div className="space-y-5">
          {(groups.data?.data ?? []).map((group) => (
            <section key={group.key} className="space-y-2">
              <div className="flex items-center gap-2">
                {group.color ? (
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: group.color }}
                    aria-hidden
                  />
                ) : null}
                <h3 className="text-sm font-medium">{group.label}</h3>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {group.tasks?.length ?? 0}
                </span>
              </div>
              <div className="space-y-2">
                {(group.tasks ?? []).map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    selected={selected.includes(task.id)}
                    onSelectedChange={(value) => toggle(task.id, value)}
                  />
                ))}
              </div>
            </section>
          ))}
          {(groups.data?.data.length ?? 0) === 0 ? (
            <EmptyState icon={ListChecks} title="No tasks match these filters" />
          ) : null}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No tasks match these filters"
          description="Try clearing a filter, or create the first task."
          action={
            can('task:create') ? (
              <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" aria-hidden />
                New task
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                selected={selected.includes(task.id)}
                onSelectedChange={(value) => toggle(task.id, value)}
              />
            ))}
          </div>

          {flat.data && flat.data.meta.totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3 pt-2">
              <p className="text-xs text-muted-foreground">
                Page {flat.data.meta.page} of {flat.data.meta.totalPages} ·{' '}
                {flat.data.meta.total} tasks
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={flat.data.meta.page <= 1}
                  onClick={() => setFilters({ ...filters, page: (filters.page ?? 1) - 1 })}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={flat.data.meta.page >= flat.data.meta.totalPages}
                  onClick={() => setFilters({ ...filters, page: (filters.page ?? 1) + 1 })}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultProjectKey={project.key}
      />
    </div>
  );
}
