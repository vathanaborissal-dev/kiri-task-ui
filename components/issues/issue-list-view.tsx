'use client';

import { Bug, Filter, Search, X } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { ListSkeleton } from '@/components/common/loading';
import { ErrorState } from '@/components/common/error-state';
import { MultiSelect } from '@/components/common/multi-select';
import { CreateIssueDialog } from '@/components/issues/create-issue-dialog';
import { IssueRow } from '@/components/issues/issue-row';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ISSUE_STATUS_META, PRIORITY_META, SEVERITY_META } from '@/lib/constants';
import { useGroupedIssues, useIssues, type IssueFilters } from '@/lib/hooks/use-issues';
import type { ProjectDetail, ProjectMember } from '@/lib/types';

export function IssueListView({
  project,
  members,
  canCreate,
  showProject,
  title = 'Issues',
}: {
  project?: ProjectDetail;
  members?: ProjectMember[];
  canCreate: boolean;
  showProject?: boolean;
  title?: string;
}) {
  const [filters, setFilters] = useState<IssueFilters>({
    openOnly: true,
    sort: 'severity',
    order: 'desc',
    pageSize: 40,
  });
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const scoped: IssueFilters = { ...filters, ...(project ? { projectId: project.id } : {}) };
  const grouped = filters.groupBy && filters.groupBy !== 'none';

  const flat = useIssues(scoped, !grouped);
  const groups = useGroupedIssues(scoped, Boolean(grouped));
  const query = grouped ? groups : flat;

  const set = (patch: Partial<IssueFilters>) => setFilters({ ...filters, ...patch, page: 1 });

  const activeCount = [
    filters.status?.length,
    filters.severity?.length,
    filters.priority?.length,
    filters.assigneeId?.length,
    filters.phaseId?.length,
    filters.unassigned ? 1 : 0,
    filters.overdue ? 1 : 0,
  ].reduce<number>((sum, value) => sum + (value ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <form
          className="relative min-w-48 flex-1 sm:max-w-xs"
          onSubmit={(event) => {
            event.preventDefault();
            set({ search: search.trim() || undefined });
          }}
        >
          <Search
            className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onBlur={() => set({ search: search.trim() || undefined })}
            placeholder="Search issues…"
            className="h-9 pl-8"
          />
        </form>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5">
              <Filter className="size-3.5" aria-hidden />
              Filters
              {activeCount > 0 ? (
                <Badge variant="secondary" className="ml-0.5 rounded px-1 text-[10px]">
                  {activeCount}
                </Badge>
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[min(26rem,calc(100vw-2rem))] space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <MultiSelect
                  options={Object.entries(ISSUE_STATUS_META).map(([value, meta]) => ({
                    value,
                    label: meta.label,
                  }))}
                  selected={filters.status ?? []}
                  onChange={(status) => set({ status: status.length ? status : undefined })}
                  placeholder="Any status"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Severity</Label>
                <MultiSelect
                  options={Object.entries(SEVERITY_META).map(([value, meta]) => ({
                    value,
                    label: meta.label,
                  }))}
                  selected={filters.severity ?? []}
                  onChange={(severity) => set({ severity: severity.length ? severity : undefined })}
                  placeholder="Any severity"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Priority</Label>
                <MultiSelect
                  options={Object.entries(PRIORITY_META).map(([value, meta]) => ({
                    value,
                    label: meta.label,
                  }))}
                  selected={filters.priority ?? []}
                  onChange={(priority) => set({ priority: priority.length ? priority : undefined })}
                  placeholder="Any priority"
                />
              </div>
              {members ? (
                <div className="space-y-1.5">
                  <Label className="text-xs">Assignee</Label>
                  <MultiSelect
                    options={members.map((member) => ({
                      value: member.user.id,
                      label: member.user.name,
                    }))}
                    selected={filters.assigneeId ?? []}
                    onChange={(assigneeId) =>
                      set({ assigneeId: assigneeId.length ? assigneeId : undefined })
                    }
                    placeholder="Anyone"
                  />
                </div>
              ) : null}
              {project ? (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Environment</Label>
                  <MultiSelect
                    options={[
                      { value: 'none', label: 'Not specified' },
                      ...project.phases.map((phase) => ({
                        value: phase.id,
                        label: phase.name,
                        color: phase.color,
                      })),
                    ]}
                    selected={filters.phaseId ?? []}
                    onChange={(phaseId) => set({ phaseId: phaseId.length ? phaseId : undefined })}
                    placeholder="Any environment"
                  />
                </div>
              ) : null}
            </div>

            <div className="space-y-2 border-t pt-3">
              <label className="flex items-center justify-between gap-3 text-sm">
                Only open issues
                <Switch
                  checked={Boolean(filters.openOnly)}
                  onCheckedChange={(checked) => set({ openOnly: checked })}
                />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                Only overdue
                <Switch
                  checked={Boolean(filters.overdue)}
                  onCheckedChange={(checked) => set({ overdue: checked || undefined })}
                />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                Only unassigned
                <Switch
                  checked={Boolean(filters.unassigned)}
                  onCheckedChange={(checked) => set({ unassigned: checked || undefined })}
                />
              </label>
            </div>
          </PopoverContent>
        </Popover>

        <Select
          value={filters.groupBy ?? 'none'}
          onValueChange={(groupBy) => set({ groupBy: groupBy as IssueFilters['groupBy'] })}
        >
          <SelectTrigger size="sm" className="h-9 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No grouping</SelectItem>
            <SelectItem value="status">Group by status</SelectItem>
            <SelectItem value="severity">Group by severity</SelectItem>
            <SelectItem value="assignee">Group by assignee</SelectItem>
            <SelectItem value="phase">Group by environment</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.sort ?? 'severity'}
          onValueChange={(sort) => set({ sort: sort as IssueFilters['sort'] })}
        >
          <SelectTrigger size="sm" className="h-9 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="severity">Severity</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="createdAt">Newest</SelectItem>
            <SelectItem value="updatedAt">Recently updated</SelectItem>
            <SelectItem value="dueDate">Deadline</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>

        {activeCount > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 text-muted-foreground"
            onClick={() => {
              setSearch('');
              setFilters({ openOnly: true, sort: 'severity', order: 'desc', pageSize: 40 });
            }}
          >
            <X className="size-3.5" aria-hidden />
            Clear
          </Button>
        ) : null}

        {canCreate ? (
          <Button size="sm" className="ml-auto h-9 gap-1.5" onClick={() => setCreateOpen(true)}>
            <Bug className="size-4" aria-hidden />
            Report issue
          </Button>
        ) : null}
      </div>

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
                  {group.issues?.length ?? 0}
                </span>
              </div>
              <div className="space-y-2">
                {(group.issues ?? []).map((issue) => (
                  <IssueRow key={issue.id} issue={issue} showProject={showProject} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (flat.data?.data.length ?? 0) === 0 ? (
        <EmptyState
          icon={Bug}
          title={filters.openOnly ? 'No open issues' : 'No issues match these filters'}
          description={
            filters.openOnly
              ? 'Nothing is broken right now — or nothing has been reported yet.'
              : undefined
          }
          action={
            canCreate ? (
              <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
                <Bug className="size-4" aria-hidden />
                Report an issue
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="space-y-2">
            {flat.data!.data.map((issue) => (
              <IssueRow key={issue.id} issue={issue} showProject={showProject} />
            ))}
          </div>

          {flat.data!.meta.totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3 pt-2">
              <p className="text-xs text-muted-foreground">
                Page {flat.data!.meta.page} of {flat.data!.meta.totalPages} ·{' '}
                {flat.data!.meta.total} issues
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={flat.data!.meta.page <= 1}
                  onClick={() => setFilters({ ...filters, page: (filters.page ?? 1) - 1 })}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={flat.data!.meta.page >= flat.data!.meta.totalPages}
                  onClick={() => setFilters({ ...filters, page: (filters.page ?? 1) + 1 })}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <CreateIssueDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        {...(project ? { defaultProjectKey: project.key } : {})}
      />
      <span className="sr-only">{title}</span>
    </div>
  );
}
