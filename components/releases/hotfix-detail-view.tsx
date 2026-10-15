'use client';

import { ArrowLeft, Check, Flame, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { ActivityFeed } from '@/components/common/activity-feed';
import { DueDateBadge, HotfixStatusBadge, SeverityBadge } from '@/components/common/badges';
import { CommentThread } from '@/components/common/comment-thread';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { DateField } from '@/components/common/date-field';
import { CenteredSpinner } from '@/components/common/loading';
import { ErrorState } from '@/components/common/error-state';
import { RichText } from '@/components/common/rich-text';
import { UserAvatar } from '@/components/common/user-avatar';
import { IconButton } from '@/components/common/icon-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { HOTFIX_STATUS_META, HOTFIX_STATUS_ORDER, SEVERITY_META } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import { useActivity } from '@/lib/hooks/use-collab';
import { useProject, useProjectMembers } from '@/lib/hooks/use-projects';
import {
  useDeleteHotfix,
  useHotfix,
  useHotfixDecision,
  useReleases,
  useUpdateHotfix,
} from '@/lib/hooks/use-releases';
import { cn } from '@/lib/utils';

const TIMELINE: { key: keyof TimelineSource; label: string }[] = [
  { key: 'createdAt', label: 'Requested' },
  { key: 'approvedAt', label: 'Approved' },
  { key: 'fixedAt', label: 'Fix ready' },
  { key: 'testedAt', label: 'Tested' },
  { key: 'deployedAt', label: 'Deployed' },
  { key: 'verifiedAt', label: 'Verified' },
];

type TimelineSource = {
  createdAt: string;
  approvedAt: string | null;
  fixedAt: string | null;
  testedAt: string | null;
  deployedAt: string | null;
  verifiedAt: string | null;
};

export function HotfixDetailView({
  projectKey,
  hotfixKey,
}: {
  projectKey: string;
  hotfixKey: string;
}) {
  const router = useRouter();
  const { data: hotfix, isLoading, isError, error, refetch } = useHotfix(hotfixKey);
  const { data: project } = useProject(projectKey);
  const { data: members } = useProjectMembers(projectKey);
  const { data: releases } = useReleases({ projectId: project?.id }, Boolean(project));
  const { data: activity } = useActivity({ hotfixId: hotfixKey }, Boolean(hotfix));

  const updateHotfix = useUpdateHotfix();
  const decide = useHotfixDecision();
  const deleteHotfix = useDeleteHotfix();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rootCause, setRootCause] = useState<string | null>(null);
  const [resolution, setResolution] = useState<string | null>(null);

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isLoading || !hotfix || !project) return <CenteredSpinner label="Loading hotfix…" />;

  const permissions = new Set(project.myPermissions);
  const can = (permission: string) => permissions.has('*') || permissions.has(permission);

  const patch = async (body: Record<string, unknown>) => {
    try {
      await updateHotfix.mutateAsync({ idOrKey: hotfix.key, ...body });
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Could not save that change');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Link href={`/projects/${projectKey}/hotfixes`}>
            <ArrowLeft className="size-4" aria-hidden />
            Hotfixes
          </Link>
        </Button>
        <Flame className="size-4 text-red-500" aria-hidden />
        <span className="font-mono text-sm text-muted-foreground">{hotfix.key}</span>

        <div className="ml-auto flex items-center gap-1.5">
          {can('hotfix:approve') && hotfix.status === 'REQUESTED' ? (
            <>
              <Button
                size="sm"
                className="gap-1.5"
                disabled={decide.isPending}
                onClick={async () => {
                  await decide.mutateAsync({ idOrKey: hotfix.key, approve: true });
                  toast.success(`${hotfix.key} approved`);
                }}
              >
                <Check className="size-3.5" aria-hidden />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={decide.isPending}
                onClick={async () => {
                  await decide.mutateAsync({ idOrKey: hotfix.key, approve: false });
                  toast.success(`${hotfix.key} rejected`);
                }}
              >
                <X className="size-3.5" aria-hidden />
                Reject
              </Button>
            </>
          ) : null}
          {can('hotfix:delete') ? (
            <IconButton
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
              label="Delete this hotfix"
            >
              <Trash2 className="size-4" aria-hidden />
            </IconButton>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-5">
          <div className="space-y-3">
            <h1 className="text-xl font-semibold tracking-tight break-anywhere sm:text-2xl">
              {hotfix.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <HotfixStatusBadge status={hotfix.status} />
              <SeverityBadge severity={hotfix.severity} />
              <DueDateBadge date={hotfix.dueDate} />
            </div>
          </div>

          <Card>
            <CardContent className="pt-5">
              <ol className="flex flex-wrap gap-x-6 gap-y-3">
                {TIMELINE.map((step) => {
                  const value = hotfix[step.key] as string | null;
                  return (
                    <li key={step.key} className="flex items-start gap-2">
                      <span
                        className={cn(
                          'mt-1 size-2 shrink-0 rounded-full',
                          value ? 'bg-primary' : 'bg-muted-foreground/30',
                        )}
                        aria-hidden
                      />
                      <span className="text-xs">
                        <span className={cn('block font-medium', !value && 'text-muted-foreground')}>
                          {step.label}
                        </span>
                        <span className="text-muted-foreground">
                          {value ? formatDateTime(value) : 'pending'}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>

          {hotfix.description ? (
            <section className="space-y-1.5">
              <h2 className="text-sm font-medium">Impact</h2>
              <RichText>{hotfix.description}</RichText>
            </section>
          ) : null}

          <Separator />

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Root cause</Label>
              {can('hotfix:update') ? (
                <>
                  <Textarea
                    rows={4}
                    value={rootCause ?? hotfix.rootCause ?? ''}
                    onChange={(event) => setRootCause(event.target.value)}
                    placeholder="What actually went wrong?"
                  />
                  {rootCause !== null ? (
                    <Button
                      size="sm"
                      onClick={async () => {
                        await patch({ rootCause: rootCause || null });
                        setRootCause(null);
                      }}
                    >
                      Save
                    </Button>
                  ) : null}
                </>
              ) : (
                <RichText>{hotfix.rootCause ?? 'Not recorded.'}</RichText>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Resolution</Label>
              {can('hotfix:update') ? (
                <>
                  <Textarea
                    rows={4}
                    value={resolution ?? hotfix.resolution ?? ''}
                    onChange={(event) => setResolution(event.target.value)}
                    placeholder="What was changed to fix it?"
                  />
                  {resolution !== null ? (
                    <Button
                      size="sm"
                      onClick={async () => {
                        await patch({ resolution: resolution || null });
                        setResolution(null);
                      }}
                    >
                      Save
                    </Button>
                  ) : null}
                </>
              ) : (
                <RichText>{hotfix.resolution ?? 'Not recorded.'}</RichText>
              )}
            </div>
          </section>

          <Separator />

          <Tabs defaultValue="discussion">
            <TabsList>
              <TabsTrigger value="discussion">
                Discussion
                {hotfix.counts.comments > 0 ? (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {hotfix.counts.comments}
                  </span>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="discussion" className="pt-4">
              <CommentThread
                target={{ hotfixId: hotfix.id }}
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
                  value={hotfix.status}
                  onValueChange={(status) => void patch({ status })}
                  disabled={!can('hotfix:update')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOTFIX_STATUS_ORDER.map((status) => (
                      <SelectItem key={status} value={status}>
                        {HOTFIX_STATUS_META[status].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Developer</Label>
                <Select
                  value={hotfix.assignee?.id ?? 'none'}
                  onValueChange={(value) => void patch({ assigneeId: value === 'none' ? null : value })}
                  disabled={!can('hotfix:update')}
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
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Severity</Label>
                <Select
                  value={hotfix.severity}
                  onValueChange={(severity) => void patch({ severity })}
                  disabled={!can('hotfix:update')}
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
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Shipped in</Label>
                <Select
                  value={hotfix.release?.id ?? 'none'}
                  onValueChange={(value) => void patch({ releaseId: value === 'none' ? null : value })}
                  disabled={!can('hotfix:update')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Not assigned to a release" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not assigned yet</SelectItem>
                    {(releases?.data ?? []).map((release) => (
                      <SelectItem key={release.id} value={release.id}>
                        {release.version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Fix by</Label>
                <DateField
                  value={hotfix.dueDate}
                  onChange={(dueDate) => void patch({ dueDate })}
                  disabled={!can('hotfix:update')}
                  placeholder="As soon as possible"
                />
              </div>
            </CardContent>
          </Card>

          {hotfix.issue || hotfix.task ? (
            <Card>
              <CardContent className="space-y-2 pt-5">
                <h3 className="text-xs font-medium text-muted-foreground">Linked work</h3>
                {hotfix.issue ? (
                  <Link
                    href={`/projects/${projectKey}/issues/${hotfix.issue.key}`}
                    className="flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm hover:bg-accent/40"
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      {hotfix.issue.key}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{hotfix.issue.title}</span>
                  </Link>
                ) : null}
                {hotfix.task ? (
                  <Link
                    href={`/projects/${projectKey}/tasks/${hotfix.task.key}`}
                    className="flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm hover:bg-accent/40"
                  >
                    <span className="font-mono text-xs text-muted-foreground">{hotfix.task.key}</span>
                    <span className="min-w-0 flex-1 truncate">{hotfix.task.title}</span>
                  </Link>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent className="space-y-3 pt-5 text-xs text-muted-foreground">
              <div className="flex items-center justify-between gap-2">
                <span>Requested by</span>
                <span className="flex items-center gap-1.5 text-foreground">
                  <UserAvatar user={hotfix.requestedBy} size="xs" showTooltip={false} />
                  {hotfix.requestedBy.name}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Raised</span>
                <span>{formatDateTime(hotfix.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${hotfix.key}?`}
        description="The linked issue and task stay; only the hotfix record is removed."
        confirmLabel="Delete hotfix"
        destructive
        pending={deleteHotfix.isPending}
        onConfirm={async () => {
          await deleteHotfix.mutateAsync(hotfix.key);
          toast.success(`${hotfix.key} deleted`);
          router.push(`/projects/${projectKey}/hotfixes`);
        }}
      />
    </div>
  );
}
