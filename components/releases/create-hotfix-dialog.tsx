'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DateField } from '@/components/common/date-field';
import { Spinner } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useProject, useProjectMembers } from '@/lib/hooks/use-projects';
import { useCreateHotfix } from '@/lib/hooks/use-releases';
import { useAuth } from '@/providers/auth-provider';

export function CreateHotfixDialog({
  open,
  onOpenChange,
  projectKey: fixedProjectKey,
  issueId,
  defaultTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectKey?: string;
  issueId?: string;
  defaultTitle?: string;
}) {
  const router = useRouter();
  const { projectsWith } = useAuth();
  const createHotfix = useCreateHotfix();

  const available = useMemo(() => projectsWith('hotfix:create'), [projectsWith]);
  const [projectKey, setProjectKey] = useState(fixedProjectKey ?? available[0]?.key ?? '');
  const { data: project } = useProject(open && projectKey ? projectKey : undefined);
  const { data: members } = useProjectMembers(open && projectKey ? projectKey : undefined);

  const [title, setTitle] = useState(defaultTitle ?? '');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('CRITICAL');
  const [priority, setPriority] = useState('CRITICAL');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [createTask, setCreateTask] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setProjectKey(fixedProjectKey ?? available[0]?.key ?? '');
      setTitle(defaultTitle ?? '');
    }
  }, [open, fixedProjectKey, available, defaultTitle]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!project) return;
    setErrors({});
    try {
      const hotfix = await createHotfix.mutateAsync({
        projectId: project.id,
        title,
        ...(description ? { description } : {}),
        severity,
        priority,
        ...(issueId ? { issueId } : {}),
        ...(assigneeId ? { assigneeId } : {}),
        ...(dueDate ? { dueDate } : {}),
        createTask,
      });
      toast.success(`${hotfix.key} raised`, {
        description: 'Approvers have been notified on the web and Telegram.',
        action: {
          label: 'Open',
          onClick: () => router.push(`/projects/${project.key}/hotfixes/${hotfix.key}`),
        },
      });
      onOpenChange(false);
      setTitle('');
      setDescription('');
      setAssigneeId('');
      setDueDate(null);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setErrors(
          Object.keys(caught.fieldErrors).length ? caught.fieldErrors : { title: caught.message },
        );
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request a hotfix</DialogTitle>
          <DialogDescription>
            Use this for urgent production problems. Approvers are alerted straight away and can
            approve from Telegram.
          </DialogDescription>
        </DialogHeader>

        {available.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            You do not have permission to raise hotfixes on any project.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {!fixedProjectKey ? (
              <Field>
                <FieldLabel>Project</FieldLabel>
                <Select value={projectKey} onValueChange={setProjectKey}>
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
            ) : null}

            <Field>
              <FieldLabel htmlFor="hotfix-title">What needs fixing?</FieldLabel>
              <Input
                id="hotfix-title"
                required
                autoFocus
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Payments fail for returning customers"
              />
              {errors.title ? <FieldError>{errors.title}</FieldError> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="hotfix-description">Impact and context</FieldLabel>
              <Textarea
                id="hotfix-description"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Who is affected, since when, and what the workaround is."
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
              </Field>
              <Field>
                <FieldLabel>Urgency</FieldLabel>
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

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Developer</FieldLabel>
                <Select
                  value={assigneeId || 'none'}
                  onValueChange={(value) => setAssigneeId(value === 'none' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Decide later" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Decide later</SelectItem>
                    {(members ?? []).map((member) => (
                      <SelectItem key={member.user.id} value={member.user.id}>
                        {member.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Fix by</FieldLabel>
                <DateField value={dueDate} onChange={setDueDate} placeholder="As soon as possible" />
              </Field>
            </div>

            <Field orientation="horizontal">
              <Checkbox
                id="hotfix-task"
                checked={createTask}
                onCheckedChange={(value) => setCreateTask(value === true)}
              />
              <div>
                <FieldLabel htmlFor="hotfix-task">Create a linked task</FieldLabel>
                <FieldDescription>
                  Creates a HOTFIX task in the production phase so the work shows on the board.
                </FieldDescription>
              </div>
            </Field>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="gap-2" disabled={createHotfix.isPending || !project}>
                {createHotfix.isPending ? <Spinner /> : null}
                Raise hotfix
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
