'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { DateField } from '@/components/common/date-field';
import { Spinner } from '@/components/common/loading';
import { MultiSelect } from '@/components/common/multi-select';
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
import { RELEASE_STATUS_META } from '@/lib/constants';
import { useProject } from '@/lib/hooks/use-projects';
import { useCreateRelease } from '@/lib/hooks/use-releases';
import { useTasks } from '@/lib/hooks/use-tasks';

export function CreateReleaseDialog({
  open,
  onOpenChange,
  projectKey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectKey: string;
}) {
  const router = useRouter();
  const { data: project } = useProject(open ? projectKey : undefined);
  const { data: tasks } = useTasks(
    { projectId: project?.id, releaseId: 'none', includeDone: true, pageSize: 100 },
    open && Boolean(project),
  );
  const createRelease = useCreateRelease();

  const [version, setVersion] = useState('');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('PLANNED');
  const [isHotfix, setIsHotfix] = useState(false);
  const [plannedDate, setPlannedDate] = useState<string | null>(null);
  const [taskIds, setTaskIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!project) return;
    setErrors({});
    try {
      const release = await createRelease.mutateAsync({
        projectId: project.id,
        version,
        ...(name ? { name } : {}),
        ...(notes ? { releaseNotes: notes } : {}),
        status,
        isHotfix,
        plannedDate,
        ...(taskIds.length ? { taskIds } : {}),
      });
      toast.success(`Release ${release.version} created`);
      onOpenChange(false);
      setVersion('');
      setName('');
      setNotes('');
      setTaskIds([]);
      router.push(`/projects/${projectKey}/releases/${release.id}`);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setErrors(
          Object.keys(caught.fieldErrors).length ? caught.fieldErrors : { version: caught.message },
        );
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New release</DialogTitle>
          <DialogDescription>
            Group work into a version. Deploying it to a phase moves everything it contains into
            that environment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="release-version">Version</FieldLabel>
              <Input
                id="release-version"
                required
                autoFocus
                value={version}
                onChange={(event) => setVersion(event.target.value)}
                placeholder="1.4.0"
                className="font-mono"
              />
              {errors.version ? <FieldError>{errors.version}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RELEASE_STATUS_META)
                    .filter(([value]) => value !== 'RELEASED')
                    .map(([value, meta]) => (
                      <SelectItem key={value} value={value}>
                        {meta.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="release-name">Name</FieldLabel>
            <Input
              id="release-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Reporting and exports"
            />
          </Field>

          <Field>
            <FieldLabel>Planned date</FieldLabel>
            <DateField value={plannedDate} onChange={setPlannedDate} placeholder="No date yet" />
          </Field>

          <Field>
            <FieldLabel>Include tasks</FieldLabel>
            <MultiSelect
              options={(tasks?.data ?? []).map((task) => ({
                value: task.id,
                label: `${task.key} ${task.title}`,
                description: task.status.name,
              }))}
              selected={taskIds}
              onChange={setTaskIds}
              placeholder="Add tasks later"
              searchPlaceholder="Search tasks…"
              maxShown={2}
            />
            <FieldDescription>Only tasks not already in a release are listed.</FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="release-notes">Release notes</FieldLabel>
            <Textarea
              id="release-notes"
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="What changes for users in this version?"
            />
          </Field>

          <Field orientation="horizontal">
            <Checkbox
              id="release-hotfix"
              checked={isHotfix}
              onCheckedChange={(value) => setIsHotfix(value === true)}
            />
            <FieldLabel htmlFor="release-hotfix">This is a hotfix release</FieldLabel>
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2" disabled={createRelease.isPending}>
              {createRelease.isPending ? <Spinner /> : null}
              Create release
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
