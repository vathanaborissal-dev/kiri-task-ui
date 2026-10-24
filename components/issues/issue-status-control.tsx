'use client';

import { Info, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ISSUE_STATUS_META, ISSUE_STATUS_ORDER } from '@/lib/constants';
import type { IssueStatus, IssueTransitions } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * The status buttons and the status dropdown on an issue.
 *
 * Both read the server's own transition table, so the screen can only offer a
 * move the API would accept. The alternative — list all eight statuses and let
 * people find out — is what made "cannot change back down" feel like a bug
 * rather than a rule: a closed issue showed an In Progress button that always
 * failed. Here the illegal ones are either absent (buttons) or disabled with
 * the reason attached (dropdown), so the rule teaches itself.
 */
export function IssueStatusButtons({
  transitions,
  pending,
  onMove,
}: {
  transitions: IssueTransitions | undefined;
  pending?: boolean;
  onMove: (status: IssueStatus) => void;
}) {
  if (!transitions) return null;

  const { allowed, blocked } = transitions;

  // Nothing offered at all: either a settled issue the viewer cannot reopen, or
  // no status permission. Say which, instead of showing an empty row.
  if (allowed.length === 0) {
    const reason = blocked.find((entry) => entry.reason)?.reason;
    return reason ? (
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <Lock className="mt-0.5 size-3 shrink-0" aria-hidden />
        {reason}
      </p>
    ) : null;
  }

  // The reopen is the way back into a settled issue, so it leads rather than
  // sitting last in enum order.
  const ordered = [...allowed].sort((a, b) => {
    if (a === 'REOPENED') return -1;
    if (b === 'REOPENED') return 1;
    return ISSUE_STATUS_ORDER.indexOf(a) - ISSUE_STATUS_ORDER.indexOf(b);
  });

  const needsReopenFirst = blocked.filter((entry) => entry.reason?.includes('reopened first'));

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {ordered.map((status) => (
          <Button
            key={status}
            variant={status === 'REOPENED' ? 'secondary' : 'outline'}
            size="sm"
            className="h-7 gap-1.5 text-xs"
            disabled={pending}
            onClick={() => onMove(status)}
          >
            <span
              className={cn('size-1.5 rounded-full', ISSUE_STATUS_META[status].dot)}
              aria-hidden
            />
            {ISSUE_STATUS_META[status].label}
          </Button>
        ))}
      </div>

      {needsReopenFirst.length > 0 ? (
        <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <Info className="mt-0.5 size-3 shrink-0" aria-hidden />
          Reopen this issue to put it back into the workflow — it cannot go straight back to{' '}
          {needsReopenFirst
            .slice(0, 3)
            .map((entry) => ISSUE_STATUS_META[entry.status].label)
            .join(', ')}
          .
        </p>
      ) : null}
    </div>
  );
}

/** The property-rail dropdown. Illegal moves stay visible but disabled. */
export function IssueStatusSelect({
  status,
  transitions,
  disabled,
  onMove,
}: {
  status: IssueStatus;
  transitions: IssueTransitions | undefined;
  disabled?: boolean;
  onMove: (status: IssueStatus) => void;
}) {
  const allowed = new Set(transitions?.allowed ?? []);
  const reasons = new Map((transitions?.blocked ?? []).map((entry) => [entry.status, entry.reason]));

  return (
    <Select
      value={status}
      onValueChange={(next) => next !== status && onMove(next as IssueStatus)}
      disabled={disabled || !transitions}
    >
      <SelectTrigger className="w-full" aria-label="Status">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ISSUE_STATUS_ORDER.map((option) => {
          const current = option === status;
          const blockedReason = reasons.get(option);
          return (
            <SelectItem
              key={option}
              value={option}
              // The current status is always selectable so the trigger can show
              // it; everything else has to be a move the API would take.
              disabled={!current && !allowed.has(option)}
              {...(blockedReason ? { title: blockedReason } : {})}
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn('size-2 rounded-full', ISSUE_STATUS_META[option].dot)}
                  aria-hidden
                />
                {ISSUE_STATUS_META[option].label}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

/**
 * A one-line explainer with the full table behind it, so somebody who cannot
 * make a move can see who can.
 */
export function IssueWorkflowHint() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <Info className="size-3" aria-hidden />
          Who can change this?
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-72 text-xs">
        Anyone who can change status may start work or send it for testing. Assigning, closing and
        reopening are reserved for project managers, team leads and issue managers. A resolved,
        closed or dismissed issue has to be reopened before it can move again.
      </TooltipContent>
    </Tooltip>
  );
}
