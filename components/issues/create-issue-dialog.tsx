'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api';
import { PRIORITY_META, SEVERITY_META } from '@/lib/constants';
import { useUploadAttachments } from '@/lib/hooks/use-collab';
import { useCreateIssue } from '@/lib/hooks/use-issues';
import { useProject, useProjectMembers } from '@/lib/hooks/use-projects';
import { useAuth } from '@/providers/auth-provider';

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
  const [projectKey, setProjectKey] = useState(defaultProjectKey ?? available[0]?.key ?? '');

  useEffect(() => {
    if (open) setProjectKey(defaultProjectKey ?? available[0]?.key ?? '');
  }, [open, defaultProjectKey, available]);

  const { data: project } = useProject(open && projectKey ? projectKey : undefined);
  const { data: members } = useProjectMembers(open && projectKey ? projectKey : undefined);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [expected, setExpected] = useState('');
  const [actual, setActual] = useState('');
  const [severity, setSeverity] = useState('MAJOR');
  const [priority, setPriority] = useState('MEDIUM');
  const [phaseId, setPhaseId] = useState<string>('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const canAssign =
    (project?.myPermissions.includes('issue:assign') ?? false) ||
    (project?.myPermissions.includes('*') ?? false);

  useEffect(() => {
    if (!project) return;
    setPhaseId(
      defaultPhaseId ??
        project.phases.find((phase) => phase.isProduction)?.id ??
        project.phases[0]?.id ??
        '',
    );
  }, [project, defaultPhaseId]);

  const reset = () => {
    setTitle('');
    setDescription('');
    setSteps('');
    setExpected('');
    setActual('');
    setSeverity('MAJOR');
    setPriority('MEDIUM');
    setAssigneeId('');
    setDueDate(null);
    setFiles([]);
    setShowDetails(false);
    setErrors({});
  };

  const pending = createIssue.isPending || uploadAttachments.isPending;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!project) return;
    setErrors({});
    try {
      const issue = await createIssue.mutateAsync({
        projectId: project.id,
        title,
        ...(description ? { description } : {}),
        ...(steps ? { stepsToReproduce: steps } : {}),
        ...(expected ? { expectedResult: expected } : {}),
        ...(actual ? { actualResult: actual } : {}),
        severity,
        priority,
        ...(phaseId ? { phaseId } : {}),
        ...(assigneeId ? { assigneeId } : {}),
        ...(linkedTaskId ? { taskId: linkedTaskId } : {}),
        ...(dueDate ? { dueDate } : {}),
      });

      if (files.length > 0) {
        await uploadAttachments.mutateAsync({ files, target: { issueId: issue.id } });
      }

      toast.success(`${issue.key} reported`, {
        description: 'The project owner and leads have been notified.',
        action: {
          label: 'Open',
          onClick: () => router.push(`/projects/${project.key}/issues/${issue.key}`),
        },
      });
      const appOnlyAssignee = (members ?? []).find(
        (member) => member.user.id === assigneeId && !member.user.telegramLinked,
      );
      if (appOnlyAssignee) {
        toast.warning(`Telegram was not sent to ${appOnlyAssignee.user.name}`, {
          description: 'They received the message in the app. They must connect Telegram first.',
        });
      }
      onOpenChange(false);
      reset();
      onCreated?.(issue.key);
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
          <DialogTitle>Report an issue</DialogTitle>
          <DialogDescription>
            Describe what went wrong and where. Screenshots help a lot — you can drop them in below.
          </DialogDescription>
        </DialogHeader>

        {available.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            You do not have permission to report issues on any project yet.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Project</FieldLabel>
                <Select
                  value={projectKey}
                  onValueChange={setProjectKey}
                  disabled={Boolean(defaultProjectKey)}
                >
                  <SelectTrigger>
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
              </Field>

              <Field>
                <FieldLabel>Where did it happen?</FieldLabel>
                <Select value={phaseId || 'none'} onValueChange={(v) => setPhaseId(v === 'none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Not sure" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not sure</SelectItem>
                    {(project?.phases ?? []).map((phase) => (
                      <SelectItem key={phase.id} value={phase.id}>
                        {phase.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>The environment the problem occurred in</FieldDescription>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="issue-title">What is the problem?</FieldLabel>
              <Input
                id="issue-title"
                required
                autoFocus
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Login fails with a 500 error on long email addresses"
              />
              {errors.title ? <FieldError>{errors.title}</FieldError> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="issue-description">Description</FieldLabel>
              <Textarea
                id="issue-description"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What were you doing, and what happened?"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Severity</FieldLabel>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SEVERITY_META).map(([value, meta]) => (
                      <SelectItem key={value} value={value}>
                        {meta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>Critical and blocker alert the whole team</FieldDescription>
              </Field>

              <Field>
                <FieldLabel>Priority</FieldLabel>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_META).map(([value, meta]) => (
                      <SelectItem key={value} value={value}>
                        {meta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel>Screenshots and files</FieldLabel>
              <AttachmentPicker files={files} onChange={setFiles} disabled={pending} />
            </Field>

            {/* Owner and deadline stay on the first screen: who picks a bug up is
                part of reporting it, and burying this behind "more options" is
                why issues were landing unassigned. */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Assign to</FieldLabel>
                    <Select
                      value={assigneeId || 'none'}
                      onValueChange={(v) => setAssigneeId(v === 'none' ? '' : v)}
                      disabled={!canAssign}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Unassigned</SelectItem>
                        {(members ?? []).map((member) => (
                          <SelectItem key={member.user.id} value={member.user.id}>
                            {member.user.name} ·{' '}
                            {member.user.telegramLinked ? 'Telegram ready' : 'App only'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Fix by</FieldLabel>
                    <DateField value={dueDate} onChange={setDueDate} placeholder="No deadline" />
                  </Field>
                </div>

            {showDetails ? (
              <div className="space-y-4 rounded-lg border bg-muted/20 p-3">
                <Field>
                  <FieldLabel htmlFor="issue-steps">Steps to reproduce</FieldLabel>
                  <Textarea
                    id="issue-steps"
                    rows={3}
                    value={steps}
                    onChange={(event) => setSteps(event.target.value)}
                    placeholder={'1. Open the login page\n2. Enter a 200-character email\n3. Submit'}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="issue-expected">Expected result</FieldLabel>
                    <Textarea
                      id="issue-expected"
                      rows={2}
                      value={expected}
                      onChange={(event) => setExpected(event.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="issue-actual">Actual result</FieldLabel>
                    <Textarea
                      id="issue-actual"
                      rows={2}
                      value={actual}
                      onChange={(event) => setActual(event.target.value)}
                    />
                  </Field>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => setShowDetails(true)}
              >
                Add reproduction steps
              </Button>
            )}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="gap-2" disabled={pending || !project}>
                {pending ? <Spinner /> : null}
                Report issue
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
