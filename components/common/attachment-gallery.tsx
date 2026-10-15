'use client';

import { Download, FileText, Trash2 } from 'lucide-react';
import { IconButton } from '@/components/common/icon-button';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { formatBytes, formatTimeAgo } from '@/lib/format';
import type { Attachment } from '@/lib/types';

export function AttachmentGallery({
  attachments,
  onDelete,
  canDelete,
}: {
  attachments: Attachment[];
  onDelete?: (id: string) => void;
  canDelete?: (attachment: Attachment) => boolean;
}) {
  const [preview, setPreview] = useState<Attachment | null>(null);
  if (attachments.length === 0) return null;

  const images = attachments.filter((a) => a.mimeType.startsWith('image/'));
  const files = attachments.filter((a) => !a.mimeType.startsWith('image/'));

  return (
    <div className="space-y-3">
      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((attachment) => (
            <figure key={attachment.id} className="group relative overflow-hidden rounded-lg border">
              <button
                type="button"
                onClick={() => setPreview(attachment)}
                className="block w-full"
                aria-label={`Open ${attachment.filename}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={attachment.url}
                  alt={attachment.filename}
                  loading="lazy"
                  className="aspect-video w-full bg-muted object-cover transition-transform group-hover:scale-[1.02]"
                />
              </button>
              <figcaption className="flex items-center gap-1 border-t bg-card px-2 py-1 text-[11px] text-muted-foreground">
                <span className="min-w-0 flex-1 truncate">{attachment.filename}</span>
                {onDelete && canDelete?.(attachment) ? (
                  <IconButton
                    variant="ghost"
                    className="size-5 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(attachment.id)}
                    label={`Delete ${attachment.filename}`}
                  >
                    <Trash2 className="size-3" aria-hidden />
                  </IconButton>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}

      {files.length > 0 ? (
        <ul className="space-y-1.5">
          {files.map((attachment) => (
            <li
              key={attachment.id}
              className="flex items-center gap-2 rounded-md border bg-muted/20 px-2.5 py-2 text-sm"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{attachment.filename}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatBytes(attachment.bytes)} · {formatTimeAgo(attachment.createdAt)}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon" className="size-7">
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Download ${attachment.filename}`}
                    >
                      <Download className="size-3.5" aria-hidden />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download</TooltipContent>
              </Tooltip>
              {onDelete && canDelete?.(attachment) ? (
                <IconButton
                  variant="ghost"
                  className="size-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(attachment.id)}
                  label={`Delete ${attachment.filename}`}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </IconButton>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="truncate text-sm font-normal">{preview?.filename}</DialogTitle>
          </DialogHeader>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview.url}
              alt={preview.filename}
              className="max-h-[75dvh] w-full rounded-lg object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
