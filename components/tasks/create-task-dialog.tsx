'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DateField } from '@/components/common/date-field';
import { Spinner } from '@/components/common/loading';
import { MultiSelect } from '@/components/common/multi-select';
import { UserAvatar } from '@/components/common/user-avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api';
import { useProject, useProjectMembers } from '@/lib/hooks/use-projects';
import { useCreateTask } from '@/lib/hooks/use-tasks';
import { PRIORITY_META, TASK_TYPE_META } from '@/lib/constants';
import { useAuth } from '@/providers/auth-provider';

function ColorDot({ color, className = '' }: { color?: string; className?: string }) {
  return (
    <span
      className={`size-2.5 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/15 ${className}`}
      style={color ? { backgroundColor: color } : undefined}
      aria-hidden
    />
  );
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  defaultProjectKey,
  defaultStatusId,
  defaultPhaseId,
  parentTaskId,
  parentTaskKey,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectKey?: string;
  defaultStatusId?: string;
  defaultPhaseId?: string;
  parentTaskId?: string;
  parentTaskKey?: string;
  onCreated?: (taskKey: string) => void;
}) {
  const router = useRouter();
  const { projectsWith, user } = useAuth();
  const createTask = useCreateTask();

  const available = useMemo(() => projectsWith('task:create'), [projectsWith]);
  const [projectKey, setProjectKey] = useState(defaultProjectKey ?? available[0]?.key ?? '');

  useEffect(() => {
    if (open) setProjectKey(defaultProjectKey ?? available[0]?.key ?? '');
  }, [open, defaultProjectKey, available]);

  const { data: project } = useProject(open && projectKey ? projectKey : undefined);
  const { data: members } = useProjectMembers(open && projectKey ? projectKey : undefined);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('TASK');
  const [priority, setPriority] = useState('MEDIUM');
  const [statusId, setStatusId] = useState<string>('');
  const [phaseId, setPhaseId] = useState<string>('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [milestoneId, setMilestoneId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [estimate, setEstimate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const canAssign = projectKey
    ? (project?.myPermissions.includes('task:assign') ?? false) ||
      (project?.myPermissions.includes('*') ?? false)
    : false;
  const canSetDeadline =
    (project?.myPermissions.includes('task:manage_deadline') ?? false) ||
    (project?.myPermissions.includes('*') ?? false);
  const selectedType = TASK_TYPE_META[type as keyof typeof TASK_TYPE_META];
  const selectedPriority = PRIORITY_META[priority as keyof typeof PRIORITY_META];
  const selectedStatus = project?.statuses.find((status) => status.id === statusId);
  const selectedPhase = project?.phases.find((phase) => phase.id === phaseId);

  useEffect(() => {
    if (!project) return;
    setStatusId(
      defaultStatusId ?? project.statuses.find((s) => s.isDefault)?.id ?? project.statuses[0]?.id ?? '',
    );
    setPhaseId(defaultPhaseId ?? '');
  }, [project, defaultStatusId, defaultPhaseId]);

  const reset = () => {
    setTitle('');
    setDescription('');
    setType('TASK');
    setPriority('MEDIUM');
    setAssigneeIds([]);
    setLabelIds([]);
    setMilestoneId('');
    setDueDate(null);
    setStartDate(null);
    setEstimate('');
    setErrors({});
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!project) return;
    setErrors({});
    try {
      const task = await createTask.mutateAsync({
        projectId: project.id,
        title,
        ...(description ? { description } : {}),
        type,
        priority,
        statusId,
        ...(phaseId ? { phaseId } : {}),
        ...(milestoneId ? { milestoneId } : {}),
        ...(parentTaskId ? { parentTaskId } : {}),
        ...(assigneeIds.length ? { assigneeIds } : {}),
        ...(labelIds.length ? { labelIds } : {}),
        ...(dueDate ? { dueDate } : {}),
        ...(startDate ? { startDate } : {}),
        ...(estimate ? { estimateHours: Number(estimate) } : {}),
      });
      toast.success(`${task.key} created`, {
        action: {
          label: 'Open',
          onClick: () => router.push(`/projects/${project.key}/tasks/${task.key}`),
        },
      });
      const appOnlyAssignees = (members ?? []).filter(
        (member) => assigneeIds.includes(member.user.id) && !member.user.telegramLinked,
      );
      if (appOnlyAssignees.length > 0) {
        const names = appOnlyAssignees.map((member) => member.user.name).join(', ');
        toast.warning(`Telegram was not sent to ${names}`, {
          description: 'They received the message in the app. They must connect Telegram first.',
        });
      }
      onOpenChange(false);
      reset();
      onCreated?.(task.key);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setErrors(
          Object.keys(caught.fieldErrors).length ? caught.fieldErrors : { title: caught.message },
        );
      }
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{parentTaskKey ? `New subtask of ${parentTaskKey}` : 'New task'}</DialogTitle>
          <DialogDescription>
            Work status, lifecycle phase and testing state are tracked separately, so you can see
            what is built and what is verified.
          </DialogDescription>
        </DialogHeader>

        {available.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            You do not have permission to create tasks on any project yet.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Project</FieldLabel>
                <Select
                  value={projectKey}
                  onValueChange={setProjectKey}
                  disabled={Boolean(defaultProjectKey) || Boolean(parentTaskId)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {available.map((item) => (
                      <SelectItem key={item.id} value={item.key}>
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                            aria-hidden
                          />
                          {item.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Type</FieldLabel>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue>
                      <span className="flex items-center gap-2">
                        <ColorDot className={selectedType?.dot} />
                        {selectedType?.label}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TASK_TYPE_META).map(([value, meta]) => (
                      <SelectItem key={value} value={value}>
                        <span className="flex items-center gap-2">
                          <ColorDot className={meta.dot} />
                          {meta.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="task-title">Title</FieldLabel>
              <Input
                id="task-title"
                required
                autoFocus
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Short summary of the work"
              />
              {errors.title ? <FieldError>{errors.title}</FieldError> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="task-description">Description</FieldLabel>
              <Textarea
                id="task-description"
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Context, acceptance criteria, links…"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select value={statusId} onValueChange={setStatusId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose status">
                      {selectedStatus ? (
                        <span className="flex items-center gap-2">
                          <ColorDot color={selectedStatus.color} />
                          {selectedStatus.name}
                        </span>
                      ) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(project?.statuses ?? []).map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        <span className="flex items-center gap-2">
                          <ColorDot color={status.color} />
                          {status.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Priority</FieldLabel>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue>
                      <span className="flex items-center gap-2">
                        <ColorDot className={selectedPriority?.dot} />
                        {selectedPriority?.label}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_META).map(([value, meta]) => (
                      <SelectItem key={value} value={value}>
                        <span className="flex items-center gap-2">
                          <ColorDot className={meta.dot} />
                          {meta.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Phase</FieldLabel>
                <Select value={phaseId || 'none'} onValueChange={(v) => setPhaseId(v === 'none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue>
                      <span className="flex items-center gap-2">
                        <ColorDot
                          color={selectedPhase?.color}
                          className={selectedPhase ? '' : 'bg-muted-foreground/35'}
                        />
                        {selectedPhase?.name ?? 'Not started'}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="flex items-center gap-2">
                        <ColorDot className="bg-muted-foreground/35" />
                        Not started
                      </span>
                    </SelectItem>
                    {(project?.phases ?? []).map((phase) => (
                      <SelectItem key={phase.id} value={phase.id}>
                        <span className="flex items-center gap-2">
                          <ColorDot color={phase.color} />
                          {phase.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Assignees</FieldLabel>
                <MultiSelect
                  options={(members ?? [])
                    .filter((member) => canAssign || member.user.id === user?.id)
                    .map((member) => ({
                      value: member.user.id,
                      label:
                        member.user.id === user?.id ? `${member.user.name} (you)` : member.user.name,
                      description: `${member.role.name} · ${member.user.telegramLinked ? 'Telegram ready' : 'App only'}`,
                      icon: (
                        <UserAvatar
                          user={member.user}
                          size="sm"
                          showTooltip={false}
                          className="ring-1 ring-border"
                        />
                      ),
                    }))}
                  selected={assigneeIds}
                  onChange={setAssigneeIds}
                  placeholder={canAssign ? 'Nobody yet' : 'Choose yourself'}
                  label="Assignees"
                />
                {!canAssign ? (
                  <p className="text-xs text-muted-foreground">
                    You can only assign work to yourself on this project.
                  </p>
                ) : null}
              </Field>

              <Field>
                <FieldLabel>Labels</FieldLabel>
                <MultiSelect
                  options={(project?.labels ?? []).map((label) => ({
                    value: label.id,
                    label: label.name,
                    color: label.color,
                  }))}
                  selected={labelIds}
                  onChange={setLabelIds}
                  placeholder="No labels"
                  label="Labels"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field className="min-w-0">
                <FieldLabel>Start date</FieldLabel>
                <DateField
                  value={startDate}
                  onChange={setStartDate}
                  disabled={!canSetDeadline}
                  label="Start date"
                />
              </Field>
              <Field className="min-w-0">
                <FieldLabel>Deadline</FieldLabel>
                <DateField
                  value={dueDate}
                  onChange={setDueDate}
                  disabled={!canSetDeadline}
                  placeholder={canSetDeadline ? 'No deadline' : 'Not permitted'}
                  label="Deadline"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="task-estimate">Estimate (hours)</FieldLabel>
                <Input
                  id="task-estimate"
                  type="number"
                  min={0}
                  step="0.5"
                  value={estimate}
                  onChange={(event) => setEstimate(event.target.value)}
                  placeholder="—"
                />
              </Field>
            </div>

            {project?.milestones.length ? (
              <Field>
                <FieldLabel>Milestone</FieldLabel>
                <Select
                  value={milestoneId || 'none'}
                  onValueChange={(v) => setMilestoneId(v === 'none' ? '' : v)}
                >
                  <SelectTrigger>
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
                </Select>
              </Field>
            ) : null}

            {errors.projectId ? <FieldError>{errors.projectId}</FieldError> : null}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="gap-2" disabled={createTask.isPending || !project}>
                {createTask.isPending ? <Spinner /> : null}
                Create task
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
