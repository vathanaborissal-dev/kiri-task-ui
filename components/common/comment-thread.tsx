'use client';

import { AtSign, MoreHorizontal, Paperclip, Send } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { AttachmentPicker } from '@/components/common/attachment-picker';
import { ImageLightbox } from '@/components/common/image-lightbox';
import { Spinner } from '@/components/common/loading';
import { RichText } from '@/components/common/rich-text';
import { UserAvatar } from '@/components/common/user-avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { formatTimeAgo } from '@/lib/format';
import {
  useCommentMutations,
  useComments,
  useMentionables,
  useUploadAttachments,
  type CommentTarget,
} from '@/lib/hooks/use-collab';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';
import { MultiSelect } from '@/components/common/multi-select';

export function CommentThread({
  target,
  projectId,
  canComment,
  canModerate,
}: {
  target: CommentTarget;
  projectId: string;
  canComment: boolean;
  canModerate: boolean;
}) {
  const { user } = useAuth();
  const { data, isLoading } = useComments(target);
  const { data: mentionables } = useMentionables(projectId);
  const { create, update, remove } = useCommentMutations(target);
  const uploadAttachments = useUploadAttachments();

  const [body, setBody] = useState('');
  const [mentions, setMentions] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [showAttach, setShowAttach] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const comments = data?.data ?? [];
  const pending = create.isPending || uploadAttachments.isPending;

  // Every image in the thread, so the viewer can step through a conversation's
  // screenshots rather than only the one that was clicked.
  const threadImages = comments.flatMap((comment) =>
    (comment.attachments ?? []).filter((attachment) => attachment.mimeType.startsWith('image/')),
  );

  const submit = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    try {
      let attachmentIds: string[] = [];
      if (files.length > 0) {
        const uploaded = await uploadAttachments.mutateAsync({ files, target: {} });
        attachmentIds = uploaded.map((a) => a.id);
      }
      await create.mutateAsync({
        body: trimmed,
        ...(mentions.length ? { mentionUserIds: mentions } : {}),
        ...(attachmentIds.length ? { attachmentIds } : {}),
      });
      setBody('');
      setMentions([]);
      setFiles([]);
      setShowAttach(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not post that comment');
    }
  };

  const insertMention = (name: string, id: string) => {
    setBody((current) => `${current}${current && !current.endsWith(' ') ? ' ' : ''}@${name} `);
    setMentions((current) => (current.includes(id) ? current : [...current, id]));
    textareaRef.current?.focus();
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ol className="space-y-4">
          {comments.map((comment) => {
            const mine = comment.author.id === user?.id;
            const editable = mine || canModerate;
            return (
              <li key={comment.id} className="flex gap-2.5">
                <UserAvatar user={comment.author} size="md" showTooltip={false} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{comment.author.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(comment.createdAt)}
                      {comment.editedAt ? ' · edited' : ''}
                    </span>
                    {editable ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto size-6 text-muted-foreground"
                            aria-label={`Actions for ${comment.author.name}'s comment`}
                          >
                            <MoreHorizontal className="size-3.5" aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {mine ? (
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingId(comment.id);
                                setEditBody(comment.body);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => void remove.mutateAsync(comment.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>

                  {editingId === comment.id ? (
                    <div className="mt-1.5 space-y-2">
                      <Textarea
                        value={editBody}
                        onChange={(event) => setEditBody(event.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={async () => {
                            await update.mutateAsync({ commentId: comment.id, body: editBody });
                            setEditingId(null);
                          }}
                          disabled={update.isPending}
                        >
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-0.5 space-y-2">
                      <RichText>{comment.body}</RichText>
                      {comment.attachments.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {comment.attachments.map((attachment) =>
                            attachment.mimeType.startsWith('image/') ? (
                              // The viewer, not a new tab: a raw image URL has
                              // no zoom, no filename and no way back.
                              <button
                                key={attachment.id}
                                type="button"
                                onClick={() => setPreviewId(attachment.id)}
                                className="block cursor-zoom-in overflow-hidden rounded-md border transition-opacity hover:opacity-85"
                                aria-label={`Open ${attachment.filename} in the viewer`}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={attachment.url}
                                  alt={attachment.filename}
                                  loading="lazy"
                                  className="h-24 w-auto object-cover"
                                />
                              </button>
                            ) : (
                              <a
                                key={attachment.id}
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-md border bg-muted/30 px-2 py-1 text-xs hover:bg-accent"
                              >
                                <Paperclip className="size-3" aria-hidden />
                                {attachment.filename}
                              </a>
                            ),
                          )}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {canComment ? (
        <div className="space-y-2 rounded-lg border bg-card p-3">
          <div className="flex gap-2.5">
            <UserAvatar user={user} size="md" showTooltip={false} />
            <Textarea
              ref={textareaRef}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') void submit();
              }}
              rows={3}
              placeholder="Write a comment… ⌘↵ to send"
              className="min-h-20 resize-y"
            />
          </div>

          {showAttach ? (
            <AttachmentPicker files={files} onChange={setFiles} disabled={pending} label="Attach a file" />
          ) : null}

          {mentions.length > 0 ? (
            <div className="pl-11">
              <MultiSelect
                options={(mentionables ?? []).map((person) => ({
                  value: person.id,
                  label: person.name,
                  description: person.roleName,
                }))}
                selected={mentions}
                onChange={setMentions}
                placeholder="Nobody mentioned"
                className="h-auto"
              />
            </div>
          ) : null}

          <div className="flex items-center gap-1 pl-11">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                  <AtSign className="size-3.5" aria-hidden />
                  Mention
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
                {(mentionables ?? []).map((person) => (
                  <DropdownMenuItem
                    key={person.id}
                    onClick={() => insertMention(person.name, person.id)}
                  >
                    <UserAvatar user={person} size="xs" showTooltip={false} />
                    <span className="flex-1">{person.name}</span>
                    <span className="text-xs text-muted-foreground">{person.roleName}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              className={cn('gap-1.5 text-muted-foreground', showAttach && 'text-foreground')}
              onClick={() => setShowAttach((value) => !value)}
            >
              <Paperclip className="size-3.5" aria-hidden />
              Attach
            </Button>

            <Button
              size="sm"
              className="ml-auto gap-1.5"
              onClick={() => void submit()}
              disabled={pending || body.trim().length === 0}
            >
              {pending ? <Spinner /> : <Send className="size-3.5" aria-hidden />}
              Comment
            </Button>
          </div>
        </div>
      ) : null}

      <ImageLightbox images={threadImages} openId={previewId} onOpenChange={setPreviewId} />
    </div>
  );
}
