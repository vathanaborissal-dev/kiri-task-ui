'use client';

import { DateField } from '@/components/common/date-field';
import { MultiSelect } from '@/components/common/multi-select';
import { ProgressField } from '@/components/tasks/progress-field';
import { TaskHelpers } from '@/components/tasks/task-helpers';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PRIORITY_META, QA_STATUS_META, TASK_TYPE_META } from '@/lib/constants';
import type { ProjectDetail, ProjectMember, TaskDetail } from '@/lib/types';

export type TaskPatch = Record<string, unknown>;

/**
 * The right-hand property rail of a task. Every control is disabled unless the
 * viewer holds the matching permission, and the API enforces the same rules.
 */
export function TaskProperties({
  task,
  project,
  members,
  permissions,
  currentUserId,
  onPatch,
  pending,
}: {
  task: TaskDetail;
  project: ProjectDetail;
  members: ProjectMember[];
  permissions: Set<string>;
  /** Used to decide who may report progress and who may leave the task. */
  currentUserId?: string;
  onPatch: (patch: TaskPatch) => void;
  pending?: boolean;
}) {
  const can = (permission: string) => permissions.has('*') || permissions.has(permission);
  const isAssignee = currentUserId
    ? task.assignees.some((assignee) => assignee.id === currentUserId)
    : false;
  const done = task.status.category === 'DONE';

  const row = (label: string, control: React.ReactNode) => (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {control}
    </div>
  );

  return (
    <div className="space-y-4">
      {row(
        'Status',
        <Select
          value={task.status.id}
          onValueChange={(statusId) => onPatch({ statusId })}
          disabled={!can('task:change_status') || pending}
        >
          <SelectTrigger className="w-full" aria-label="Status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {project.statuses.map((status) => (
              <SelectItem key={status.id} value={status.id}>
                <span className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: status.color }}
                    aria-hidden
                  />
                  {status.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>,
      )}

      {/* Directly under the status: the two describe the same thing, and a
          task in Done at 40% is the contradiction this pairing prevents.
          Whoever is doing the work may report it — requiring `task:update`
          would let a developer move the card but not say how far along it is,
          which is the one number their lead reads. */}
      {row(
        'Progress',
        <ProgressField
          value={done ? 100 : task.progress}
          onChange={(progress) => onPatch({ progress })}
          disabled={!can('task:update') && !isAssignee}
          lockedToDone={done}
          pending={pending}
        />,
      )}

      {/* The list of people, with "ask for help" — a second developer joining
          an existing task is a different act from reassigning it. */}
      {row(
        'Working on it',
        <TaskHelpers
          task={task}
          members={members}
          currentUserId={currentUserId}
          canAssign={can('task:assign')}
        />,
      )}

      {can('task:assign')
        ? row(
            'Replace assignees',
            <MultiSelect
              options={members.map((member) => ({
                value: member.user.id,
                label: member.user.name,
                description: member.role.name,
              }))}
              selected={task.assignees.map((a) => a.id)}
              onChange={(assigneeIds) => onPatch({ assigneeIds })}
              placeholder="Unassigned"
              label="Assignees"
              disabled={pending}
            />,
          )
        : null}

      {row(
        'Priority',
        <Select
          value={task.priority}
          onValueChange={(priority) => onPatch({ priority })}
          disabled={!can('task:update') || pending}
        >
          <SelectTrigger className="w-full" aria-label="Priority">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PRIORITY_META).map(([value, meta]) => (
              <SelectItem key={value} value={value}>
                <span className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${meta.dot}`} aria-hidden />
                  {meta.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>,
      )}

      {row(
        'Type',
        <Select
          value={task.type}
          onValueChange={(type) => onPatch({ type })}
          disabled={!can('task:update') || pending}
        >
          <SelectTrigger className="w-full" aria-label="Type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TASK_TYPE_META).map(([value, meta]) => (
              <SelectItem key={value} value={value}>
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>,
      )}

      {row(
        'Phase reached',
        <Select
          value={task.phase?.id ?? 'none'}
          onValueChange={(value) => onPatch({ phaseId: value === 'none' ? null : value })}
          disabled={!can('task:manage_phase') || pending}
        >
          <SelectTrigger className="w-full" aria-label="Phase reached">
            <SelectValue placeholder="Not started" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Not started</SelectItem>
            {project.phases.map((phase) => (
              <SelectItem key={phase.id} value={phase.id}>
                <span className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: phase.color }}
                    aria-hidden
                  />
                  {phase.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>,
      )}

      {row(
        'Testing',
        <Select
          value={task.qaStatus}
          onValueChange={(qaStatus) => onPatch({ qaStatus })}
          disabled={!can('task:manage_qa') || pending}
        >
          <SelectTrigger className="w-full" aria-label="Testing">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(QA_STATUS_META).map(([value, meta]) => (
              <SelectItem key={value} value={value}>
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>,
      )}

      {row(
        'Start date',
        <DateField
          value={task.startDate}
          onChange={(startDate) => onPatch({ startDate })}
          disabled={!can('task:manage_deadline') || pending}
          placeholder="Not set"
          label="Start date"
        />,
      )}

      {row(
        'Deadline',
        <DateField
          value={task.dueDate}
          onChange={(dueDate) => onPatch({ dueDate })}
          disabled={!can('task:manage_deadline') || pending}
          placeholder="No deadline"
          label="Deadline"
        />,
      )}

      {row(
        'Labels',
        <MultiSelect
          options={project.labels.map((label) => ({
            value: label.id,
            label: label.name,
            color: label.color,
          }))}
          selected={task.labels.map((l) => l.id)}
          onChange={(labelIds) => onPatch({ labelIds })}
          placeholder="No labels"
          label="Labels"
          disabled={!can('task:update') || pending}
        />,
      )}

      {project.milestones.length > 0
        ? row(
            'Milestone',
            <Select
              value={task.milestone?.id ?? 'none'}
              onValueChange={(value) => onPatch({ milestoneId: value === 'none' ? null : value })}
              disabled={!can('task:update') || pending}
            >
              <SelectTrigger className="w-full" aria-label="Milestone">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {project.milestones.map((milestone) => (
                  <SelectItem key={milestone.id} value={milestone.id}>
                    {milestone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>,
          )
        : null}

      <div className="grid grid-cols-2 gap-3">
        {row(
          'Estimate (h)',
          <Input
            type="number"
            min={0}
            step="0.5"
            aria-label="Estimate in hours"
            defaultValue={task.estimateHours ?? ''}
            disabled={!can('task:update') || pending}
            onBlur={(event) => {
              const value = event.target.value;
              const next = value === '' ? null : Number(value);
              if (next !== (task.estimateHours ?? null)) onPatch({ estimateHours: next });
            }}
          />,
        )}
        {row(
          'Spent (h)',
          <Input
            type="number"
            min={0}
            step="0.5"
            aria-label="Hours spent"
            defaultValue={task.spentHours ?? ''}
            disabled={!can('task:update') || pending}
            onBlur={(event) => {
              const value = event.target.value;
              const next = value === '' ? null : Number(value);
              if (next !== (task.spentHours ?? null)) onPatch({ spentHours: next });
            }}
          />,
        )}
      </div>
    </div>
  );
}
