'use client';

import { FileText, ImageIcon, Paperclip, X } from 'lucide-react';
import { useRef } from 'react';
import { IconButton } from '@/components/common/icon-button';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/format';

/**
 * Collects files before the entity exists. The parent uploads them once it has
 * an id (issues and tasks are created first, then the files are attached).
 */
export function AttachmentPicker({
  files,
  onChange,
  disabled,
  label = 'Attach screenshots or files',
  accept = 'image/*,.pdf,.txt,.csv,.zip,.doc,.docx,.xls,.xlsx,.mp4,.mov',
}: {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  label?: string;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = [...files];
    for (const file of Array.from(incoming)) {
      if (!next.some((f) => f.name === file.name && f.size === file.size)) next.push(file);
    }
    onChange(next.slice(0, 10));
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = '';
        }}
      />

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (!disabled) addFiles(event.dataTransfer.files);
        }}
        className="rounded-lg border border-dashed px-3 py-4 text-center"
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <Paperclip className="size-3.5" aria-hidden />
          {label}
        </Button>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Drag files here, or paste a screenshot. Up to 10 files, 15&nbsp;MB each.
        </p>
      </div>

      {files.length > 0 ? (
        <ul className="space-y-1">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1.5 text-xs"
            >
              {file.type.startsWith('image/') ? (
                <ImageIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              ) : (
                <FileText className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="shrink-0 text-muted-foreground">{formatBytes(file.size)}</span>
              <IconButton
                type="button"
                variant="ghost"
                className="size-5"
                disabled={disabled}
                onClick={() => onChange(files.filter((_, i) => i !== index))}
                label={`Remove ${file.name}`}
              >
                <X className="size-3" aria-hidden />
              </IconButton>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
