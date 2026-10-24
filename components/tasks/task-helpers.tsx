'use client';

import { HandHelping, UserMinus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { IconButton } from '@/components/common/icon-button';
import { Spinner } from '@/components/common/loading';
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
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTaskHelpers } from '@/lib/hooks/use-tasks';
import type { ProjectMember, TaskDetail } from '@/lib/types';

/**
 * The people working on a task, and the control for bringing in another one.
 *
 * Kept separate from the assignee multi-select in the property rail because the
 * two are different acts with different rules: replacing the assignee list
 * needs `task:assign`, whereas anyone already on the task can pull in a second
 * pair of hands. Making help a lead-only action is what stops people asking for
 * it, so this button is open to whoever is doing the work.
 *
 * Taking somebody off stays restricted — to a lead, or to yourself.
 */
export function TaskHelpers({
  task,
  members,
  currentUserId,
  canAssign,
}: {
  task: TaskDetail;
  members: ProjectMember[];
  currentUserId: string | undefined;
  canAssign: boolean;
}) {
  const helpers = useTaskHelpers(task.key);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [note, setNote] = useState('');

  const onTask = task.assignees.map((assignee) => assignee.id);
  const isAssignee = currentUserId ? onTask.includes(currentUserId) : false;
  const canAskForHelp = isAssignee || canAssign;

  const candidates = members.filter((member) => !onTask.includes(member.user.id));

  const removable = (id: string) => canAssign || id === currentUserId;

  const add = async () => {
    if (!userId) return;
    try {
      await helpers.add.mutateAsync({ userId, ...(note.trim() ? { note: note.trim() } : {}) });
      const name = members.find((member) => member.user.id === userId)?.user.name ?? 'They';
      toast.success(`${name} was asked to help`, {
        description: 'They have been notified and are now watching this task.',
      });
      setOpen(false);
      setUserId('');
      setNote('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not add them to this task');
    }
  };

  const remove = async (id: string, name: string) => {
    try {
      await helpers.remove.mutateAsync(id);
      toast.success(id === currentUserId ? `You left ${task.key}` : `${name} was taken off ${task.key}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update this task');
    }
  };

  return (
    <div className="space-y-2">
      {task.assignees.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nobody is working on this yet.</p>
      ) : (
        <ul className="space-y-1">
          {task.assignees.map((assignee) => (
            <li
              key={assignee.id}
              className="group flex items-center gap-2 rounded-md px-1 py-0.5 text-sm"
            >
              <UserAvatar user={assignee} size="xs" showTooltip={false} />
              <span className="min-w-0 flex-1 truncate">
                {assignee.name}
                {assignee.id === currentUserId ? (
                  <span className="text-muted-foreground"> (you)</span>
                ) : null}
              </span>
              {removable(assignee.id) ? (
                <IconButton
                  variant="ghost"
                  className="size-6 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-destructive"
                  pending={helpers.remove.isPending}
                  onClick={() => void remove(assignee.id, assignee.name)}
                  label={
                    assignee.id === currentUserId
                      ? 'Leave this task'
                      : `Take ${assignee.name} off this task`
                  }
                >
                  <UserMinus className="size-3.5" aria-hidden />
                </IconButton>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canAskForHelp ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5"
          disabled={candidates.length === 0}
          onClick={() => setOpen(true)}
        >
          <HandHelping className="size-3.5" aria-hidden />
          {task.assignees.length === 0 ? 'Add someone' : 'Ask for help'}
        </Button>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ask for help on {task.key}</DialogTitle>
            <DialogDescription>
              They join as an assignee, start watching the task, and get a notification — in the
              app and on Telegram if they have connected it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Field>
              <FieldLabel>Who can help?</FieldLabel>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger aria-label="Who can help">
                  <SelectValue placeholder="Choose a developer" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((member) => (
                    <SelectItem key={member.user.id} value={member.user.id}>
                      <span className="flex items-center gap-2">
                        <UserAvatar user={member.user} size="sm" showTooltip={false} />
                        <span>
                          {member.user.name}
                          <span className="text-muted-foreground"> · {member.role.name}</span>
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {candidates.length === 0 ? (
                <FieldDescription>
                  Everyone on this project is already on the task.
                </FieldDescription>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="helper-note">What do you need?</FieldLabel>
              <Textarea
                id="helper-note"
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional — what you are stuck on"
              />
              <FieldDescription>
                This goes in the notification, so they know what they are being pulled into.
              </FieldDescription>
            </Field>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="gap-2"
              disabled={!userId || helpers.add.isPending}
              onClick={() => void add()}
            >
              {helpers.add.isPending ? <Spinner /> : null}
              Ask for help
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
