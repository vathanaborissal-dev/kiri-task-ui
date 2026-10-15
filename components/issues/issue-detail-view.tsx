'use client';

import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Flame,
  Pencil,
  Plus,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { ActivityFeed } from '@/components/common/activity-feed';
import { AttachmentGallery } from '@/components/common/attachment-gallery';
import { AttachmentPicker } from '@/components/common/attachment-picker';
import { DueDateBadge, IssueStatusBadge, PhaseBadge, SeverityBadge } from '@/components/common/badges';
import { CommentThread } from '@/components/common/comment-thread';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { DateField } from '@/components/common/date-field';
import { CenteredSpinner } from '@/components/common/loading';
import { ErrorState } from '@/components/common/error-state';
import { RichText } from '@/components/common/rich-text';
import { AvatarStack, UserAvatar } from '@/components/common/user-avatar';
import { CreateHotfixDialog } from '@/components/releases/create-hotfix-dialog';
import { IconButton } from '@/components/common/icon-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  HOTFIX_STATUS_META,
  ISSUE_STATUS_META,
  ISSUE_STATUS_ORDER,
  PRIORITY_META,
  SEVERITY_META,
} from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import { useActivity, useDeleteAttachment, useUploadAttachments } from '@/lib/hooks/use-collab';
import {
  useChangeIssueStatus,
  useCreateTaskFromIssue,
  useDeleteIssue,
  useIssue,
  useToggleIssueWatch,
  useUpdateIssue,
} from '@/lib/hooks/use-issues';
import { useProject, useProjectMembers } from '@/lib/hooks/use-projects';
import { useAuth } from '@/providers/auth-provider';
import { Badge } from '@/components/ui/badge';

export function IssueDetailView({
  projectKey,
  issueKey,
}: {
  projectKey: string;
  issueKey: string;
}) {
  const router = useRouter();
  const { user } = useAuth();

  const { data: issue, isLoading, isError, error, refetch } = useIssue(issueKey);
  const { data: project } = useProject(projectKey);
  const { data: members } = useProjectMembers(projectKey);
  const { data: activity } = useActivity({ issueId: issueKey }, Boolean(issue));

  const updateIssue = useUpdateIssue();
  const changeStatus = useChangeIssueStatus();
  const deleteIssue = useDeleteIssue();
  const toggleWatch = useToggleIssueWatch();
  const createTask = useCreateTaskFromIssue();
  const uploadAttachments = useUploadAttachments();
  const deleteAttachment = useDeleteAttachment();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: '', description: '', steps: '', expected: '', actual: '' });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [hotfixOpen, setHotfixOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isLoading || !issue || !project) return <CenteredSpinner label="Loading issue…" />;

  const permissions = new Set(project.myPermissions);
  const can = (permission: string) => permissions.has('*') || permissions.has(permission);
  const watching = (issue.watchers ?? []).some((w) => w.id === user?.id);

  const patch = async (body: Record<string, unknown>) => {
    try {
      await updateIssue.mutateAsync({ idOrKey: issue.key, ...body });
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Could not save that change');
    }
  };

  const moveTo = async (status: string) => {
    try {
      await changeStatus.mutateAsync({ idOrKey: issue.key, status: status as 'OPEN' });
      toast.success(`${issue.key} is now ${ISSUE_STATUS_META[status as 'OPEN'].label}`);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Could not change the status');
    }
  };

  const row = (label: string, control: React.ReactNode) => (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {control}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Link href={`/projects/${projectKey}/issues`}>
            <ArrowLeft className="size-4" aria-hidden />
            Issues
          </Link>
        </Button>
        <span className="font-mono text-sm text-muted-foreground">{issue.key}</span>

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => void toggleWatch.mutateAsync(issue.key)}
          >
            {watching ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
            {watching ? 'Unwatch' : 'Watch'}
          </Button>

          {can('task:create') && !issue.task ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={createTask.isPending}
              onClick={async () => {
                const result = await createTask.mutateAsync(issue.key);
                toast.success(`${result.data.key} created`, {
                  action: { label: 'Open', onClick: () => router.push(result.url) },
                });
              }}
            >
              <Wrench className="size-3.5" aria-hidden />
              Create fix task
            </Button>
          ) : null}

          {can('hotfix:create') ? (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setHotfixOpen(true)}>
              <Flame className="size-3.5" aria-hidden />
              Request hotfix
            </Button>
          ) : null}

          {can('issue:delete') ? (
            <IconButton
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
              label="Delete this issue"
            >
              <Trash2 className="size-4" aria-hidden />
            </IconButton>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          {editing ? (
            <div className="space-y-3">
              <Input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                className="h-11 text-lg font-semibold"
              />
              <Textarea
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                rows={4}
                placeholder="Description"
              />
              <Textarea
                value={draft.steps}
                onChange={(event) => setDraft({ ...draft, steps: event.target.value })}
                rows={3}
                placeholder="Steps to reproduce"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Textarea
                  value={draft.expected}
                  onChange={(event) => setDraft({ ...draft, expected: event.target.value })}
                  rows={2}
                  placeholder="Expected result"
                />
                <Textarea
                  value={draft.actual}
                  onChange={(event) => setDraft({ ...draft, actual: event.target.value })}
                  rows={2}
                  placeholder="Actual result"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={async () => {
                    await patch({
                      title: draft.title,
                      description: draft.description || null,
                      stepsToReproduce: draft.steps || null,
                      expectedResult: draft.expected || null,
                      actualResult: draft.actual || null,
                    });
                    setEditing(false);
                  }}
                >
                  <Check className="size-3.5" aria-hidden />
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  <X className="size-3.5" aria-hidden />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="group flex items-start gap-2">
                <h1 className="text-xl font-semibold tracking-tight break-anywhere sm:text-2xl">
                  {issue.title}
                </h1>
                {can('issue:update') ? (
                  <IconButton
                    variant="ghost"
                    className="mt-0.5 size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    onClick={() => {
                      setDraft({
                        title: issue.title,
                        description: issue.description ?? '',
                        steps: issue.stepsToReproduce ?? '',
                        expected: issue.expectedResult ?? '',
                        actual: issue.actualResult ?? '',
                      });
                      setEditing(true);
                    }}
                    label="Edit this issue"
                  >
                    <Pencil className="size-3.5" aria-hidden />
                  </IconButton>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <IssueStatusBadge status={issue.status} />
                <SeverityBadge severity={issue.severity} />
                <PhaseBadge phase={issue.phase} />
                <DueDateBadge date={issue.dueDate} />
                {issue.reopenCount > 0 ? (
                  <Badge variant="outline" className="rounded-full text-[11px]">
                    Reopened {issue.reopenCount}×
                  </Badge>
                ) : null}
              </div>

              {can('issue:change_status') ? (
                <div className="flex flex-wrap gap-1.5">
                  {ISSUE_STATUS_ORDER.filter((status) => status !== issue.status).map((status) => (
                    <Button
                      key={status}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={changeStatus.isPending}
                      onClick={() => void moveTo(status)}
                    >
                      {ISSUE_STATUS_META[status].label}
                    </Button>
                  ))}
                </div>
              ) : null}

              <section className="space-y-4">
                {issue.description ? (
                  <div className="space-y-1.5">
                    <h2 className="text-sm font-medium">Description</h2>
                    <RichText>{issue.description}</RichText>
                  </div>
                ) : null}
                {issue.stepsToReproduce ? (
                  <div className="space-y-1.5">
                    <h2 className="text-sm font-medium">Steps to reproduce</h2>
                    <RichText>{issue.stepsToReproduce}</RichText>
                  </div>
                ) : null}
                {issue.expectedResult || issue.actualResult ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {issue.expectedResult ? (
                      <div className="space-y-1.5">
                        <h2 className="text-sm font-medium">Expected</h2>
                        <RichText>{issue.expectedResult}</RichText>
                      </div>
                    ) : null}
                    {issue.actualResult ? (
                      <div className="space-y-1.5">
                        <h2 className="text-sm font-medium">Actual</h2>
                        <RichText>{issue.actualResult}</RichText>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {!issue.description && !issue.stepsToReproduce ? (
                  <p className="text-sm text-muted-foreground">No details were added.</p>
                ) : null}
              </section>
            </>
          )}

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Screenshots and files</h3>
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
                  <Button
                    size="sm"
                    disabled={uploadAttachments.isPending}
                    onClick={async () => {
                      await uploadAttachments.mutateAsync({ files, target: { issueId: issue.id } });
                      setFiles([]);
                      setShowUpload(false);
                      toast.success('Files attached');
                    }}
                  >
                    Upload {files.length} {files.length === 1 ? 'file' : 'files'}
                  </Button>
                ) : null}
              </div>
            ) : null}
            {(issue.attachments ?? []).length === 0 && !showUpload ? (
              <p className="text-sm text-muted-foreground">Nothing attached.</p>
            ) : (
              <AttachmentGallery
                attachments={issue.attachments ?? []}
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
                {issue.counts.comments > 0 ? (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {issue.counts.comments}
                  </span>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="activity">History</TabsTrigger>
            </TabsList>
            <TabsContent value="comments" className="pt-4">
              <CommentThread
                target={{ issueId: issue.id }}
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
              {row(
                'Status',
                <Select
                  value={issue.status}
                  onValueChange={(status) => void moveTo(status)}
                  disabled={!can('issue:change_status')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_STATUS_ORDER.map((status) => (
                      <SelectItem key={status} value={status}>
                        {ISSUE_STATUS_META[status].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>,
              )}

              {row(
                'Assignee',
                <Select
                  value={issue.assignee?.id ?? 'none'}
                  onValueChange={(value) => void patch({ assigneeId: value === 'none' ? null : value })}
                  disabled={!can('issue:assign')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {(members ?? []).map((member) => (
                      <SelectItem key={member.user.id} value={member.user.id}>
                        {member.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>,
              )}

              {row(
                'Severity',
                <Select
                  value={issue.severity}
                  onValueChange={(severity) => void patch({ severity })}
                  disabled={!can('issue:update')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SEVERITY_META).map(([value, meta]) => (
                      <SelectItem key={value} value={value}>
                        {meta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>,
              )}

              {row(
                'Priority',
                <Select
                  value={issue.priority}
                  onValueChange={(priority) => void patch({ priority })}
                  disabled={!can('issue:update')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_META).map(([value, meta]) => (
                      <SelectItem key={value} value={value}>
                        {meta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>,
              )}

              {row(
                'Environment',
                <Select
                  value={issue.phase?.id ?? 'none'}
                  onValueChange={(value) => void patch({ phaseId: value === 'none' ? null : value })}
                  disabled={!can('issue:update')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Not specified" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {project.phases.map((phase) => (
                      <SelectItem key={phase.id} value={phase.id}>
                        {phase.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>,
              )}

              {row(
                'Fix by',
                <DateField
                  value={issue.dueDate}
                  onChange={(dueDate) => void patch({ dueDate })}
                  disabled={!can('issue:update')}
                  placeholder="No deadline"
                />,
              )}
            </CardContent>
          </Card>

          {issue.task || (issue.hotfixes ?? []).length > 0 ? (
            <Card>
              <CardContent className="space-y-2 pt-5">
                <h3 className="text-xs font-medium text-muted-foreground">Linked work</h3>
                {issue.task ? (
                  <Link
                    href={`/projects/${projectKey}/tasks/${issue.task.key}`}
                    className="flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm hover:bg-accent/40"
                  >
                    <Wrench className="size-3.5 text-muted-foreground" aria-hidden />
                    <span className="font-mono text-xs text-muted-foreground">{issue.task.key}</span>
                    <span className="min-w-0 flex-1 truncate">{issue.task.title}</span>
                  </Link>
                ) : null}
                {(issue.hotfixes ?? []).map((hotfix) => (
                  <Link
                    key={hotfix.id}
                    href={`/projects/${projectKey}/hotfixes/${hotfix.key}`}
                    className="flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm hover:bg-accent/40"
                  >
                    <Flame className="size-3.5 text-red-500" aria-hidden />
                    <span className="font-mono text-xs text-muted-foreground">{hotfix.key}</span>
                    <span className="min-w-0 flex-1 truncate">{hotfix.title}</span>
                    <Badge
                      variant="outline"
                      className={`shrink-0 rounded-full text-[10px] ${HOTFIX_STATUS_META[hotfix.status].className}`}
                    >
                      {HOTFIX_STATUS_META[hotfix.status].label}
                    </Badge>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent className="space-y-3 pt-5 text-xs text-muted-foreground">
              <div className="flex items-center justify-between gap-2">
                <span>Reported by</span>
                <span className="flex items-center gap-1.5 text-foreground">
                  <UserAvatar user={issue.reporter} size="xs" showTooltip={false} />
                  {issue.reporter.name}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Reported</span>
                <span>{formatDateTime(issue.createdAt)}</span>
              </div>
              {issue.resolvedAt ? (
                <div className="flex items-center justify-between gap-2">
                  <span>Resolved</span>
                  <span>{formatDateTime(issue.resolvedAt)}</span>
                </div>
              ) : null}
              {issue.closedAt ? (
                <div className="flex items-center justify-between gap-2">
                  <span>Closed</span>
                  <span>{formatDateTime(issue.closedAt)}</span>
                </div>
              ) : null}
              {(issue.watchers ?? []).length > 0 ? (
                <div className="flex items-center justify-between gap-2">
                  <span>Watching</span>
                  <AvatarStack users={issue.watchers ?? []} max={4} size="xs" label="Watching" />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>

      <CreateHotfixDialog
        open={hotfixOpen}
        onOpenChange={setHotfixOpen}
        projectKey={projectKey}
        issueId={issue.id}
        defaultTitle={issue.title}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${issue.key}?`}
        description="This removes the issue, its comments and attachments. It cannot be undone."
        confirmLabel="Delete issue"
        destructive
        pending={deleteIssue.isPending}
        onConfirm={async () => {
          await deleteIssue.mutateAsync(issue.key);
          toast.success(`${issue.key} deleted`);
          router.push(`/projects/${projectKey}/issues`);
        }}
      />
    </div>
  );
}
