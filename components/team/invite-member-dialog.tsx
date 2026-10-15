'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Spinner } from '@/components/common/loading';
import { IconButton } from '@/components/common/icon-button';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApiError } from '@/lib/api';
import { useProjects } from '@/lib/hooks/use-projects';
import { useRoles, useUserMutations } from '@/lib/hooks/use-workspace';
import { useAuth } from '@/providers/auth-provider';

export function InviteMemberDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { projectsWith } = useAuth();
  const { data: globalRoles } = useRoles('GLOBAL', open);
  const { data: projectRoles } = useRoles('PROJECT', open);
  const { data: projects } = useProjects({ pageSize: 100 });
  const { invite } = useUserMutations();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [grants, setGrants] = useState<{ projectId: string; roleId: string }[]>([]);
  const [acceptUrl, setAcceptUrl] = useState<string | null>(null);
  const [emailed, setEmailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const manageable = projectsWith('project:manage_members');

  const reset = () => {
    setEmail('');
    setName('');
    setGrants([]);
    setAcceptUrl(null);
    setEmailed(false);
    setCopied(false);
    setErrors({});
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});
    try {
      const result = await invite.mutateAsync({
        email,
        ...(name ? { name } : {}),
        roleId: roleId || globalRoles?.find((role) => role.isDefault)?.id || globalRoles![0]!.id,
        ...(grants.length ? { projectGrants: grants } : {}),
      });
      setAcceptUrl(result.acceptUrl);
      setEmailed(result.emailed);
      if (result.emailed) toast.success(`Invitation sent to ${email}`);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setErrors(
          Object.keys(caught.fieldErrors).length ? caught.fieldErrors : { email: caught.message },
        );
      }
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite someone</DialogTitle>
          <DialogDescription>
            They choose their own password when they accept. You can give them project access right
            away.
          </DialogDescription>
        </DialogHeader>

        {acceptUrl ? (
          <div className="space-y-4">
            <p className="text-sm">
              {emailed
                ? `An invitation email is on its way to ${email}.`
                : 'Email is not configured on this server, so share this link with them directly:'}
            </p>
            <div className="flex gap-2">
              <Input readOnly value={acceptUrl} className="font-mono text-xs" />
              <IconButton
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(acceptUrl);
                  setCopied(true);
                  toast.success('Link copied');
                }}
                label="Copy the invitation link"
              >
                {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              </IconButton>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={reset}>
                Invite someone else
              </Button>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="invite-email">Email</FieldLabel>
              <Input
                id="invite-email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teammate@company.com"
              />
              {errors.email ? <FieldError>{errors.email}</FieldError> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="invite-name">Name (optional)</FieldLabel>
              <Input
                id="invite-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Jane Doe"
              />
            </Field>

            <Field>
              <FieldLabel>Workspace role</FieldLabel>
              <Select
                value={roleId || globalRoles?.find((role) => role.isDefault)?.id || ''}
                onValueChange={setRoleId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  {(globalRoles ?? []).map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                This controls workspace-wide abilities. Project access is separate.
              </FieldDescription>
            </Field>

            {manageable.length > 0 ? (
              <Field>
                <FieldLabel>Add to projects</FieldLabel>
                <div className="space-y-2">
                  {grants.map((grant, index) => (
                    <div key={index} className="flex gap-2">
                      <Select
                        value={grant.projectId}
                        onValueChange={(projectId) =>
                          setGrants(
                            grants.map((g, i) => (i === index ? { ...g, projectId } : g)),
                          )
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Project" />
                        </SelectTrigger>
                        <SelectContent>
                          {(projects?.data ?? [])
                            .filter((project) => manageable.some((m) => m.id === project.id))
                            .map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={grant.roleId}
                        onValueChange={(value) =>
                          setGrants(
                            grants.map((g, i) => (i === index ? { ...g, roleId: value } : g)),
                          )
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          {(projectRoles ?? []).map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setGrants(grants.filter((_, i) => i !== index))}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setGrants([
                        ...grants,
                        {
                          projectId: manageable[0]?.id ?? '',
                          roleId:
                            projectRoles?.find((role) => role.isDefault)?.id ??
                            projectRoles?.[0]?.id ??
                            '',
                        },
                      ])
                    }
                  >
                    Add project access
                  </Button>
                </div>
              </Field>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="gap-2" disabled={invite.isPending}>
                {invite.isPending ? <Spinner /> : null}
                Send invitation
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
