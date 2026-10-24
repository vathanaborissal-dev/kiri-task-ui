'use client';

import { Bug, Filter, Search, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/empty-state';
import { DateField } from '@/components/common/date-field';
import { ListSkeleton, Spinner } from '@/components/common/loading';
import { ErrorState } from '@/components/common/error-state';
import { MultiSelect } from '@/components/common/multi-select';
import { CreateIssueDialog } from '@/components/issues/create-issue-dialog';
import { IssueRow } from '@/components/issues/issue-row';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  useBulkUpdateIssues,
  useGroupedIssues,
  useIssueWorkflow,
  useIssues,
  type IssueFilters,
} from '@/lib/hooks/use-issues';
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
  const [selected, setSelected] = useState<string[]>([]);

  const scoped: IssueFilters = { ...filters, ...(project ? { projectId: project.id } : {}) };
  const grouped = filters.groupBy && filters.groupBy !== 'none';

  const flat = useIssues(scoped, !grouped);
  const groups = useGroupedIssues(scoped, Boolean(grouped));
  const query = grouped ? groups : flat;
  const bulkUpdate = useBulkUpdateIssues();
  // Fetched once the first issue is ticked rather than on every list load: it
  // is static, cached for an hour, and only the bulk bar needs it.
  const { data: workflow, isLoading: workflowLoading } = useIssueWorkflow(selected.length > 0);

  const set = (patch: Partial<IssueFilters>) => setFilters({ ...filters, ...patch, page: 1 });

  const permissions = new Set(project?.myPermissions ?? []);
  const can = (permission: string) => permissions.has('*') || permissions.has(permission);
  // Bulk editing is per project: a status move has to be checked against one
  // project's roles, and phases and people do not exist across projects.
  const selectable = Boolean(project) && can('issue:view');

  const toggle = (id: string, isSelected: boolean) =>
    setSelected((current) =>
      isSelected ? [...current, id] : current.filter((value) => value !== id),
    );

  const visible = grouped
    ? (groups.data?.data ?? []).flatMap((group) => group.issues ?? [])
    : (flat.data?.data ?? []);
  const visibleIds = visible.map((issue) => issue.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

  /**
   * The statuses every selected issue could legally reach.
   *
   * Intersected rather than unioned: offering a status that only some of the
   * selection can take would move half the list and refuse the rest, and the
   * API checks all of them before writing anything anyway. A move the viewer's
   * role cannot make is left out for the same reason.
   */
  const bulkStatuses = (() => {
    if (!workflow || selected.length === 0) return [];
    const chosen = visible.filter((issue) => selected.includes(issue.id));
    if (chosen.length === 0) return [];

    const sets = chosen.map((issue) => {
      const row = workflow.find((entry) => entry.from === issue.status);
      return new Set(
        (row?.to ?? [])
          .filter((target) => !target.requires || can(target.requires))
          .map((target) => target.status),
      );
    });
    const [first, ...rest] = sets;
    return [...(first ?? [])].filter((status) => rest.every((set) => set.has(status)));
  })();

  const applyBulk = async (patch: Record<string, unknown>) => {
    try {
      const result = await bulkUpdate.mutateAsync({ issueIds: selected, ...patch });
      toast.success(`${result.updated} ${result.updated === 1 ? 'issue' : 'issues'} updated`);
      setSelected([]);
    } catch (error) {
      // Workflow refusals explain the rule, so they are shown verbatim.
      toast.error(error instanceof Error ? error.message : 'Could not update those issues', {
        duration: 6000,
      });
    }
  };

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

      {selectable && visibleIds.length > 0 ? (
        <label className="flex w-fit cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <Checkbox
            checked={allVisibleSelected}
            onCheckedChange={(value) => setSelected(value === true ? visibleIds : [])}
            aria-label="Select every issue shown"
          />
          {allVisibleSelected
            ? `All ${visibleIds.length} shown selected`
            : `Select all ${visibleIds.length} shown`}
        </label>
      ) : null}

      {selected.length > 0 ? (
        <Card className="border-primary/40 bg-accent/30">
          <CardContent className="flex flex-wrap items-center gap-2 py-3">
            <span className="text-sm font-medium">{selected.length} selected</span>

            {can('issue:change_status') ? (
              <Select onValueChange={(status) => void applyBulk({ status })}>
                <SelectTrigger size="sm" className="h-8 w-44">
                  <SelectValue
                    placeholder={
                      workflowLoading
                        ? 'Loading…'
                        : bulkStatuses.length
                          ? 'Move to status'
                          : 'No shared move'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {workflowLoading ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">Loading…</div>
                  ) : bulkStatuses.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      No status all of these can reach — a settled issue has to be reopened on its
                      own first. Narrow the selection.
                    </div>
                  ) : (
                    bulkStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        <span className="flex items-center gap-2">
                          <span
                            className={`size-2 rounded-full ${ISSUE_STATUS_META[status].dot}`}
                            aria-hidden
                          />
                          {ISSUE_STATUS_META[status].label}
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            ) : null}

            {can('issue:update') ? (
              <Select onValueChange={(severity) => void applyBulk({ severity })}>
                <SelectTrigger size="sm" className="h-8 w-36">
                  <SelectValue placeholder="Set severity" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SEVERITY_META).map(([value, meta]) => (
                    <SelectItem key={value} value={value}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {can('issue:update') ? (
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

            {can('issue:assign') && members ? (
              <Select
                onValueChange={(value) =>
                  void applyBulk({ assigneeId: value === 'none' ? null : value })
                }
              >
                <SelectTrigger size="sm" className="h-8 w-40">
                  <SelectValue placeholder="Assign to…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassign</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.user.id} value={member.user.id}>
                      {member.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {can('issue:update') ? (
              <div className="w-36">
                <DateField
                  value={null}
                  onChange={(dueDate) => (dueDate ? void applyBulk({ dueDate }) : undefined)}
                  placeholder="Set end date"
                  label="End date for the selected issues"
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
                  {group.issues?.length ?? 0}
                </span>
              </div>
              <div className="space-y-2">
                {(group.issues ?? []).map((issue) => (
                  <IssueRow
                    key={issue.id}
                    issue={issue}
                    showProject={showProject}
                    {...(selectable
                      ? {
                          selected: selected.includes(issue.id),
                          onSelectedChange: (value: boolean) => toggle(issue.id, value),
                        }
                      : {})}
                  />
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
              <IssueRow
                key={issue.id}
                issue={issue}
                showProject={showProject}
                {...(selectable
                  ? {
                      selected: selected.includes(issue.id),
                      onSelectedChange: (value: boolean) => toggle(issue.id, value),
                    }
                  : {})}
              />
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
