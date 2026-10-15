'use client';

import { Link2, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { IconButton } from '@/components/common/icon-button';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { LINK_TYPE_LABEL } from '@/lib/constants';
import { useLinkMutations } from '@/lib/hooks/use-tasks';
import type { TaskLink } from '@/lib/types';
import { toast } from 'sonner';

const TYPES = Object.keys(LINK_TYPE_LABEL);

export function TaskLinks({
  taskKey,
  projectKey,
  links,
  canEdit,
}: {
  taskKey: string;
  projectKey: string;
  links: TaskLink[];
  canEdit: boolean;
}) {
  const { add, remove } = useLinkMutations(taskKey);
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState('RELATES_TO');
  const [targetKey, setTargetKey] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = targetKey.trim().toUpperCase();
    if (!trimmed) return;
    try {
      await add.mutateAsync({ targetTaskId: trimmed, type });
      setTargetKey('');
      setAdding(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not add that link');
    }
  };

  if (links.length === 0 && !canEdit) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Linked work</h3>
        {canEdit && !adding ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-muted-foreground"
            onClick={() => setAdding(true)}
          >
            <Plus className="size-3.5" aria-hidden />
            Link a task
          </Button>
        ) : null}
      </div>

      {links.length > 0 ? (
        <ul className="space-y-1">
          {links.map((link) => (
            <li
              key={link.id}
              className="group flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm"
            >
              <Link2 className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <span className="shrink-0 text-xs text-muted-foreground">
                {LINK_TYPE_LABEL[link.type]}
              </span>
              <Link
                href={`/projects/${projectKey}/tasks/${link.task.key}`}
                className="shrink-0 font-mono text-xs text-primary hover:underline"
              >
                {link.task.key}
              </Link>
              <span className="min-w-0 flex-1 truncate">{link.task.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{link.task.status.name}</span>
              {canEdit ? (
                <IconButton
                  variant="ghost"
                  className="size-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  onClick={() => void remove.mutateAsync(link.id)}
                  label={`Unlink ${link.task.key}`}
                >
                  <X className="size-3.5" aria-hidden />
                </IconButton>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {adding ? (
        <form onSubmit={submit} className="flex flex-wrap gap-2">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-8 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((value) => (
                <SelectItem key={value} value={value}>
                  {LINK_TYPE_LABEL[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={targetKey}
            onChange={(event) => setTargetKey(event.target.value)}
            placeholder={`${projectKey}-12`}
            className="h-8 w-36 font-mono"
          />
          <Button type="submit" size="sm" className="h-8" disabled={add.isPending}>
            Link
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-8" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </form>
      ) : null}
    </section>
  );
}
