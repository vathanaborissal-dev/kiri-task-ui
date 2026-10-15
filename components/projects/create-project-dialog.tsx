'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
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
import { useCreateProject } from '@/lib/hooks/use-projects';
import { useTeam } from '@/lib/hooks/use-workspace';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';

const COLORS = [
  '#6366f1',
  '#0ea5e9',
  '#14b8a6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#8b5cf6',
];

export function CreateProjectDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { user, can } = useAuth();
  const createProject = useCreateProject();
  const { data: team } = useTeam({ status: 'active', pageSize: 100 }, open && can('user:view'));

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]!);
  const [status, setStatus] = useState('ACTIVE');
  const [ownerId, setOwnerId] = useState<string>('');
  const [startDate, setStartDate] = useState<string | null>(new Date().toISOString());
  const [targetDate, setTargetDate] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setName('');
    setKey('');
    setDescription('');
    setColor(COLORS[0]!);
    setStatus('ACTIVE');
    setOwnerId('');
    setStartDate(new Date().toISOString());
    setTargetDate(null);
    setErrors({});
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});
    try {
      const project = await createProject.mutateAsync({
        name,
        ...(key ? { key } : {}),
        ...(description ? { description } : {}),
        color,
        status,
        ...(ownerId ? { ownerId } : {}),
        startDate,
        targetDate,
      });
      toast.success(`${project.key} created`, { description: 'Board, phases and labels are ready.' });
      onOpenChange(false);
      reset();
      router.push(`/projects/${project.key}`);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setErrors(
          Object.keys(caught.fieldErrors).length
            ? caught.fieldErrors
            : { name: caught.message },
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
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>
            Every project starts with a Kanban board, the Development → UAT → Pilot → Production
            phases, and a set of labels you can change later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <Field>
              <FieldLabel htmlFor="project-name">Project name</FieldLabel>
              <Input
                id="project-name"
                required
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Kiri Drive"
              />
              {errors.name ? <FieldError>{errors.name}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="project-key">Code</FieldLabel>
              <Input
                id="project-key"
                value={key}
                onChange={(event) => setKey(event.target.value.toUpperCase())}
                placeholder="Auto"
                maxLength={10}
                className="font-mono uppercase"
              />
              <FieldDescription>Used in task keys</FieldDescription>
              {errors.key ? <FieldError>{errors.key}</FieldError> : null}
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="project-description">Description</FieldLabel>
            <Textarea
              id="project-description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is this project for?"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNING">Planning</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ON_HOLD">On hold</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Project owner</FieldLabel>
              <Select value={ownerId || user!.id} onValueChange={setOwnerId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(team?.data.length
                    ? team.data
                    : [{ id: user!.id, name: `${user!.name} (you)` }]
                  ).map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.id === user!.id ? `${member.name} (you)` : member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Start date</FieldLabel>
              <DateField value={startDate} onChange={setStartDate} />
            </Field>
            <Field>
              <FieldLabel>Target completion</FieldLabel>
              <DateField value={targetDate} onChange={setTargetDate} placeholder="No target yet" />
            </Field>
          </div>

          <Field>
            <FieldLabel>Colour</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setColor(option)}
                  aria-label={`Use colour ${option}`}
                  aria-pressed={color === option}
                  className={cn(
                    'size-7 rounded-full border-2 transition-transform',
                    color === option
                      ? 'scale-110 border-foreground'
                      : 'border-transparent hover:scale-105',
                  )}
                  style={{ backgroundColor: option }}
                />
              ))}
            </div>
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2" disabled={createProject.isPending}>
              {createProject.isPending ? <Spinner /> : null}
              Create project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
