'use client';

import { ArrowLeft, Bug, Flame, Rocket, Trash2, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { ActivityFeed } from '@/components/common/activity-feed';
import {
  IssueStatusBadge,
  PhaseBadge,
  QaBadge,
  ReleaseStatusBadge,
  SeverityBadge,
} from '@/components/common/badges';
import { CommentThread } from '@/components/common/comment-thread';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { DateField } from '@/components/common/date-field';
import { CenteredSpinner } from '@/components/common/loading';
import { ErrorState } from '@/components/common/error-state';
import { MultiSelect } from '@/components/common/multi-select';
import { RichText } from '@/components/common/rich-text';
import { AvatarStack, UserAvatar } from '@/components/common/user-avatar';
import { RecordDeploymentDialog } from '@/components/releases/record-deployment-dialog';
import { Badge } from '@/components/ui/badge';
import { IconButton } from '@/components/common/icon-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { DEPLOYMENT_TONE } from '@/components/releases/deployment-tone';
import { RELEASE_STATUS_META } from '@/lib/constants';
import { formatDate, formatDateTime } from '@/lib/format';
import { useActivity } from '@/lib/hooks/use-collab';
import { useProject } from '@/lib/hooks/use-projects';
import {
  useDeleteRelease,
  useRelease,
  useUpdateRelease,
  useUpdateReleaseScope,
} from '@/lib/hooks/use-releases';
import { useTasks } from '@/lib/hooks/use-tasks';

export function ReleaseDetailView({
  projectKey,
  releaseId,
}: {
  projectKey: string;
  releaseId: string;
}) {
  const router = useRouter();
  const { data: release, isLoading, isError, error, refetch } = useRelease(releaseId);
  const { data: project } = useProject(projectKey);
  const { data: activity } = useActivity({ releaseId }, Boolean(release));
  const { data: availableTasks } = useTasks(
    { projectId: project?.id, releaseId: 'none', includeDone: true, pageSize: 100 },
    Boolean(project),
  );

  const updateRelease = useUpdateRelease();
  const updateScope = useUpdateReleaseScope(releaseId);
  const deleteRelease = useDeleteRelease();

  const [deployOpen, setDeployOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isLoading || !release || !project) return <CenteredSpinner label="Loading release…" />;

  const permissions = new Set(project.myPermissions);
  const can = (permission: string) => permissions.has('*') || permissions.has(permission);

  const patch = async (body: Record<string, unknown>) => {
    try {
      await updateRelease.mutateAsync({ id: release.id, ...body });
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Could not save that change');
    }
  };

  const readiness = release.readiness;
  const donePercent =
    readiness.totalTasks > 0 ? Math.round((readiness.doneTasks / readiness.totalTasks) * 100) : 0;
  const blockers = readiness.qaFailed + readiness.openIssues;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Link href={`/projects/${projectKey}/releases`}>
            <ArrowLeft className="size-4" aria-hidden />
            Releases
          </Link>
        </Button>
        <h1 className="flex items-center gap-2 font-mono text-xl font-semibold">
          {release.version}
          {release.isHotfix ? <Flame className="size-4 text-red-500" aria-hidden /> : null}
        </h1>
        <ReleaseStatusBadge status={release.status} />
        <PhaseBadge phase={release.phase} />

        <div className="ml-auto flex items-center gap-1.5">
          {can('release:deploy') ? (
            <Button size="sm" className="gap-1.5" onClick={() => setDeployOpen(true)}>
              <Upload className="size-3.5" aria-hidden />
              Record deployment
            </Button>
          ) : null}
          {can('release:delete') ? (
            <IconButton
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
              label="Delete this release"
            >
              <Trash2 className="size-4" aria-hidden />
            </IconButton>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Readiness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4">
                <Progress value={donePercent} className="h-2 flex-1" />
                <span className="w-24 text-right text-xs text-muted-foreground tabular-nums">
                  {readiness.doneTasks}/{readiness.totalTasks} done
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <div className="rounded-lg border p-2">
                  <p className="text-xs text-muted-foreground">Passed QA</p>
                  <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {readiness.qaPassed}
                  </p>
                </div>
                <div className="rounded-lg border p-2">
                  <p className="text-xs text-muted-foreground">Awaiting QA</p>
                  <p className="text-lg font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                    {readiness.qaPending}
                  </p>
                </div>
                <div className="rounded-lg border p-2">
                  <p className="text-xs text-muted-foreground">Failed QA</p>
                  <p className="text-lg font-semibold tabular-nums text-red-600 dark:text-red-400">
                    {readiness.qaFailed}
                  </p>
                </div>
                <div className="rounded-lg border p-2">
                  <p className="text-xs text-muted-foreground">Open issues</p>
                  <p className="text-lg font-semibold tabular-nums">{readiness.openIssues}</p>
                </div>
              </div>
              {blockers > 0 ? (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {blockers} {blockers === 1 ? 'item needs' : 'items need'} attention before this
                  ships.
                </p>
              ) : readiness.totalTasks > 0 && readiness.doneTasks === readiness.totalTasks ? (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Everything in this release is done and nothing is failing.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Tabs defaultValue="scope">
            <TabsList>
              <TabsTrigger value="scope">
                Scope
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {release.counts.tasks + release.counts.issues}
                </span>
              </TabsTrigger>
              <TabsTrigger value="deployments">
                Deployments
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {release.deployments.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="notes">Release notes</TabsTrigger>
              <TabsTrigger value="discussion">Discussion</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="scope" className="space-y-4 pt-4">
              {can('release:update') ? (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Add tasks to this release</Label>
                  <MultiSelect
                    options={(availableTasks?.data ?? []).map((task) => ({
                      value: task.id,
                      label: `${task.key} ${task.title}`,
                      description: task.status.name,
                    }))}
                    selected={[]}
                    onChange={(taskIds) =>
                      taskIds.length
                        ? void updateScope.mutateAsync({ taskIds, mode: 'add' })
                        : undefined
                    }
                    placeholder="Pick tasks to include"
                    searchPlaceholder="Search tasks…"
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Tasks</h3>
                {release.tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nothing in scope yet.</p>
                ) : (
                  release.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                    >
                      <Link
                        href={`/projects/${projectKey}/tasks/${task.key}`}
                        className="font-mono text-xs text-muted-foreground hover:text-foreground"
                      >
                        {task.key}
                      </Link>
                      <Link
                        href={`/projects/${projectKey}/tasks/${task.key}`}
                        className="min-w-0 flex-1 truncate hover:underline"
                      >
                        {task.title}
                      </Link>
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px]"
                        style={{
                          backgroundColor: `${task.status.color}22`,
                          color: task.status.color,
                        }}
                      >
                        {task.status.name}
                      </span>
                      <QaBadge status={task.qaStatus} />
                      <PhaseBadge phase={task.phase} />
                      <AvatarStack users={task.assignees} max={2} size="xs" label="Assignees" />
                      {can('release:update') ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-muted-foreground"
                          onClick={() =>
                            void updateScope.mutateAsync({ taskIds: [task.id], mode: 'remove' })
                          }
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  ))
                )}
              </div>

              {release.issues.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Issues fixed</h3>
                  {(release.issues as unknown as {
                    id: string;
                    key: string;
                    title: string;
                    status: 'OPEN';
                    severity: 'MAJOR';
                  }[]).map((issue) => (
                    <div
                      key={issue.id}
                      className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                    >
                      <Link
                        href={`/projects/${projectKey}/issues/${issue.key}`}
                        className="font-mono text-xs text-muted-foreground hover:text-foreground"
                      >
                        {issue.key}
                      </Link>
                      <span className="min-w-0 flex-1 truncate">{issue.title}</span>
                      <SeverityBadge severity={issue.severity} />
                      <IssueStatusBadge status={issue.status} />
                    </div>
                  ))}
                </div>
              ) : null}

              {release.hotfixes.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Hotfixes</h3>
                  {release.hotfixes.map((hotfix) => (
                    <Link
                      key={hotfix.id}
                      href={`/projects/${projectKey}/hotfixes/${hotfix.key}`}
                      className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent/40"
                    >
                      <Flame className="size-3.5 text-red-500" aria-hidden />
                      <span className="font-mono text-xs text-muted-foreground">{hotfix.key}</span>
                      <span className="min-w-0 flex-1 truncate">{hotfix.title}</span>
                      <Badge variant="outline" className="rounded-full text-[10px]">
                        {hotfix.status.toLowerCase().replace('_', ' ')}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="deployments" className="space-y-2 pt-4">
              {release.deployments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No deployments recorded. Record one when this version reaches an environment.
                </p>
              ) : (
                <ol className="space-y-2">
                  {release.deployments.map((deployment) => (
                    <li key={deployment.id} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <PhaseBadge phase={deployment.phase} />
                        <Badge
                          variant="outline"
                          className={`rounded-full text-[11px] ${DEPLOYMENT_TONE[deployment.status]}`}
                        >
                          {deployment.status.toLowerCase().replace('_', ' ')}
                        </Badge>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {formatDateTime(deployment.deployedAt)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <UserAvatar user={deployment.deployedBy} size="xs" showTooltip={false} />
                        {deployment.deployedBy.name}
                      </div>
                      {deployment.notes ? (
                        <p className="mt-2 text-sm break-anywhere">{deployment.notes}</p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </TabsContent>

            <TabsContent value="notes" className="space-y-2 pt-4">
              {can('release:update') ? (
                <>
                  <Textarea
                    rows={10}
                    value={notes ?? release.releaseNotes ?? ''}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="What changes for users in this version?"
                  />
                  <Button
                    size="sm"
                    disabled={notes === null || updateRelease.isPending}
                    onClick={async () => {
                      await patch({ releaseNotes: notes });
                      setNotes(null);
                      toast.success('Release notes saved');
                    }}
                  >
                    Save notes
                  </Button>
                </>
              ) : release.releaseNotes ? (
                <RichText>{release.releaseNotes}</RichText>
              ) : (
                <p className="text-sm text-muted-foreground">No release notes yet.</p>
              )}
            </TabsContent>

            <TabsContent value="discussion" className="pt-4">
              <CommentThread
                target={{ releaseId: release.id }}
                projectId={project.id}
                canComment={can('comment:create')}
                canModerate={can('comment:moderate')}
              />
            </TabsContent>

            <TabsContent value="history" className="pt-4">
              <ActivityFeed entries={activity?.data ?? []} showEntity={false} />
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-5">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select
                  value={release.status}
                  onValueChange={(status) => void patch({ status })}
                  disabled={!can('release:update')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RELEASE_STATUS_META).map(([value, meta]) => (
                      <SelectItem key={value} value={value}>
                        {meta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Planned date</Label>
                <DateField
                  value={release.plannedDate}
                  onChange={(plannedDate) => void patch({ plannedDate })}
                  disabled={!can('release:update')}
                  placeholder="No date"
                />
              </div>

              <div className="space-y-2 border-t pt-3 text-xs text-muted-foreground">
                <div className="flex items-center justify-between gap-2">
                  <span>Created by</span>
                  <span className="flex items-center gap-1.5 text-foreground">
                    <UserAvatar user={release.createdBy} size="xs" showTooltip={false} />
                    {release.createdBy.name}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Created</span>
                  <span>{formatDate(release.createdAt)}</span>
                </div>
                {release.releasedAt ? (
                  <div className="flex items-center justify-between gap-2">
                    <span>Released</span>
                    <span>{formatDate(release.releasedAt)}</span>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {release.counts.issues > 0 ? (
            <Card>
              <CardContent className="flex items-center gap-2 pt-5 text-sm">
                <Bug className="size-4 text-muted-foreground" aria-hidden />
                {release.counts.issues} issues are linked to this release
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent className="flex items-center gap-2 pt-5 text-sm text-muted-foreground">
              <Rocket className="size-4" aria-hidden />
              Deploying to the production phase marks this release as shipped and moves every task
              it contains into Production.
            </CardContent>
          </Card>
        </aside>
      </div>

      <RecordDeploymentDialog
        open={deployOpen}
        onOpenChange={setDeployOpen}
        releaseId={release.id}
        phases={project.phases}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete release ${release.version}?`}
        description="Tasks and issues stay, but they will no longer belong to a release."
        confirmLabel="Delete release"
        destructive
        pending={deleteRelease.isPending}
        onConfirm={async () => {
          await deleteRelease.mutateAsync(release.id);
          toast.success('Release deleted');
          router.push(`/projects/${projectKey}/releases`);
        }}
      />
    </div>
  );
}
