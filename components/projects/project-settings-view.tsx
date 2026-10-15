'use client';

import { Archive, ArchiveRestore, GripVertical, Lock, Plus, Trash2, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { DateField } from '@/components/common/date-field';
import { CenteredSpinner } from '@/components/common/loading';
import { UserAvatar } from '@/components/common/user-avatar';
import { IconButton } from '@/components/common/icon-button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { STATUS_CATEGORY_META } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import {
  useAssignableUsers,
  useDeleteProject,
  useArchiveProject,
  useProject,
  useProjectMemberMutations,
  useProjectSettingsMutations,
  useUpdateProject,
} from '@/lib/hooks/use-projects';
import { useRoles, useTeam } from '@/lib/hooks/use-workspace';
import { useAuth } from '@/providers/auth-provider';

const COLORS = ['#6366f1', '#0ea5e9', '#14b8a6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#64748b'];

function ColorPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COLORS.map((color) => (
        <button
          key={color}
          type="button"
          disabled={disabled}
          onClick={() => onChange(color)}
          aria-label={`Use ${color}`}
          aria-pressed={value === color}
          className={`size-6 rounded-full border-2 ${value === color ? 'border-foreground' : 'border-transparent'} disabled:cursor-not-allowed disabled:opacity-50`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

export function ProjectSettingsView({ projectKey }: { projectKey: string }) {
  const router = useRouter();
  const { can, refresh } = useAuth();
  const { data: project } = useProject(projectKey);
  const { data: assignable } = useAssignableUsers(projectKey);
  const { data: projectRoles } = useRoles('PROJECT');
  const { data: team } = useTeam({ status: 'active', pageSize: 100 }, can('user:view'));

  const updateProject = useUpdateProject(projectKey);
  const archiveProject = useArchiveProject(projectKey);
  const deleteProject = useDeleteProject(projectKey);
  const members = useProjectMemberMutations(projectKey);
  const settings = useProjectSettingsMutations(projectKey);

  const [details, setDetails] = useState<Record<string, unknown> | null>(null);
  const [newMember, setNewMember] = useState({ userId: '', roleId: '', responsibilities: '' });
  const [newStatus, setNewStatus] = useState({ name: '', category: 'TODO', color: '#64748b' });
  const [newPhase, setNewPhase] = useState({ name: '', description: '', color: '#64748b' });
  const [newLabel, setNewLabel] = useState({ name: '', color: '#64748b' });
  const [newMilestone, setNewMilestone] = useState({ name: '', dueDate: null as string | null });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusToDelete, setStatusToDelete] = useState<string | null>(null);
  const [moveToStatusId, setMoveToStatusId] = useState('');

  if (!project) return <CenteredSpinner />;

  const permissions = new Set(project.myPermissions);
  const may = (permission: string) => permissions.has('*') || permissions.has(permission);
  const canEdit = may('project:update');
  const canSettings = may('project:manage_settings');
  const canMembers = may('project:manage_members');

  const field = (key: string, fallback: unknown) =>
    details && key in details ? details[key] : fallback;

  const saveDetails = async () => {
    if (!details) return;
    try {
      await updateProject.mutateAsync(details);
      setDetails(null);
      toast.success('Project updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save the project');
    }
  };

  return (
    <div className="space-y-5">
      {/* Greyed-out fields with no Save button are confusing on their own; say why. */}
      {canEdit ? null : (
        <Alert>
          <Lock aria-hidden />
          <AlertTitle>You can see these settings but not change them</AlertTitle>
          <AlertDescription>
            Your role on this project is read-only here. Ask a project manager if something needs
            to change.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="members">Team</TabsTrigger>
          <TabsTrigger value="workflow">Board & phases</TabsTrigger>
          <TabsTrigger value="labels">Labels & milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-5 pt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Project details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="project-name">Name</Label>
                  <Input
                    id="project-name"
                    disabled={!canEdit}
                    value={String(field('name', project.name))}
                    onChange={(event) => setDetails({ ...details, name: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Code</Label>
                  <Input value={project.key} disabled className="font-mono" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  rows={4}
                  disabled={!canEdit}
                  value={String(field('description', project.description ?? ''))}
                  onChange={(event) => setDetails({ ...details, description: event.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    disabled={!canEdit}
                    value={String(field('status', project.status))}
                    onValueChange={(status) => setDetails({ ...details, status })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLANNING">Planning</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="ON_HOLD">On hold</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Start date</Label>
                  <DateField
                    disabled={!canEdit}
                    value={field('startDate', project.startDate) as string | null}
                    onChange={(startDate) => setDetails({ ...details, startDate })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Target completion</Label>
                  <DateField
                    disabled={!canEdit}
                    value={field('targetDate', project.targetDate) as string | null}
                    onChange={(targetDate) => setDetails({ ...details, targetDate })}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Owner</Label>
                  <Select
                    disabled={!canEdit || !can('user:view')}
                    value={String(field('ownerId', project.owner.id))}
                    onValueChange={(ownerId) => setDetails({ ...details, ownerId })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(team?.data ?? [project.owner]).map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Colour</Label>
                  <ColorPicker
                    disabled={!canEdit}
                    value={String(field('color', project.color))}
                    onChange={(color) => setDetails({ ...details, color })}
                  />
                </div>
              </div>

              {details ? (
                <div className="flex gap-2">
                  <Button onClick={() => void saveDetails()} disabled={updateProject.isPending}>
                    Save changes
                  </Button>
                  <Button variant="ghost" onClick={() => setDetails(null)}>
                    Cancel
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {may('project:archive') || may('project:delete') ? (
            <Card className="border-destructive/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
                <CardDescription>
                  Archiving hides the project from the sidebar and lists but keeps all of its data.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {may('project:archive') ? (
                  <Button
                    variant="outline"
                    className="gap-1.5"
                    disabled={archiveProject.isPending}
                    onClick={async () => {
                      const restoring = Boolean(project.archivedAt);
                      try {
                        await archiveProject.mutateAsync(restoring);
                        if (restoring) {
                          await refresh();
                          toast.success('Project restored');
                        } else {
                          router.replace('/projects');
                          toast.success('Project archived and hidden from active projects');
                          void refresh();
                        }
                      } catch (error) {
                        toast.error(
                          error instanceof Error ? error.message : 'Could not update the project',
                        );
                      }
                    }}
                  >
                    {project.archivedAt ? (
                      <>
                        <ArchiveRestore className="size-4" aria-hidden />
                        Restore project
                      </>
                    ) : (
                      <>
                        <Archive className="size-4" aria-hidden />
                        Archive project
                      </>
                    )}
                  </Button>
                ) : null}
                {may('project:delete') ? (
                  <Button variant="destructive" className="gap-1.5" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="size-4" aria-hidden />
                    Delete project
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="members" className="space-y-5 pt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Team members</CardTitle>
              <CardDescription>
                A person&apos;s project role decides what they can do here — somebody can be a
                Project Manager on this project and a Viewer on another.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {project.members.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
                >
                  <UserAvatar user={member.user} size="md" showTooltip={false} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{member.user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
                  </div>

                  <Select
                    disabled={!canMembers}
                    value={member.role.id}
                    onValueChange={(roleId) =>
                      void members.update.mutateAsync({ memberId: member.id, roleId })
                    }
                  >
                    <SelectTrigger size="sm" className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(projectRoles ?? []).map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    disabled={!canMembers}
                    defaultValue={member.responsibilities ?? ''}
                    placeholder="Responsibilities"
                    className="h-8 w-full sm:w-56"
                    onBlur={(event) => {
                      if (event.target.value !== (member.responsibilities ?? '')) {
                        void members.update.mutateAsync({
                          memberId: member.id,
                          responsibilities: event.target.value || null,
                        });
                      }
                    }}
                  />

                  {canMembers && member.user.id !== project.owner.id ? (
                    <IconButton
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => void members.remove.mutateAsync(member.id)}
                      label={`Remove ${member.user.name} from this project`}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </IconButton>
                  ) : null}
                </div>
              ))}

              {canMembers ? (
                <>
                  <Separator />
                  <form
                    className="flex flex-wrap items-end gap-2"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      if (!newMember.userId || !newMember.roleId) return;
                      await members.add.mutateAsync({
                        userId: newMember.userId,
                        roleId: newMember.roleId,
                        responsibilities: newMember.responsibilities || null,
                      });
                      setNewMember({ userId: '', roleId: '', responsibilities: '' });
                      toast.success('Member added');
                    }}
                  >
                    <div className="min-w-48 flex-1 space-y-1.5">
                      <Label className="text-xs">Person</Label>
                      <Select
                        value={newMember.userId}
                        onValueChange={(userId) => setNewMember({ ...newMember, userId })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose someone" />
                        </SelectTrigger>
                        <SelectContent>
                          {(assignable ?? []).map((person) => (
                            <SelectItem key={person.id} value={person.id}>
                              {person.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-40 space-y-1.5">
                      <Label className="text-xs">Project role</Label>
                      <Select
                        value={newMember.roleId}
                        onValueChange={(roleId) => setNewMember({ ...newMember, roleId })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {(projectRoles ?? []).map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-48 flex-1 space-y-1.5">
                      <Label className="text-xs">Responsibilities</Label>
                      <Input
                        value={newMember.responsibilities}
                        onChange={(event) =>
                          setNewMember({ ...newMember, responsibilities: event.target.value })
                        }
                        placeholder="Frontend, API, QA…"
                      />
                    </div>
                    <Button type="submit" className="gap-1.5" disabled={members.add.isPending}>
                      <UserPlus className="size-4" aria-hidden />
                      Add
                    </Button>
                  </form>
                  {(assignable?.length ?? 0) === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Everyone in the workspace is already on this project.
                    </p>
                  ) : null}
                </>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-5 pt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Board columns</CardTitle>
              <CardDescription>
                The work statuses on the Kanban board. The category decides how a status counts
                towards progress.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {project.statuses.map((status) => (
                <div key={status.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-2.5">
                  <GripVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <Input
                    disabled={!canSettings}
                    defaultValue={status.name}
                    className="h-8 w-40"
                    onBlur={(event) =>
                      event.target.value !== status.name
                        ? void settings.updateStatus.mutateAsync({
                            statusId: status.id,
                            name: event.target.value,
                          })
                        : undefined
                    }
                  />
                  <Select
                    disabled={!canSettings}
                    value={status.category}
                    onValueChange={(category) =>
                      void settings.updateStatus.mutateAsync({ statusId: status.id, category })
                    }
                  >
                    <SelectTrigger size="sm" className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CATEGORY_META).map(([value, meta]) => (
                        <SelectItem key={value} value={value}>
                          {meta.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {canSettings ? (
                    <ColorPicker
                      value={status.color}
                      onChange={(color) =>
                        void settings.updateStatus.mutateAsync({ statusId: status.id, color })
                      }
                    />
                  ) : null}
                  {status.isDefault ? (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      default
                    </span>
                  ) : canSettings ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() =>
                        void settings.updateStatus.mutateAsync({
                          statusId: status.id,
                          isDefault: true,
                        })
                      }
                    >
                      Make default
                    </Button>
                  ) : null}
                  {canSettings ? (
                    <IconButton
                      variant="ghost"
                      className="ml-auto text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        setStatusToDelete(status.id);
                        setMoveToStatusId(
                          project.statuses.find((s) => s.id !== status.id)?.id ?? '',
                        );
                      }}
                      label={`Delete the ${status.name} column`}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </IconButton>
                  ) : null}
                </div>
              ))}

              {canSettings ? (
                <form
                  className="flex flex-wrap items-end gap-2 border-t pt-3"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (!newStatus.name.trim()) return;
                    await settings.createStatus.mutateAsync(newStatus);
                    setNewStatus({ name: '', category: 'TODO', color: '#64748b' });
                  }}
                >
                  <Input
                    value={newStatus.name}
                    onChange={(event) => setNewStatus({ ...newStatus, name: event.target.value })}
                    placeholder="New status name"
                    className="h-9 w-44"
                  />
                  <Select
                    value={newStatus.category}
                    onValueChange={(category) => setNewStatus({ ...newStatus, category })}
                  >
                    <SelectTrigger size="sm" className="h-9 w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CATEGORY_META).map(([value, meta]) => (
                        <SelectItem key={value} value={value}>
                          {meta.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ColorPicker
                    value={newStatus.color}
                    onChange={(color) => setNewStatus({ ...newStatus, color })}
                  />
                  <Button type="submit" className="gap-1.5">
                    <Plus className="size-4" aria-hidden />
                    Add status
                  </Button>
                </form>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Lifecycle phases</CardTitle>
              <CardDescription>
                The environments work travels through. Exactly one phase is the production phase —
                deploying a release there marks it shipped.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {project.phases.map((phase) => (
                <div key={phase.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-2.5">
                  <Input
                    disabled={!canSettings}
                    defaultValue={phase.name}
                    className="h-8 w-36"
                    onBlur={(event) =>
                      event.target.value !== phase.name
                        ? void settings.updatePhase.mutateAsync({
                            phaseId: phase.id,
                            name: event.target.value,
                          })
                        : undefined
                    }
                  />
                  <Input
                    disabled={!canSettings}
                    defaultValue={phase.description ?? ''}
                    placeholder="What this phase means"
                    className="h-8 min-w-48 flex-1"
                    onBlur={(event) =>
                      event.target.value !== (phase.description ?? '')
                        ? void settings.updatePhase.mutateAsync({
                            phaseId: phase.id,
                            description: event.target.value || null,
                          })
                        : undefined
                    }
                  />
                  {canSettings ? (
                    <ColorPicker
                      value={phase.color}
                      onChange={(color) =>
                        void settings.updatePhase.mutateAsync({ phaseId: phase.id, color })
                      }
                    />
                  ) : null}
                  {phase.isProduction ? (
                    <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                      production
                    </span>
                  ) : canSettings ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() =>
                        void settings.updatePhase.mutateAsync({
                          phaseId: phase.id,
                          isProduction: true,
                        })
                      }
                    >
                      Mark production
                    </Button>
                  ) : null}
                  {canSettings ? (
                    <IconButton
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={async () => {
                        try {
                          await settings.deletePhase.mutateAsync(phase.id);
                        } catch (error) {
                          toast.error(
                            error instanceof Error ? error.message : 'Could not delete that phase',
                          );
                        }
                      }}
                      label={`Delete the ${phase.name} phase`}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </IconButton>
                  ) : null}
                </div>
              ))}

              {canSettings ? (
                <form
                  className="flex flex-wrap items-end gap-2 border-t pt-3"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (!newPhase.name.trim()) return;
                    await settings.createPhase.mutateAsync(newPhase);
                    setNewPhase({ name: '', description: '', color: '#64748b' });
                  }}
                >
                  <Input
                    value={newPhase.name}
                    onChange={(event) => setNewPhase({ ...newPhase, name: event.target.value })}
                    placeholder="New phase name"
                    className="h-9 w-36"
                  />
                  <Input
                    value={newPhase.description}
                    onChange={(event) =>
                      setNewPhase({ ...newPhase, description: event.target.value })
                    }
                    placeholder="Description"
                    className="h-9 min-w-48 flex-1"
                  />
                  <ColorPicker
                    value={newPhase.color}
                    onChange={(color) => setNewPhase({ ...newPhase, color })}
                  />
                  <Button type="submit" className="gap-1.5">
                    <Plus className="size-4" aria-hidden />
                    Add phase
                  </Button>
                </form>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="labels" className="space-y-5 pt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Labels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {project.labels.map((label) => (
                  <span
                    key={label.id}
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs"
                    style={{ backgroundColor: `${label.color}22`, color: label.color }}
                  >
                    {label.name}
                    {canSettings ? (
                      <button
                        type="button"
                        onClick={() => void settings.deleteLabel.mutateAsync(label.id)}
                        aria-label={`Delete ${label.name}`}
                        className="opacity-60 hover:opacity-100"
                      >
                        ×
                      </button>
                    ) : null}
                  </span>
                ))}
                {project.labels.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No labels yet.</p>
                ) : null}
              </div>

              {canSettings ? (
                <form
                  className="flex flex-wrap items-end gap-2 border-t pt-3"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (!newLabel.name.trim()) return;
                    await settings.createLabel.mutateAsync(newLabel);
                    setNewLabel({ name: '', color: '#64748b' });
                  }}
                >
                  <Input
                    value={newLabel.name}
                    onChange={(event) => setNewLabel({ ...newLabel, name: event.target.value })}
                    placeholder="New label"
                    className="h-9 w-40"
                  />
                  <ColorPicker
                    value={newLabel.color}
                    onChange={(color) => setNewLabel({ ...newLabel, color })}
                  />
                  <Button type="submit" className="gap-1.5">
                    <Plus className="size-4" aria-hidden />
                    Add label
                  </Button>
                </form>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Milestones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {project.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border p-2.5"
                >
                  <Input
                    disabled={!canSettings}
                    defaultValue={milestone.name}
                    className="h-8 min-w-44 flex-1"
                    onBlur={(event) =>
                      event.target.value !== milestone.name
                        ? void settings.updateMilestone.mutateAsync({
                            milestoneId: milestone.id,
                            name: event.target.value,
                          })
                        : undefined
                    }
                  />
                  <span className="text-xs text-muted-foreground">
                    {milestone.taskCount} tasks · {formatDate(milestone.dueDate)}
                  </span>
                  {canSettings ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() =>
                          void settings.updateMilestone.mutateAsync({
                            milestoneId: milestone.id,
                            completed: !milestone.completedAt,
                          })
                        }
                      >
                        {milestone.completedAt ? 'Reopen' : 'Mark done'}
                      </Button>
                      <IconButton
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => void settings.deleteMilestone.mutateAsync(milestone.id)}
                        label={`Delete the ${milestone.name} milestone`}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </IconButton>
                    </>
                  ) : null}
                </div>
              ))}
              {project.milestones.length === 0 ? (
                <p className="text-sm text-muted-foreground">No milestones yet.</p>
              ) : null}

              {canSettings ? (
                <form
                  className="flex flex-wrap items-end gap-2 border-t pt-3"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (!newMilestone.name.trim()) return;
                    await settings.createMilestone.mutateAsync(newMilestone);
                    setNewMilestone({ name: '', dueDate: null });
                  }}
                >
                  <Input
                    value={newMilestone.name}
                    onChange={(event) =>
                      setNewMilestone({ ...newMilestone, name: event.target.value })
                    }
                    placeholder="Milestone name"
                    className="h-9 w-56"
                  />
                  <div className="w-48">
                    <DateField
                      value={newMilestone.dueDate}
                      onChange={(dueDate) => setNewMilestone({ ...newMilestone, dueDate })}
                      placeholder="Due date"
                    />
                  </div>
                  <Button type="submit" className="gap-1.5">
                    <Plus className="size-4" aria-hidden />
                    Add milestone
                  </Button>
                </form>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${project.name}?`}
        description="Every task, issue, release and comment in this project is removed permanently. Archiving is usually what you want instead."
        confirmLabel="Delete this project"
        destructive
        requireText={project.key}
        requireTextLabel={`Type ${project.key} to confirm`}
        pending={deleteProject.isPending}
        onConfirm={async () => {
          await deleteProject.mutateAsync(project.key);
          toast.success('Project deleted');
          router.push('/projects');
        }}
      />

      <ConfirmDialog
        open={statusToDelete !== null}
        onOpenChange={(open) => !open && setStatusToDelete(null)}
        title="Delete this status?"
        description={
          <span className="space-y-2">
            <span className="block">
              Any tasks in it will be moved to the status you pick below.
            </span>
            <Select value={moveToStatusId} onValueChange={setMoveToStatusId}>
              <SelectTrigger className="mt-2 w-full">
                <SelectValue placeholder="Move tasks to…" />
              </SelectTrigger>
              <SelectContent>
                {project.statuses
                  .filter((status) => status.id !== statusToDelete)
                  .map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </span>
        }
        confirmLabel="Delete status"
        destructive
        pending={settings.deleteStatus.isPending}
        onConfirm={async () => {
          if (!statusToDelete) return;
          try {
            await settings.deleteStatus.mutateAsync({
              statusId: statusToDelete,
              moveToStatusId,
            });
            setStatusToDelete(null);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not delete that status');
          }
        }}
      />
    </div>
  );
}
