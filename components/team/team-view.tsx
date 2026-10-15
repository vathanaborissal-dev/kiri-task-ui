'use client';

import { Mail, MoreHorizontal, Search, Send, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { ListSkeleton } from '@/components/common/loading';
import { ErrorState } from '@/components/common/error-state';
import { PageHeader } from '@/components/common/page-header';
import { UserAvatar } from '@/components/common/user-avatar';
import { InviteMemberDialog } from '@/components/team/invite-member-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, formatTimeAgo } from '@/lib/format';
import { useInvitations, useRoles, useTeam, useUserMutations } from '@/lib/hooks/use-workspace';
import { useAuth } from '@/providers/auth-provider';

export function TeamView() {
  const { can, user } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('active');
  const [roleId, setRoleId] = useState('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removing, setRemoving] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, isError, error, refetch } = useTeam({
    ...(search ? { search } : {}),
    status,
    ...(roleId !== 'all' ? { roleId } : {}),
  });
  const { data: roles } = useRoles('GLOBAL', can('role:view'));
  const { data: invitations } = useInvitations(can('user:invite'));
  const mutations = useUserMutations();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Team"
        description="Everyone in the workspace, their workspace role and current workload."
        actions={
          can('user:invite') ? (
            <Button className="gap-1.5" onClick={() => setInviteOpen(true)}>
              <UserPlus className="size-4" aria-hidden />
              Invite someone
            </Button>
          ) : undefined
        }
      />

      <Tabs defaultValue="people">
        <TabsList>
          <TabsTrigger value="people">People</TabsTrigger>
          {can('user:invite') ? (
            <TabsTrigger value="invitations">
              Pending invitations
              {invitations?.length ? (
                <Badge variant="secondary" className="ml-1.5 rounded px-1 text-[10px]">
                  {invitations.length}
                </Badge>
              ) : null}
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="people" className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-48 flex-1 sm:max-w-xs">
              <Search
                className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, email or job title…"
                className="h-9 pl-8"
              />
            </div>

            <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
              <SelectTrigger size="sm" className="h-9 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Deactivated</SelectItem>
                <SelectItem value="all">Everyone</SelectItem>
              </SelectContent>
            </Select>

            {roles?.length ? (
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger size="sm" className="h-9 w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any workspace role</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>

          {isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : isLoading ? (
            <ListSkeleton rows={5} />
          ) : (data?.data.length ?? 0) === 0 ? (
            <EmptyState icon={Users} title="Nobody matches that" />
          ) : (
            <Card className="overflow-hidden p-0">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Person</TableHead>
                      <TableHead>Workspace role</TableHead>
                      <TableHead>Responsibilities</TableHead>
                      <TableHead className="text-right">Projects</TableHead>
                      <TableHead className="text-right">Open work</TableHead>
                      <TableHead>Last seen</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data!.data.map((member) => (
                      <TableRow key={member.id} className={member.isActive ? '' : 'opacity-60'}>
                        <TableCell>
                          <Link
                            href={`/team/${member.id}`}
                            className="flex items-center gap-2.5 hover:underline"
                          >
                            <UserAvatar user={member} size="md" showTooltip={false} />
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{member.name}</span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {member.jobTitle ?? member.email}
                              </span>
                            </span>
                          </Link>
                        </TableCell>
                        <TableCell>
                          {can('user:assign_role') && member.id !== user?.id ? (
                            <Select
                              value={member.globalRole.id}
                              onValueChange={(globalRoleId) =>
                                void mutations.update.mutateAsync({
                                  userId: member.id,
                                  globalRoleId,
                                })
                              }
                            >
                              <SelectTrigger size="sm" className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(roles ?? []).map((role) => (
                                  <SelectItem key={role.id} value={role.id}>
                                    {role.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {member.globalRole.name}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-56 truncate text-sm text-muted-foreground">
                          {member.responsibilities ?? '—'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {member.projectCount}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {member.openTaskCount + member.openIssueCount}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {member.lastLoginAt ? formatTimeAgo(member.lastLoginAt) : 'Never'}
                        </TableCell>
                        <TableCell>
                          {can('user:manage_status') || can('user:delete') ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7"
                                  aria-label={`Actions for ${member.name}`}
                                  title={`Actions for ${member.name}`}
                                >
                                  <MoreHorizontal className="size-4" aria-hidden />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/team/${member.id}`}>View profile</Link>
                                </DropdownMenuItem>
                                {can('user:manage_status') && member.id !== user?.id ? (
                                  <DropdownMenuItem
                                    onClick={async () => {
                                      await mutations.update.mutateAsync({
                                        userId: member.id,
                                        isActive: !member.isActive,
                                      });
                                      toast.success(
                                        member.isActive
                                          ? `${member.name} deactivated`
                                          : `${member.name} reactivated`,
                                      );
                                    }}
                                  >
                                    {member.isActive ? 'Deactivate account' : 'Reactivate account'}
                                  </DropdownMenuItem>
                                ) : null}
                                {can('user:delete') && member.id !== user?.id ? (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onClick={() =>
                                        setRemoving({ id: member.id, name: member.name })
                                      }
                                    >
                                      Delete account
                                    </DropdownMenuItem>
                                  </>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {can('user:invite') ? (
          <TabsContent value="invitations" className="pt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Pending invitations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(invitations?.length ?? 0) === 0 ? (
                  <p className="py-3 text-sm text-muted-foreground">No invitations are waiting.</p>
                ) : (
                  invitations!.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
                    >
                      <Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{invitation.email}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {invitation.role.name} · invited by {invitation.invitedBy.name} · expires{' '}
                          {formatDate(invitation.expiresAt)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          await mutations.revokeInvitation.mutateAsync(invitation.id);
                          toast.success('Invitation revoked');
                        }}
                      >
                        Revoke
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
      </Tabs>

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Delete ${removing?.name ?? 'this account'}?`}
        description="Their tasks and comments stay, but the account is removed permanently. Deactivating is usually safer."
        confirmLabel="Delete account"
        destructive
        pending={mutations.remove.isPending}
        onConfirm={async () => {
          if (!removing) return;
          try {
            await mutations.remove.mutateAsync(removing.id);
            toast.success('Account deleted');
            setRemoving(null);
          } catch (caught) {
            toast.error(caught instanceof Error ? caught.message : 'Could not delete that account');
          }
        }}
      />
      <span className="sr-only">
        <Send className="size-0" aria-hidden />
      </span>
    </div>
  );
}
