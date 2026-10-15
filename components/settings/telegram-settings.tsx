'use client';

import { Check, Copy, ExternalLink, RefreshCw, Send, Unlink } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { CenteredSpinner, Spinner } from '@/components/common/loading';
import { Badge } from '@/components/ui/badge';
import { IconButton } from '@/components/common/icon-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/lib/format';
import { useTelegramMutations, useTelegramStatus } from '@/lib/hooks/use-workspace';

const COMMANDS = [
  ['/mytasks', 'Your open tasks'],
  ['/today', "Today's work and deadlines"],
  ['/overdue', 'Anything past its deadline'],
  ['/issues', 'Issues assigned to or reported by you'],
  ['/projects', 'Projects you can access'],
  ['/report', 'Report an issue, with a screenshot'],
  ['/me', 'Your account and workload'],
  ['/help', 'Show every command'],
];

export function TelegramSettings() {
  const { data: status, isLoading, refetch } = useTelegramStatus();
  const { createCode, unlink, sendTest } = useTelegramMutations();
  const [code, setCode] = useState<{ code: string; deepLink: string | null; expiresInMinutes: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [unlinkOpen, setUnlinkOpen] = useState(false);

  if (isLoading || !status) return <CenteredSpinner label="Checking Telegram…" />;

  return (
    <div className="space-y-5">
      <Card data-tour="telegram-alerts">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="size-4 text-muted-foreground" aria-hidden />
            Telegram
            {status.linked ? (
              <Badge
                variant="outline"
                className="rounded-full border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-700 dark:text-emerald-300"
              >
                Connected
              </Badge>
            ) : null}
          </CardTitle>
          <CardDescription>
            Get a Telegram message when someone assigns work to you, comments on your work, or
            mentions you. Each message has a button that opens the right task or issue.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {!status.botConfigured ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
              The Telegram bot is not configured on this server. Ask an administrator to set
              TELEGRAM_BOT_TOKEN.
            </p>
          ) : status.linked ? (
            <>
              <div className="rounded-lg border p-3 text-sm">
                <p>
                  Connected{status.username ? ` as @${status.username}` : ''}
                  {status.linkedAt ? ` on ${formatDateTime(status.linkedAt)}` : ''}.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="gap-1.5"
                  disabled={sendTest.isPending}
                  onClick={async () => {
                    try {
                      await sendTest.mutateAsync();
                      toast.success('Test message sent. Check Telegram');
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : 'Could not send it');
                    }
                  }}
                >
                  {sendTest.isPending ? <Spinner /> : <Send className="size-4" aria-hidden />}
                  Send a test message
                </Button>
                <Button
                  variant="outline"
                  className="gap-1.5 text-destructive"
                  onClick={() => setUnlinkOpen(true)}
                >
                  <Unlink className="size-4" aria-hidden />
                  Disconnect
                </Button>
              </div>
            </>
          ) : code ? (
            <div className="space-y-3">
              <p className="text-sm">
                Open the bot and send this code. It expires in {code.expiresInMinutes} minutes.
              </p>
              <div className="flex gap-2">
                <Input readOnly value={code.code} className="font-mono text-lg tracking-widest" />
                <IconButton
                  variant="outline"
                  onClick={async () => {
                    await navigator.clipboard.writeText(code.code);
                    setCopied(true);
                    toast.success('Code copied');
                  }}
                  label="Copy the connection code"
                >
                  {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                </IconButton>
              </div>
              <div className="flex flex-wrap gap-2">
                {code.deepLink ? (
                  <Button asChild className="gap-1.5">
                    <a href={code.deepLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-4" aria-hidden />
                      Open the bot and connect
                    </a>
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={async () => {
                    await refetch();
                    toast.info('Checked. Reload if it still shows as not connected.');
                  }}
                >
                  <RefreshCw className="size-4" aria-hidden />
                  I have connected
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                If the button does not open Telegram, message{' '}
                <span className="font-mono">@{status.botUsername}</span> and send{' '}
                <span className="font-mono">/start {code.code}</span>.
              </p>
            </div>
          ) : (
            <Button
              className="gap-1.5"
              disabled={createCode.isPending}
              onClick={async () => {
                const result = await createCode.mutateAsync();
                setCode(result);
              }}
            >
              {createCode.isPending ? <Spinner /> : <Send className="size-4" aria-hidden />}
              Connect my Telegram account
            </Button>
          )}
        </CardContent>
      </Card>

      <Card data-tour="telegram-commands">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">What you can do in the bot</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            {COMMANDS.map(([command, description]) => (
              <div key={command} className="flex flex-wrap items-baseline gap-2 text-sm">
                <dt className="w-24 shrink-0 font-mono text-xs text-muted-foreground">{command}</dt>
                <dd className="min-w-0 flex-1">{description}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-muted-foreground">
            A message can also have quick buttons to start work, mark it done, reply to a comment,
            or approve an urgent fix. Changes appear here immediately.
          </p>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={unlinkOpen}
        onOpenChange={setUnlinkOpen}
        title="Disconnect Telegram?"
        description="You will stop receiving Telegram notifications and the bot will no longer recognise you."
        confirmLabel="Disconnect"
        destructive
        pending={unlink.isPending}
        onConfirm={async () => {
          await unlink.mutateAsync();
          setCode(null);
          setUnlinkOpen(false);
          toast.success('Telegram disconnected');
        }}
      />
    </div>
  );
}
