'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
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
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api';
import { PRIORITY_META, TASK_TYPE_META } from '@/lib/constants';
import { useProject, useProjectMembers } from '@/lib/hooks/use-projects';
import { useCreateTask } from '@/lib/hooks/use-tasks';
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

/**
 * A labelled group of fields.
 *
 * The form was a flat run of thirteen controls whose only guidance lived in
 * placeholder text — "Context, acceptance criteria, links…", an em-dash in the
 * estimate box — which disappears the moment anyone types and reads as
 * pre-filled content until they do. Guidance that has to survive typing now
 * sits in a description under the field, and the sections give the eye a shape:
 * what the work is, where it sits, who does it, when.
 */
function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-0.5">
        <h3 className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
          {title}
        </h3>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </section>
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
  const { projectsWith } = useAuth();
  const createTask = useCreateTask();

  const available = useMemo(() => projectsWith('task:create'), [projectsWith]);
  const fallbackKey = defaultProjectKey ?? available[0]?.key ?? '';

  // A fresh form per opening, keyed rather than reset from an effect — an
  // effect-based reset painted the previous task's answers for one frame.
  const [session, setSession] = useState(0);
  const [openedFor, setOpenedFor] = useState(open);
  if (open !== openedFor) {
    setOpenedFor(open);
    if (open) setSession((value) => value + 1);
  }

  if (available.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
            <DialogDescription>
              You do not have permission to create tasks on any project yet. Ask a project manager
              to add you to one.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const heading = parentTaskKey ? `New subtask of ${parentTaskKey}` : 'New task';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{heading}</DialogTitle>
          <DialogDescription>
            Status, phase and testing are tracked separately, so you can tell what is built from
            what is verified.
          </DialogDescription>
        </DialogHeader>

        <TaskForm
          key={session}
          initialProjectKey={fallbackKey}
          available={available}
          lockedProject={Boolean(defaultProjectKey) || Boolean(parentTaskId)}
          {...(defaultStatusId ? { defaultStatusId } : {})}
          {...(defaultPhaseId ? { defaultPhaseId } : {})}
          {...(parentTaskId ? { parentTaskId } : {})}
          pending={createTask.isPending}
          onCancel={() => onOpenChange(false)}
          onSubmit={async (values, assigneeNames) => {
            const task = await createTask.mutateAsync(values);
            toast.success(`${task.key} created`, {
              action: {
                label: 'Open',
                onClick: () => router.push(`/projects/${task.project.key}/tasks/${task.key}`),
              },
            });
            if (assigneeNames.length > 0) {
              toast.warning(`Telegram was not sent to ${assigneeNames.join(', ')}`, {
                description:
                  'They got the message in the app. They have to connect Telegram first.',
              });
            }
            onOpenChange(false);
            onCreated?.(task.key);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function TaskForm({
  initialProjectKey,
  available,
  lockedProject,
  defaultStatusId,
  defaultPhaseId,
  parentTaskId,
  pending,
  onCancel,
  onSubmit,
}: {
  initialProjectKey: string;
  available: { id: string; key: string; name: string; color: string }[];
  lockedProject: boolean;
  defaultStatusId?: string;
  defaultPhaseId?: string;
  parentTaskId?: string;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (
    values: Record<string, unknown>,
    /** Assignees who will not get a Telegram message. */
    appOnlyAssigneeNames: string[],
  ) => Promise<void>;
}) {
  const { user } = useAuth();
  const [projectKey, setProjectKey] = useState(initialProjectKey);
  const { data: project } = useProject(projectKey || undefined);
  const { data: members } = useProjectMembers(projectKey || undefined);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('TASK');
  const [priority, setPriority] = useState('MEDIUM');
  const [statusId, setStatusId] = useState<string>('');
  const [phaseId, setPhaseId] = useState<string>(defaultPhaseId ?? '');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [milestoneId, setMilestoneId] = useState<string>('');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [estimate, setEstimate] = useState('');
  const [showPlanning, setShowPlanning] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Seeded once per project, so switching projects picks up that project's own
  // default column without overwriting a column the user chose by hand.
  const [statusSeededFor, setStatusSeededFor] = useState<string | null>(null);
  if (project && statusSeededFor !== project.id) {
    setStatusSeededFor(project.id);
    setStatusId(
      defaultStatusId ??
        project.statuses.find((status) => status.isDefault)?.id ??
        project.statuses[0]?.id ??
        '',
    );
  }

  const permissions = new Set(project?.myPermissions ?? []);
  const can = (permission: string) => permissions.has('*') || permissions.has(permission);
  const canAssign = can('task:assign');
  const canSetDeadline = can('task:manage_deadline');

  const selectedType = TASK_TYPE_META[type as keyof typeof TASK_TYPE_META];
  const selectedPriority = PRIORITY_META[priority as keyof typeof PRIORITY_META];
  const selectedStatus = project?.statuses.find((status) => status.id === statusId);
  const selectedPhase = project?.phases.find((phase) => phase.id === phaseId);

  const datesOutOfOrder = Boolean(startDate && dueDate && startDate > dueDate);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!project || datesOutOfOrder) return;
    setErrors({});
    try {
      const appOnly = (members ?? [])
        .filter((member) => assigneeIds.includes(member.user.id) && !member.user.telegramLinked)
        .map((member) => member.user.name);

      await onSubmit(
        {
          projectId: project.id,
          title,
          type,
          priority,
          statusId,
          ...(description ? { description } : {}),
          ...(phaseId ? { phaseId } : {}),
          ...(milestoneId ? { milestoneId } : {}),
          ...(parentTaskId ? { parentTaskId } : {}),
          ...(assigneeIds.length ? { assigneeIds } : {}),
          ...(labelIds.length ? { labelIds } : {}),
          ...(startDate ? { startDate } : {}),
          ...(dueDate ? { dueDate } : {}),
          ...(estimate ? { estimateHours: Number(estimate) } : {}),
        },
        appOnly,
      );
    } catch (caught) {
      if (caught instanceof ApiError) {
        setErrors(
          Object.keys(caught.fieldErrors).length ? caught.fieldErrors : { title: caught.message },
        );
      } else {
        toast.error(caught instanceof Error ? caught.message : 'Could not create that task');
      }
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* --- The work ---------------------------------------------------- */}
      <Section title="The work">
        <Field>
          <FieldLabel htmlFor="task-title">Title</FieldLabel>
          <Input
            id="task-title"
            required
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What needs doing?"
          />
          <FieldDescription>
            Start with a verb — &ldquo;Rewrite the billing webhook handler&rdquo; reads better in a
            standup than &ldquo;Billing&rdquo;.
          </FieldDescription>
          {errors.title ? <FieldError>{errors.title}</FieldError> : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="task-description">Details</FieldLabel>
          <Textarea
            id="task-description"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Context, acceptance criteria, links"
          />
          <FieldDescription>Optional, but it is what stops a task stalling.</FieldDescription>
        </Field>
      </Section>

      <Separator />

      {/* --- Where it sits ----------------------------------------------- */}
      <Section title="Where it sits">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Project</FieldLabel>
            <Select value={projectKey} onValueChange={setProjectKey} disabled={lockedProject}>
              <SelectTrigger aria-label="Project">
                <SelectValue placeholder="Choose a project" />
              </SelectTrigger>
              <SelectContent>
                {available.map((item) => (
                  <SelectItem key={item.id} value={item.key}>
                    <span className="flex items-center gap-2">
                      <ColorDot color={item.color} />
                      {item.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.projectId ? <FieldError>{errors.projectId}</FieldError> : null}
          </Field>

          <Field>
            <FieldLabel>Type</FieldLabel>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger aria-label="Type">
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

          <Field>
            <FieldLabel>Status</FieldLabel>
            <Select value={statusId} onValueChange={setStatusId}>
              <SelectTrigger aria-label="Status">
                <SelectValue placeholder="Choose a column">
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
            <FieldDescription>The board column it starts in</FieldDescription>
          </Field>

          <Field>
            <FieldLabel>Priority</FieldLabel>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger aria-label="Priority">
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
        </div>
      </Section>

      <Separator />

      {/* --- Who and when ------------------------------------------------ */}
      <Section
        title="Who and when"
        hint="A task with nobody on it and no deadline does not appear in anyone's day."
      >
        <Field>
          <FieldLabel>Assignees</FieldLabel>
          <MultiSelect
            options={(members ?? [])
              .filter((member) => canAssign || member.user.id === user?.id)
              .map((member) => ({
                value: member.user.id,
                label: member.user.id === user?.id ? `${member.user.name} (you)` : member.user.name,
                description: `${member.role.name} · ${
                  member.user.telegramLinked ? 'Telegram ready' : 'App only'
                }`,
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
          <FieldDescription>
            {canAssign
              ? 'More than one is fine — pick a second person to help on the same task.'
              : 'You can only assign work to yourself on this project.'}
          </FieldDescription>
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field className="min-w-0">
            <FieldLabel>Start date</FieldLabel>
            <DateField
              value={startDate}
              onChange={setStartDate}
              disabled={!canSetDeadline}
              placeholder="Not set"
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
            {datesOutOfOrder ? (
              <FieldError>The deadline cannot be before the start date.</FieldError>
            ) : null}
          </Field>
          <Field className="min-w-0">
            <FieldLabel htmlFor="task-estimate">Estimate</FieldLabel>
            <Input
              id="task-estimate"
              type="number"
              min={0}
              step="0.5"
              inputMode="decimal"
              value={estimate}
              onChange={(event) => setEstimate(event.target.value)}
              placeholder="Hours"
            />
          </Field>
        </div>
      </Section>

      {/* --- Labels, phase, milestone: folded away ----------------------- */}
      <Separator />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 gap-1.5 text-muted-foreground"
        onClick={() => setShowPlanning((value) => !value)}
        aria-expanded={showPlanning}
      >
        {showPlanning ? (
          <ChevronUp className="size-3.5" aria-hidden />
        ) : (
          <ChevronDown className="size-3.5" aria-hidden />
        )}
        {showPlanning ? 'Hide labels and planning' : 'Labels, phase and milestone'}
      </Button>

      {showPlanning ? (
        <div className="space-y-4 rounded-lg border bg-muted/20 p-3">
          <div className="grid gap-4 sm:grid-cols-2">
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

            <Field>
              <FieldLabel>Phase</FieldLabel>
              <Select
                value={phaseId || 'none'}
                onValueChange={(value) => setPhaseId(value === 'none' ? '' : value)}
              >
                <SelectTrigger aria-label="Phase">
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
              <FieldDescription>How far through the lifecycle it has reached</FieldDescription>
            </Field>
          </div>

          {project?.milestones.length ? (
            <Field>
              <FieldLabel>Milestone</FieldLabel>
              <Select
                value={milestoneId || 'none'}
                onValueChange={(value) => setMilestoneId(value === 'none' ? '' : value)}
              >
                <SelectTrigger aria-label="Milestone">
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
        </div>
      ) : null}

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="gap-2" disabled={pending || !project || datesOutOfOrder}>
          {pending ? <Spinner /> : null}
          Create task
        </Button>
      </DialogFooter>
    </form>
  );
}
