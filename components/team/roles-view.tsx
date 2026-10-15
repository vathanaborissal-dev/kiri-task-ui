'use client';

import { Check, Lock, Plus, ShieldCheck, Trash2, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { CenteredSpinner } from '@/components/common/loading';
import { ErrorState } from '@/components/common/error-state';
import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';
import { IconButton } from '@/components/common/icon-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { pluralize } from '@/lib/format';
import {
  usePermissionCatalogue,
  useRoleMutations,
  useRoles,
} from '@/lib/hooks/use-workspace';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';
import type { Role } from '@/lib/types';

export function RolesView() {
  const { can } = useAuth();
  const { data: roles, isLoading, isError, error, refetch } = useRoles();
  const { data: groups } = usePermissionCatalogue();
  const mutations = useRoleMutations();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Set<string> | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<Role | null>(null);

  const selected = useMemo(
    () => roles?.find((role) => role.id === selectedId) ?? roles?.[0] ?? null,
    [roles, selectedId],
  );

  useEffect(() => {
    setDraft(null);
  }, [selected?.id]);

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isLoading || !roles || !groups) return <CenteredSpinner label="Loading roles…" />;

  const current = draft ?? new Set(selected?.permissions ?? []);
  const isAdminRole = selected?.permissions.includes('*') ?? false;
  const canEdit = can('role:update') && Boolean(selected);
  const dirty = draft !== null;

  const relevant = (scope: string) =>
    selected?.scope === 'GLOBAL' ? scope !== 'PROJECT' : scope !== 'GLOBAL';

  const toggle = (key: string) => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setDraft(next);
  };

  const toggleGroup = (keys: string[], on: boolean) => {
    const next = new Set(current);
    for (const key of keys) {
      if (on) next.add(key);
      else next.delete(key);
    }
    setDraft(next);
  };

  const save = async () => {
    if (!selected || !draft) return;
    try {
      await mutations.update.mutateAsync({
        roleId: selected.id,
        permissions: [...draft],
      });
      setDraft(null);
      toast.success(`${selected.name} updated`);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Could not save that role');
    }
  };

  const globalRoles = roles.filter((role) => role.scope === 'GLOBAL');
  const projectRoles = roles.filter((role) => role.scope === 'PROJECT');

  return (
    <div className="space-y-5">
      <PageHeader
        title="Roles & permissions"
        description={
          // Do not promise an ability the reader does not have.
          can('role:create')
            ? 'Roles are data, not code. Create as many as you need and tick exactly what each one may do.'
            : 'Roles are data, not code. Here is what each one in this workspace may do.'
        }
        actions={
          can('role:create') ? (
            <Button className="gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" aria-hidden />
              New role
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="space-y-4">
          {[
            { label: 'Workspace roles', hint: 'Apply across the whole workspace', list: globalRoles },
            { label: 'Project roles', hint: 'Assigned per project', list: projectRoles },
          ].map((section) => (
            <Card key={section.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{section.label}</CardTitle>
                <CardDescription className="text-xs">{section.hint}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 pb-3">
                {section.list.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedId(role.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                      selected?.id === role.id ? 'bg-accent font-medium' : 'hover:bg-accent/50',
                    )}
                  >
                    <ShieldCheck className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{role.name}</span>
                    {role.isSystem ? (
                      <Lock className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                    ) : null}
                    {role.isDefault ? (
                      <Badge variant="secondary" className="rounded px-1 text-[10px]">
                        default
                      </Badge>
                    ) : null}
                  </button>
                ))}
              </CardContent>
            </Card>
          ))}
        </aside>

        {selected ? (
          <Card>
            <CardHeader className="gap-3 pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {selected.name}
                    {selected.isSystem ? (
                      <Badge variant="outline" className="rounded-full text-[10px]">
                        built-in
                      </Badge>
                    ) : null}
                  </CardTitle>
                  <CardDescription>
                    {selected.description ??
                      (selected.scope === 'GLOBAL'
                        ? 'A workspace-wide role.'
                        : 'Assigned to people per project.')}
                  </CardDescription>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="size-3" aria-hidden />
                    {pluralize(selected.usageCount ?? 0, 'assignment')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {can('role:update') && !selected.isDefault ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await mutations.update.mutateAsync({
                          roleId: selected.id,
                          isDefault: true,
                        });
                        toast.success(`${selected.name} is now the default`);
                      }}
                    >
                      Make default
                    </Button>
                  ) : null}
                  {can('role:delete') && !selected.isSystem ? (
                    <IconButton
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleting(selected)}
                      label={`Delete the ${selected.name} role`}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </IconButton>
                  ) : null}
                </div>
              </div>

              {can('role:update') ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="role-name">Name</FieldLabel>
                    <Input
                      id="role-name"
                      defaultValue={selected.name}
                      onBlur={(event) =>
                        event.target.value !== selected.name
                          ? void mutations.update.mutateAsync({
                              roleId: selected.id,
                              name: event.target.value,
                            })
                          : undefined
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="role-description">Description</FieldLabel>
                    <Input
                      id="role-description"
                      defaultValue={selected.description ?? ''}
                      placeholder="What is this role for?"
                      onBlur={(event) =>
                        event.target.value !== (selected.description ?? '')
                          ? void mutations.update.mutateAsync({
                              roleId: selected.id,
                              description: event.target.value || null,
                            })
                          : undefined
                      }
                    />
                  </Field>
                </div>
              ) : null}
            </CardHeader>

            <CardContent className="space-y-5">
              {isAdminRole ? (
                <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <p>
                    This role has full access to everything. It cannot be reduced, so the workspace
                    can never be locked out.
                  </p>
                </div>
              ) : (
                groups
                  .filter((group) => group.permissions.some((p) => relevant(p.scope)))
                  .map((group) => {
                    const keys = group.permissions
                      .filter((p) => relevant(p.scope))
                      .map((p) => p.key);
                    const allOn = keys.every((key) => current.has(key));
                    return (
                      <section key={group.group} className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-medium">{group.group}</h3>
                          {canEdit ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-muted-foreground"
                              onClick={() => toggleGroup(keys, !allOn)}
                            >
                              {allOn ? 'Clear all' : 'Select all'}
                            </Button>
                          ) : null}
                        </div>
                        <div className="grid gap-1.5 sm:grid-cols-2">
                          {group.permissions
                            .filter((permission) => relevant(permission.scope))
                            .map((permission) => (
                              <label
                                key={permission.key}
                                className={cn(
                                  'flex items-start gap-2.5 rounded-md border p-2.5 transition-colors',
                                  current.has(permission.key)
                                    ? 'border-primary/40 bg-primary/5'
                                    : 'border-border',
                                  canEdit ? 'cursor-pointer hover:bg-accent/40' : 'opacity-80',
                                )}
                              >
                                <Checkbox
                                  checked={current.has(permission.key)}
                                  disabled={!canEdit}
                                  onCheckedChange={() => toggle(permission.key)}
                                  className="mt-0.5"
                                />
                                <span className="min-w-0">
                                  <span className="block text-sm font-medium">
                                    {permission.label}
                                  </span>
                                  <span className="block text-xs text-muted-foreground">
                                    {permission.description}
                                  </span>
                                </span>
                              </label>
                            ))}
                        </div>
                        <Separator className="mt-3" />
                      </section>
                    );
                  })
              )}
            </CardContent>

            {dirty ? (
              <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-card/95 px-6 py-3 backdrop-blur">
                <p className="text-sm text-muted-foreground">
                  {current.size} {current.size === 1 ? 'permission' : 'permissions'} selected
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setDraft(null)}>
                    Discard
                  </Button>
                  <Button onClick={() => void save()} disabled={mutations.update.isPending}>
                    Save changes
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>
        ) : null}
      </div>

      <CreateRoleDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete the ${deleting?.name ?? ''} role?`}
        description="People using it must be moved to another role first."
        confirmLabel="Delete role"
        destructive
        pending={mutations.remove.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await mutations.remove.mutateAsync(deleting.id);
            toast.success('Role deleted');
            setDeleting(null);
            setSelectedId(null);
          } catch (caught) {
            toast.error(caught instanceof Error ? caught.message : 'Could not delete that role');
          }
        }}
      />
    </div>
  );
}

function CreateRoleDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { create } = useRoleMutations();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<'GLOBAL' | 'PROJECT'>('PROJECT');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New role</DialogTitle>
          <DialogDescription>
            Create the role first, then tick the permissions it should have.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              const role = await create.mutateAsync({
                name,
                description: description || null,
                scope,
                permissions: [],
              });
              toast.success(`${role.name} created`, {
                description: 'Now choose what it can do.',
              });
              onOpenChange(false);
              setName('');
              setDescription('');
            } catch (caught) {
              toast.error(caught instanceof Error ? caught.message : 'Could not create that role');
            }
          }}
        >
          <Field>
            <FieldLabel htmlFor="new-role-name">Name</FieldLabel>
            <Input
              id="new-role-name"
              required
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Release Manager"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="new-role-description">Description</FieldLabel>
            <Textarea
              id="new-role-description"
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is this role responsible for?"
            />
          </Field>

          <div className="space-y-1.5">
            <Label>Scope</Label>
            <Select value={scope} onValueChange={(value) => setScope(value as typeof scope)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROJECT">Project role — assigned per project</SelectItem>
                <SelectItem value="GLOBAL">Workspace role — applies everywhere</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              Create role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
