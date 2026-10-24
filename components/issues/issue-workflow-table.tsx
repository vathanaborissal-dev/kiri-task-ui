'use client';

import { ArrowRight, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ISSUE_STATUS_META } from '@/lib/constants';
import { useIssueWorkflow } from '@/lib/hooks/use-issues';
import { useRoles } from '@/lib/hooks/use-workspace';
import type { IssueStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

/** The permissions a transition can require, and how to describe each one. */
const GATES = {
  'issue:assign': { label: 'Assign', description: 'Hand an issue to somebody' },
  'issue:close': { label: 'Close', description: "Close an issue or mark it won't fix" },
  'issue:reopen': { label: 'Reopen', description: 'Put a settled issue back into the workflow' },
} as const;

type Gate = keyof typeof GATES;

/**
 * The issue workflow, written out: which status can follow which, and which
 * roles may make each move.
 *
 * This exists because the rules are only discoverable by hitting them. Somebody
 * who cannot close an issue found out when the button failed, and nobody could
 * answer "who can assign this?" without reading the permission matrix and
 * knowing which permission the status screen checks. The table is generated
 * from the same data the API enforces, so it cannot go out of date.
 */
export function IssueWorkflowTable() {
  const { data: workflow, isLoading } = useIssueWorkflow();
  const { data: roles } = useRoles();

  // Which roles hold each gate. Read from the live roles, not hard-coded, so a
  // renamed or custom role shows up here the moment it is granted.
  const holders = (gate: Gate) =>
    (roles ?? [])
      .filter((role) => role.permissions.includes('*') || role.permissions.includes(gate))
      .map((role) => role.name);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Issue workflow</CardTitle>
        <CardDescription className="text-xs">
          Where an issue can go from each status, and what the move needs. A resolved, closed or
          dismissed issue has to be reopened before it can move again — it cannot go straight back
          down.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* --- Who holds each gate ------------------------------------- */}
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(GATES) as Gate[]).map((gate) => {
            const names = holders(gate);
            return (
              <div key={gate} className="space-y-1 rounded-lg border bg-muted/20 p-2.5">
                <p className="flex items-center gap-1.5 text-xs font-medium">
                  <Lock className="size-3 text-muted-foreground" aria-hidden />
                  {GATES[gate].label}
                </p>
                <p className="text-[11px] text-muted-foreground">{GATES[gate].description}</p>
                <p className="text-[11px]">
                  {names.length === 0 ? (
                    <span className="text-muted-foreground">No role holds this yet</span>
                  ) : (
                    names.join(', ')
                  )}
                </p>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-muted-foreground">
          Every move below also needs <span className="font-medium">Change issue status</span>. The
          moves with no badge need only that, so anyone who can change status may make them.
        </p>

        {/* --- The table ----------------------------------------------- */}
        {isLoading || !workflow ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
        ) : (
          <ul className="space-y-1.5">
            {workflow.map((row) => (
              <li
                key={row.from}
                className={cn(
                  'flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-lg border px-2.5 py-2',
                  row.settled && 'bg-muted/30',
                )}
              >
                <StatusChip status={row.from} />
                {row.settled ? (
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    settled
                  </span>
                ) : null}
                <ArrowRight className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                <span className="flex flex-wrap items-center gap-1.5">
                  {row.to.map((target) => (
                    <span key={target.status} className="inline-flex items-center gap-1">
                      <StatusChip status={target.status} />
                      {target.requires ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className="cursor-help rounded px-1 text-[9px] uppercase"
                            >
                              {GATES[target.requires as Gate]?.label ?? target.requires}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-60 text-xs">
                            {target.note ?? GATES[target.requires as Gate]?.description}
                            {holders(target.requires as Gate).length > 0 ? (
                              <> — {holders(target.requires as Gate).join(', ')}</>
                            ) : null}
                          </TooltipContent>
                        </Tooltip>
                      ) : null}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function StatusChip({ status }: { status: IssueStatus }) {
  const meta = ISSUE_STATUS_META[status];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px]',
        meta.className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', meta.dot)} aria-hidden />
      {meta.label}
    </span>
  );
}
