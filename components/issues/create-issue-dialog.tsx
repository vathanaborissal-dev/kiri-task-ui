'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AttachmentPicker } from '@/components/common/attachment-picker';
import { DateField } from '@/components/common/date-field';
import { Spinner } from '@/components/common/loading';
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
import { PRIORITY_META, SEVERITY_META } from '@/lib/constants';
import { useUploadAttachments } from '@/lib/hooks/use-collab';
import { useCreateIssue } from '@/lib/hooks/use-issues';
import { useProject, useProjectMembers } from '@/lib/hooks/use-projects';
import { useAuth } from '@/providers/auth-provider';

/**
 * A labelled group of fields.
 *
 * The form used to be one flat stack of fourteen controls, each explaining
 * itself in its own placeholder — "Login fails with a 500 error on long email
 * addresses" as ghost text in the title, a three-step repro script in another.
 * Placeholders are not labels: they vanish the moment you type, they are
 * unreadably low-contrast, and a long example makes the field look pre-filled.
 * The examples moved into descriptions that stay put, the placeholders became
 * short hints, and the controls are grouped so the eye has somewhere to rest.
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

export function CreateIssueDialog({
  open,
  onOpenChange,
  defaultProjectKey,
  defaultPhaseId,
  linkedTaskId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectKey?: string;
  defaultPhaseId?: string;
  linkedTaskId?: string;
  onCreated?: (issueKey: string) => void;
}) {
  const router = useRouter();
  const { projectsWith } = useAuth();
  const createIssue = useCreateIssue();
  const uploadAttachments = useUploadAttachments();

  const available = useMemo(() => projectsWith('issue:create'), [projectsWith]);
  const fallbackKey = defaultProjectKey ?? available[0]?.key ?? '';

  // Keyed on the open flag rather than reset from an effect: a dialog that
  // re-initialised in an effect painted the previous report's answers for a
  // frame every time it reopened.
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
            <DialogTitle>Report an issue</DialogTitle>
            <DialogDescription>
              You do not have permission to report issues on any project yet. Ask a project manager
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Report an issue</DialogTitle>
          <DialogDescription>
            Say what went wrong and where. A screenshot saves everyone a round of questions.
          </DialogDescription>
        </DialogHeader>

        <IssueForm
          key={session}
          initialProjectKey={fallbackKey}
          available={available}
          lockedProject={Boolean(defaultProjectKey)}
          {...(defaultPhaseId ? { defaultPhaseId } : {})}
          {...(linkedTaskId ? { linkedTaskId } : {})}
          pending={createIssue.isPending || uploadAttachments.isPending}
          onCancel={() => onOpenChange(false)}
          onSubmit={async (values, files, members) => {
            const issue = await createIssue.mutateAsync(values);
            if (files.length > 0) {
              await uploadAttachments.mutateAsync({ files, target: { issueId: issue.id } });
            }

            toast.success(`${issue.key} reported`, {
              description: 'The project owner and leads have been notified.',
              action: {
                label: 'Open',
                onClick: () =>
                  router.push(`/projects/${issue.project.key}/issues/${issue.key}`),
              },
            });

            const appOnly = members.find(
              (member) => member.id === values.assigneeId && !member.telegramLinked,
            );
            if (appOnly) {
              toast.warning(`Telegram was not sent to ${appOnly.name}`, {
                description:
                  'They got the message in the app. They have to connect Telegram first.',
              });
            }

            onOpenChange(false);
            onCreated?.(issue.key);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

type SubmitValues = {
  projectId: string;
  title: string;
  severity: string;
  priority: string;
  assigneeId?: string;
  [key: string]: unknown;
};

function IssueForm({
  initialProjectKey,
  available,
  lockedProject,
  defaultPhaseId,
  linkedTaskId,
  pending,
  onCancel,
  onSubmit,
}: {
  initialProjectKey: string;
  available: { id: string; key: string; name: string }[];
  lockedProject: boolean;
  defaultPhaseId?: string;
  linkedTaskId?: string;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (
    values: SubmitValues,
    files: File[],
    members: { id: string; name: string; telegramLinked?: boolean }[],
  ) => Promise<void>;
}) {
  const [projectKey, setProjectKey] = useState(initialProjectKey);
  const { data: project } = useProject(projectKey || undefined);
  const { data: members } = useProjectMembers(projectKey || undefined);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [expected, setExpected] = useState('');
  const [actual, setActual] = useState('');
  const [severity, setSeverity] = useState('MAJOR');
  const [priority, setPriority] = useState('MEDIUM');
  const [phaseId, setPhaseId] = useState<string>('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Production is the default environment, because that is where the issues
  // that matter get noticed. Tracked separately from `phaseId` so a deliberate
  // "Not sure" is not overwritten the moment the project finishes loading.
  const [phaseSeededFor, setPhaseSeededFor] = useState<string | null>(null);
  if (project && phaseSeededFor !== project.id) {
    setPhaseSeededFor(project.id);
    setPhaseId(
      defaultPhaseId ??
        project.phases.find((phase) => phase.isProduction)?.id ??
        project.phases[0]?.id ??
        '',
    );
  }

  const permissions = new Set(project?.myPermissions ?? []);
  const canAssign = permissions.has('*') || permissions.has('issue:assign');

  const datesOutOfOrder = Boolean(startDate && dueDate && startDate > dueDate);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!project || datesOutOfOrder) return;
    setErrors({});
    try {
      await onSubmit(
        {
          projectId: project.id,
          title,
          severity,
          priority,
          ...(description ? { description } : {}),
          ...(steps ? { stepsToReproduce: steps } : {}),
          ...(expected ? { expectedResult: expected } : {}),
          ...(actual ? { actualResult: actual } : {}),
          ...(phaseId ? { phaseId } : {}),
          ...(assigneeId ? { assigneeId } : {}),
          ...(linkedTaskId ? { taskId: linkedTaskId } : {}),
          ...(startDate ? { startDate } : {}),
          ...(dueDate ? { dueDate } : {}),
        },
        files,
        (members ?? []).map((member) => member.user),
      );
    } catch (caught) {
      if (caught instanceof ApiError) {
        setErrors(
          Object.keys(caught.fieldErrors).length ? caught.fieldErrors : { title: caught.message },
        );
      } else {
        toast.error(caught instanceof Error ? caught.message : 'Could not report that issue');
      }
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* --- What happened ---------------------------------------------- */}
      <Section title="The problem">
        <Field>
          <FieldLabel htmlFor="issue-title">Summary</FieldLabel>
          <Input
            id="issue-title"
            required
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="One line — what is broken?"
          />
          <FieldDescription>
            e.g. &ldquo;Login fails with a 500 on long email addresses&rdquo;. Specific beats short.
          </FieldDescription>
          {errors.title ? <FieldError>{errors.title}</FieldError> : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="issue-description">What were you doing?</FieldLabel>
          <Textarea
            id="issue-description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe what you did and what happened instead"
          />
        </Field>

        <Field>
          <FieldLabel>Screenshots and files</FieldLabel>
          <AttachmentPicker files={files} onChange={setFiles} disabled={pending} />
        </Field>
      </Section>

      <Separator />

      {/* --- Where and how bad ------------------------------------------- */}
      <Section title="Where and how bad">
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
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.projectId ? <FieldError>{errors.projectId}</FieldError> : null}
          </Field>

          <Field>
            <FieldLabel>Environment</FieldLabel>
            <Select
              value={phaseId || 'none'}
              onValueChange={(value) => setPhaseId(value === 'none' ? '' : value)}
            >
              <SelectTrigger aria-label="Environment">
                <SelectValue placeholder="Not sure" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not sure</SelectItem>
                {(project?.phases ?? []).map((phase) => (
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
            </Select>
            <FieldDescription>Where you saw it happen</FieldDescription>
          </Field>

          <Field>
            <FieldLabel>Severity</FieldLabel>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger aria-label="Severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SEVERITY_META).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>
                    <span className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${meta.dot}`} aria-hidden />
                      {meta.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>Critical and blocker alert the whole team</FieldDescription>
          </Field>

          <Field>
            <FieldLabel>Priority</FieldLabel>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger aria-label="Priority">
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
            </Select>
            <FieldDescription>How soon it should be picked up</FieldDescription>
          </Field>
        </div>
      </Section>

      <Separator />

      {/* --- Who and when ------------------------------------------------ */}
      <Section title="Who and when" hint="An unassigned issue with no dates is nobody's job.">
        <Field>
          <FieldLabel>Assign to</FieldLabel>
          <Select
            value={assigneeId || 'none'}
            onValueChange={(value) => setAssigneeId(value === 'none' ? '' : value)}
            disabled={!canAssign}
          >
            <SelectTrigger aria-label="Assign to">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {(members ?? []).map((member) => (
                <SelectItem key={member.user.id} value={member.user.id}>
                  {member.user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>
            {canAssign
              ? 'They are notified in the app, and on Telegram if they have connected it.'
              : 'A project manager, team lead or issue manager assigns issues.'}
          </FieldDescription>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field className="min-w-0">
            <FieldLabel>Start date</FieldLabel>
            <DateField
              value={startDate}
              onChange={setStartDate}
              placeholder="Not set"
              label="Start date"
            />
            <FieldDescription>When work on the fix should begin</FieldDescription>
          </Field>
          <Field className="min-w-0">
            <FieldLabel>End date</FieldLabel>
            <DateField
              value={dueDate}
              onChange={setDueDate}
              placeholder="No deadline"
              label="End date"
            />
            {datesOutOfOrder ? (
              <FieldError>The end date cannot be before the start date.</FieldError>
            ) : (
              <FieldDescription>When it should be fixed by</FieldDescription>
            )}
          </Field>
        </div>
      </Section>

      {/* --- Reproduction, folded away ----------------------------------- */}
      <Separator />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 gap-1.5 text-muted-foreground"
        onClick={() => setShowDetails((value) => !value)}
        aria-expanded={showDetails}
      >
        {showDetails ? (
          <ChevronUp className="size-3.5" aria-hidden />
        ) : (
          <ChevronDown className="size-3.5" aria-hidden />
        )}
        {showDetails ? 'Hide reproduction steps' : 'Add reproduction steps'}
      </Button>

      {showDetails ? (
        <div className="space-y-4 rounded-lg border bg-muted/20 p-3">
          <Field>
            <FieldLabel htmlFor="issue-steps">Steps to reproduce</FieldLabel>
            <Textarea
              id="issue-steps"
              rows={4}
              value={steps}
              onChange={(event) => setSteps(event.target.value)}
              placeholder="One step per line"
            />
            <FieldDescription>
              Numbered lines work well — 1. Open the login page, 2. Enter a 200-character
              email&hellip;
            </FieldDescription>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="issue-expected">Expected result</FieldLabel>
              <Textarea
                id="issue-expected"
                rows={2}
                value={expected}
                onChange={(event) => setExpected(event.target.value)}
                placeholder="What should have happened"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="issue-actual">Actual result</FieldLabel>
              <Textarea
                id="issue-actual"
                rows={2}
                value={actual}
                onChange={(event) => setActual(event.target.value)}
                placeholder="What happened instead"
              />
            </Field>
          </div>
        </div>
      ) : null}

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="gap-2"
          disabled={pending || !project || datesOutOfOrder}
        >
          {pending ? <Spinner /> : null}
          Report issue
        </Button>
      </DialogFooter>
    </form>
  );
}
