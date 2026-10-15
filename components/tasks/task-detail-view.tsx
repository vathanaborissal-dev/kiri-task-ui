'use client';

import {
  ArrowLeft,
  Bug,
  Check,
  Eye,
  EyeOff,
  Flame,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { ActivityFeed } from '@/components/common/activity-feed';
import { AttachmentGallery } from '@/components/common/attachment-gallery';
import { AttachmentPicker } from '@/components/common/attachment-picker';
import {
  DueDateBadge,
  HotfixStatusBadge,
  IssueStatusBadge,
  PhaseBadge,
  PriorityBadge,
  QaBadge,
  SeverityBadge,
  TaskStatusBadge,
} from '@/components/common/badges';
import { CommentThread } from '@/components/common/comment-thread';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { CenteredSpinner } from '@/components/common/loading';
import { ErrorState } from '@/components/common/error-state';
import { RichText } from '@/components/common/rich-text';
import { AvatarStack, UserAvatar } from '@/components/common/user-avatar';
import { CreateIssueDialog } from '@/components/issues/create-issue-dialog';
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog';
import { TaskChecklist } from '@/components/tasks/task-checklist';
import { TaskLinks } from '@/components/tasks/task-links';
import { TaskProperties, type TaskPatch } from '@/components/tasks/task-properties';
import { IconButton } from '@/components/common/icon-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { TASK_TYPE_META } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import { useActivity, useDeleteAttachment, useUploadAttachments } from '@/lib/hooks/use-collab';
import { useProject, useProjectMembers } from '@/lib/hooks/use-projects';
import {
  useDeleteTask,
  useTask,
  useToggleWatch,
  useUpdateTask,
} from '@/lib/hooks/use-tasks';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';

export function TaskDetailView({
  projectKey,
  taskKey,
}: {
  projectKey: string;
  taskKey: string;
}) {
  const router = useRouter();
  const { user } = useAuth();

  const { data: task, isLoading, isError, error, refetch } = useTask(taskKey);
  const { data: project } = useProject(projectKey);
  const { data: members } = useProjectMembers(projectKey);
  const { data: activity } = useActivity({ taskId: taskKey }, Boolean(task));

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const toggleWatch = useToggleWatch();
  const uploadAttachments = useUploadAttachments();
  const deleteAttachment = useDeleteAttachment();

  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [description, setDescription] = useState('');
  const [subtaskOpen, setSubtaskOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isLoading || !task || !project) return <CenteredSpinner label="Loading task…" />;

  const permissions = new Set(project.myPermissions);
  const can = (permission: string) => permissions.has('*') || permissions.has(permission);
  const watching = task.watchers.some((w) => w.id === user?.id);
  // Defaulted rather than read straight off the payload: an API that is a
  // deploy behind simply shows no dependants instead of blanking the page.
  const dependants = { issues: task.issues ?? [], hotfixes: task.hotfixes ?? [] };

  const patch = async (body: TaskPatch) => {
    try {
      await updateTask.mutateAsync({ idOrKey: task.key, ...body });
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Could not save that change');
    }
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;
    await uploadAttachments.mutateAsync({ files, target: { taskId: task.id } });
    setFiles([]);
    setShowUpload(false);
    toast.success('Files attached');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Link href={`/projects/${projectKey}/board`}>
            <ArrowLeft className="size-4" aria-hidden />
            {project.name}
          </Link>
        </Button>
        <span className="font-mono text-sm text-muted-foreground">{task.key}</span>
        {task.parentTask ? (
          <>
            <span className="text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              subtask of{' '}
              <Link
                href={`/projects/${projectKey}/tasks/${task.parentTask.key}`}
                className="text-primary hover:underline"
              >
                {task.parentTask.key}
              </Link>
            </span>
          </>
        ) : null}

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => void toggleWatch.mutateAsync(task.key)}
          >
            {watching ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
            {watching ? 'Unwatch' : 'Watch'}
          </Button>
          {can('issue:create') ? (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setIssueOpen(true)}>
              <Bug className="size-3.5" aria-hidden />
              Report issue
            </Button>
          ) : null}
          {can('task:delete') ? (
            <IconButton
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
              label="Delete this task"
            >
              <Trash2 className="size-4" aria-hidden />
            </IconButton>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          {editingTitle ? (
            <div className="flex gap-2">
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="h-11 text-lg font-semibold"
                autoFocus
              />
              <IconButton
                className="size-11"
                onClick={async () => {
                  await patch({ title });
                  setEditingTitle(false);
                }}
                label="Save the title"
              >
                <Check className="size-4" aria-hidden />
              </IconButton>
              <IconButton
                variant="ghost"
                className="size-11"
                onClick={() => setEditingTitle(false)}
                label="Discard the change"
              >
                <X className="size-4" aria-hidden />
              </IconButton>
            </div>
          ) : (
            <div className="group flex items-start gap-2">
              <h1 className="text-xl font-semibold tracking-tight break-anywhere sm:text-2xl">
                {task.title}
              </h1>
              {can('task:update') ? (
                <IconButton
                  variant="ghost"
                  className="mt-0.5 size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  onClick={() => {
                    setTitle(task.title);
                    setEditingTitle(true);
                  }}
                  label="Rename this task"
                >
                  <Pencil className="size-3.5" aria-hidden />
                </IconButton>
              ) : null}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <TaskStatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            <PhaseBadge phase={task.phase} />
            <QaBadge status={task.qaStatus} />
            <DueDateBadge date={task.dueDate} />
            <span className="text-xs text-muted-foreground">
              {TASK_TYPE_META[task.type].label}
            </span>
            {task.release ? (
              <Link
                href={`/projects/${projectKey}/releases/${task.release.id}`}
                className="text-xs text-primary hover:underline"
              >
                in {task.release.version}
              </Link>
            ) : null}
          </div>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Description</h2>
              {can('task:update') && !editingDescription ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-muted-foreground"
                  onClick={() => {
                    setDescription(task.description ?? '');
                    setEditingDescription(true);
                  }}
                >
                  <Pencil className="size-3.5" aria-hidden />
                  Edit
                </Button>
              ) : null}
            </div>

            {editingDescription ? (
              <div className="space-y-2">
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={8}
                  autoFocus
                  placeholder="Context, acceptance criteria, links…"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      await patch({ description: description || null });
                      setEditingDescription(false);
                    }}
                    disabled={updateTask.isPending}
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingDescription(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : task.description ? (
              <RichText>{task.description}</RichText>
            ) : (
              <p className="text-sm text-muted-foreground">No description yet.</p>
            )}
          </section>

          <Separator />

          <TaskChecklist taskKey={task.key} items={task.checklist} canEdit={can('task:update')} />

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                Subtasks
                {task.subtasks.length > 0 ? (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {task.subtasks.filter((s) => s.status.category === 'DONE').length}/
                    {task.subtasks.length}
                  </span>
                ) : null}
              </h3>
              {can('task:create') && !task.parentTaskId ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-muted-foreground"
                  onClick={() => setSubtaskOpen(true)}
                >
                  <Plus className="size-3.5" aria-hidden />
                  Add subtask
                </Button>
              ) : null}
            </div>
            {task.subtasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subtasks.</p>
            ) : (
              <ul className="space-y-1">
                {task.subtasks.map((subtask) => (
                  <li key={subtask.id}>
                    <Link
                      href={`/projects/${projectKey}/tasks/${subtask.key}`}
                      className="flex items-center gap-2.5 rounded-md border px-2.5 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-accent/30"
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: subtask.status.color }}
                        aria-hidden
                      />
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {subtask.key}
                      </span>
                      <span
                        className={cn(
                          'min-w-0 flex-1 truncate',
                          subtask.status.category === 'DONE' && 'text-muted-foreground line-through',
                        )}
                      >
                        {subtask.title}
                      </span>
                      <DueDateBadge date={subtask.dueDate} />
                      <AvatarStack
                        users={subtask.assignees.map((a) => a.user)}
                        max={2}
                        size="xs"
                        label="Assignees"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <TaskLinks
            taskKey={task.key}
            projectKey={projectKey}
            links={task.links}
            canEdit={can('task:update')}
          />

          {dependants.issues.length > 0 || dependants.hotfixes.length > 0 ? (
            <section className="space-y-2">
              <h3 className="text-sm font-medium">Waiting on this task</h3>
              <ul className="space-y-1">
                {dependants.issues.map((issue) => (
                  <li key={issue.id}>
                    <Link
                      href={`/projects/${projectKey}/issues/${issue.key}`}
                      className="flex flex-wrap items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition-colors hover:border-primary/40 hover:bg-accent/30"
                    >
                      <Bug className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {issue.key}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{issue.title}</span>
                      <SeverityBadge severity={issue.severity} />
                      <IssueStatusBadge status={issue.status} />
                    </Link>
                  </li>
                ))}
                {dependants.hotfixes.map((hotfix) => (
                  <li key={hotfix.id}>
                    <Link
                      href={`/projects/${projectKey}/hotfixes/${hotfix.key}`}
                      className="flex flex-wrap items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition-colors hover:border-primary/40 hover:bg-accent/30"
                    >
                      <Flame className="size-3.5 shrink-0 text-red-500" aria-hidden />
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {hotfix.key}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{hotfix.title}</span>
                      <SeverityBadge severity={hotfix.severity} />
                      <HotfixStatusBadge status={hotfix.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Attachments</h3>
              {can('attachment:upload') ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-muted-foreground"
                  onClick={() => setShowUpload((value) => !value)}
                >
                  <Plus className="size-3.5" aria-hidden />
                  Add files
                </Button>
              ) : null}
            </div>
            {showUpload ? (
              <div className="space-y-2">
                <AttachmentPicker files={files} onChange={setFiles} disabled={uploadAttachments.isPending} />
                {files.length > 0 ? (
                  <Button size="sm" onClick={() => void uploadFiles()} disabled={uploadAttachments.isPending}>
                    Upload {files.length} {files.length === 1 ? 'file' : 'files'}
                  </Button>
                ) : null}
              </div>
            ) : null}
            {task.attachments.length === 0 && !showUpload ? (
              <p className="text-sm text-muted-foreground">Nothing attached.</p>
            ) : (
              <AttachmentGallery
                attachments={task.attachments}
                onDelete={(id) => void deleteAttachment.mutateAsync(id)}
                canDelete={(attachment) =>
                  can('attachment:delete') || attachment.uploadedBy.id === user?.id
                }
              />
            )}
          </section>

          <Separator />

          <Tabs defaultValue="comments">
            <TabsList>
              <TabsTrigger value="comments">
                Comments
                {task.counts.comments > 0 ? (
                  <span className="ml-1.5 text-xs text-muted-foreground">{task.counts.comments}</span>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="activity">History</TabsTrigger>
            </TabsList>
            <TabsContent value="comments" className="pt-4">
              <CommentThread
                target={{ taskId: task.id }}
                projectId={project.id}
                canComment={can('comment:create')}
                canModerate={can('comment:moderate')}
              />
            </TabsContent>
            <TabsContent value="activity" className="pt-4">
              <ActivityFeed entries={activity?.data ?? []} showEntity={false} />
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-5">
              <TaskProperties
                task={task}
                project={project}
                members={members ?? []}
                permissions={permissions}
                onPatch={(body) => void patch(body)}
                pending={updateTask.isPending}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 pt-5 text-xs text-muted-foreground">
              <div className="flex items-center justify-between gap-2">
                <span>Reported by</span>
                <span className="flex items-center gap-1.5 text-foreground">
                  <UserAvatar user={task.reporter} size="xs" showTooltip={false} />
                  {task.reporter.name}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Created</span>
                <span>{formatDateTime(task.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Updated</span>
                <span>{formatDateTime(task.updatedAt)}</span>
              </div>
              {task.completedAt ? (
                <div className="flex items-center justify-between gap-2">
                  <span>Completed</span>
                  <span>{formatDateTime(task.completedAt)}</span>
                </div>
              ) : null}
              {task.watchers.length > 0 ? (
                <div className="flex items-center justify-between gap-2">
                  <span>Watching</span>
                  <AvatarStack users={task.watchers} max={4} size="xs" label="Watching" />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>

      <CreateTaskDialog
        open={subtaskOpen}
        onOpenChange={setSubtaskOpen}
        defaultProjectKey={projectKey}
        parentTaskId={task.id}
        parentTaskKey={task.key}
      />
      <CreateIssueDialog
        open={issueOpen}
        onOpenChange={setIssueOpen}
        defaultProjectKey={projectKey}
        linkedTaskId={task.id}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${task.key}?`}
        description="This removes the task, its subtasks, comments and attachments. It cannot be undone."
        confirmLabel="Delete task"
        destructive
        pending={deleteTask.isPending}
        onConfirm={async () => {
          await deleteTask.mutateAsync(task.key);
          toast.success(`${task.key} deleted`);
          router.push(`/projects/${projectKey}/board`);
        }}
      />
    </div>
  );
}
