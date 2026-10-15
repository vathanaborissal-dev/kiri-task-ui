'use client';

import { Bookmark, BookmarkPlus, Filter, Search, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { MultiSelect } from '@/components/common/multi-select';
import { IconButton } from '@/components/common/icon-button';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { PRIORITY_META, QA_STATUS_META, TASK_TYPE_META } from '@/lib/constants';
import { useFilterMutations, useSavedFilters } from '@/lib/hooks/use-workspace';
import type { TaskFilters } from '@/lib/hooks/use-tasks';
import type { ProjectDetail, ProjectMember } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

export function TaskFilterBar({
  filters,
  onChange,
  project,
  members,
  showGroupBy = true,
}: {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  project: ProjectDetail;
  members: ProjectMember[];
  showGroupBy?: boolean;
}) {
  const [search, setSearch] = useState(filters.search ?? '');
  const [saveOpen, setSaveOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const { data: savedFilters } = useSavedFilters('TASK', project.id);
  const { create, remove } = useFilterMutations();

  const set = (patch: Partial<TaskFilters>) => onChange({ ...filters, ...patch, page: 1 });

  const activeCount = [
    filters.statusId?.length,
    filters.priority?.length,
    filters.type?.length,
    filters.assigneeId?.length,
    filters.labelId?.length,
    filters.phaseId?.length,
    filters.qaStatus?.length,
    filters.unassigned ? 1 : 0,
    filters.overdue ? 1 : 0,
    filters.includeDone === false ? 1 : 0,
  ].reduce<number>((sum, value) => sum + (value ?? 0), 0);

  const clear = () => {
    setSearch('');
    onChange({ projectId: filters.projectId, sort: filters.sort, groupBy: filters.groupBy });
  };

  const saveCurrent = async () => {
    if (!filterName.trim()) return;
    const { projectId, ...query } = filters;
    await create.mutateAsync({
      name: filterName.trim(),
      scope: 'TASK',
      query: query as Record<string, unknown>,
      projectId: project.id,
      isShared: false,
    });
    void projectId;
    setFilterName('');
    setSaveOpen(false);
    toast.success('Filter saved');
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        className="relative min-w-48 flex-1 sm:max-w-xs"
        onSubmit={(event) => {
          event.preventDefault();
          set({ search: search.trim() || undefined });
        }}
      >
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onBlur={() => set({ search: search.trim() || undefined })}
          placeholder="Search tasks…"
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
                options={project.statuses.map((status) => ({
                  value: status.id,
                  label: status.name,
                  color: status.color,
                }))}
                selected={filters.statusId ?? []}
                onChange={(statusId) => set({ statusId: statusId.length ? statusId : undefined })}
                placeholder="Any status"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Assignee</Label>
              <MultiSelect
                options={members.map((member) => ({
                  value: member.user.id,
                  label: member.user.name,
                  description: member.role.name,
                }))}
                selected={filters.assigneeId ?? []}
                onChange={(assigneeId) =>
                  set({ assigneeId: assigneeId.length ? assigneeId : undefined })
                }
                placeholder="Anyone"
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

            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <MultiSelect
                options={Object.entries(TASK_TYPE_META).map(([value, meta]) => ({
                  value,
                  label: meta.label,
                }))}
                selected={filters.type ?? []}
                onChange={(type) => set({ type: type.length ? type : undefined })}
                placeholder="Any type"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Phase</Label>
              <MultiSelect
                options={[
                  { value: 'none', label: 'Not started' },
                  ...project.phases.map((phase) => ({
                    value: phase.id,
                    label: phase.name,
                    color: phase.color,
                  })),
                ]}
                selected={filters.phaseId ?? []}
                onChange={(phaseId) => set({ phaseId: phaseId.length ? phaseId : undefined })}
                placeholder="Any phase"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Testing</Label>
              <MultiSelect
                options={Object.entries(QA_STATUS_META).map(([value, meta]) => ({
                  value,
                  label: meta.label,
                }))}
                selected={filters.qaStatus ?? []}
                onChange={(qaStatus) => set({ qaStatus: qaStatus.length ? qaStatus : undefined })}
                placeholder="Any"
              />
            </div>

            {project.labels.length > 0 ? (
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Labels</Label>
                <MultiSelect
                  options={project.labels.map((label) => ({
                    value: label.id,
                    label: label.name,
                    color: label.color,
                  }))}
                  selected={filters.labelId ?? []}
                  onChange={(labelId) => set({ labelId: labelId.length ? labelId : undefined })}
                  placeholder="Any label"
                />
              </div>
            ) : null}
          </div>

          <div className="space-y-2 border-t pt-3">
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
            <label className="flex items-center justify-between gap-3 text-sm">
              Show completed
              <Switch
                checked={filters.includeDone !== false}
                onCheckedChange={(checked) => set({ includeDone: checked })}
              />
            </label>
          </div>

          <div className="flex gap-2 border-t pt-3">
            <Button variant="ghost" size="sm" className="flex-1" onClick={clear}>
              Clear all
            </Button>
            <Popover open={saveOpen} onOpenChange={setSaveOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                  <BookmarkPlus className="size-3.5" aria-hidden />
                  Save filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 space-y-2">
                <Label className="text-xs">Filter name</Label>
                <Input
                  value={filterName}
                  onChange={(event) => setFilterName(event.target.value)}
                  placeholder="My open critical work"
                />
                <Button size="sm" className="w-full" onClick={() => void saveCurrent()}>
                  Save
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </PopoverContent>
      </Popover>

      {savedFilters && savedFilters.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5">
              <Bookmark className="size-3.5" aria-hidden />
              Saved
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="text-xs">Saved filters</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {savedFilters.map((saved) => (
              <DropdownMenuItem
                key={saved.id}
                onClick={() =>
                  onChange({ ...(saved.query as TaskFilters), projectId: filters.projectId })
                }
                className="gap-2"
              >
                <span className="flex-1 truncate">{saved.name}</span>
                {saved.isMine ? (
                  <IconButton
                    variant="ghost"
                    className="size-5"
                    onClick={(event) => {
                      event.stopPropagation();
                      void remove.mutateAsync(saved.id);
                    }}
                    label={`Delete the "${saved.name}" filter`}
                  >
                    <X className="size-3" aria-hidden />
                  </IconButton>
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {showGroupBy ? (
        <Select
          value={filters.groupBy ?? 'none'}
          onValueChange={(groupBy) => set({ groupBy: groupBy as TaskFilters['groupBy'] })}
        >
          <SelectTrigger size="sm" className="h-9 w-36">
            <SelectValue placeholder="Group by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No grouping</SelectItem>
            <SelectItem value="status">Group by status</SelectItem>
            <SelectItem value="assignee">Group by assignee</SelectItem>
            <SelectItem value="priority">Group by priority</SelectItem>
            <SelectItem value="phase">Group by phase</SelectItem>
            <SelectItem value="milestone">Group by milestone</SelectItem>
          </SelectContent>
        </Select>
      ) : null}

      <Select
        value={filters.sort ?? 'position'}
        onValueChange={(sort) => set({ sort: sort as TaskFilters['sort'] })}
      >
        <SelectTrigger size="sm" className="h-9 w-36">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="position">Manual order</SelectItem>
          <SelectItem value="dueDate">Deadline</SelectItem>
          <SelectItem value="priority">Priority</SelectItem>
          <SelectItem value="updatedAt">Recently updated</SelectItem>
          <SelectItem value="createdAt">Newest</SelectItem>
          <SelectItem value="title">Title</SelectItem>
        </SelectContent>
      </Select>

      {activeCount > 0 ? (
        <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-muted-foreground" onClick={clear}>
          <X className="size-3.5" aria-hidden />
          Clear
        </Button>
      ) : null}
    </div>
  );
}
