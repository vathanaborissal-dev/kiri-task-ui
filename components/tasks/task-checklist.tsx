'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { IconButton } from '@/components/common/icon-button';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useChecklistMutations } from '@/lib/hooks/use-tasks';
import type { ChecklistItem } from '@/lib/types';
import { cn } from '@/lib/utils';

export function TaskChecklist({
  taskKey,
  items,
  canEdit,
}: {
  taskKey: string;
  items: ChecklistItem[];
  canEdit: boolean;
}) {
  const { add, update, remove } = useChecklistMutations(taskKey);
  const [title, setTitle] = useState('');

  const done = items.filter((item) => item.isDone).length;
  const percent = items.length > 0 ? Math.round((done / items.length) * 100) : 0;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    await add.mutateAsync({ title: trimmed });
    setTitle('');
  };

  if (items.length === 0 && !canEdit) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium">Checklist</h3>
        {items.length > 0 ? (
          <span className="text-xs text-muted-foreground tabular-nums">
            {done}/{items.length}
          </span>
        ) : null}
      </div>

      {items.length > 0 ? <Progress value={percent} className="h-1.5" /> : null}

      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id} className="group flex items-center gap-2.5 rounded-md px-1 py-1 hover:bg-accent/40">
            <Checkbox
              checked={item.isDone}
              disabled={!canEdit}
              onCheckedChange={(value) =>
                void update.mutateAsync({ itemId: item.id, isDone: value === true })
              }
              aria-label={item.title}
            />
            <span
              className={cn(
                'min-w-0 flex-1 text-sm break-anywhere',
                item.isDone && 'text-muted-foreground line-through',
              )}
            >
              {item.title}
            </span>
            {canEdit ? (
              <IconButton
                variant="ghost"
                className="size-6 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                onClick={() => void remove.mutateAsync(item.id)}
                label={`Remove "${item.title}" from the checklist`}
              >
                <Trash2 className="size-3.5" aria-hidden />
              </IconButton>
            ) : null}
          </li>
        ))}
      </ul>

      {canEdit ? (
        <form onSubmit={submit} className="flex gap-2">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Add a checklist item"
            className="h-8"
          />
          <Button type="submit" size="sm" variant="outline" className="h-8 gap-1.5" disabled={add.isPending}>
            <Plus className="size-3.5" aria-hidden />
            Add
          </Button>
        </form>
      ) : null}
    </section>
  );
}
