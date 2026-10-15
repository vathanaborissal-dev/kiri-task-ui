import type {
  HotfixStatus,
  IssueStatus,
  Priority,
  ProjectStatus,
  QaStatus,
  ReleaseStatus,
  RiskLevel,
  Severity,
  StatusCategory,
  TaskType,
} from './types';

type Meta = { label: string; className: string; dot?: string };

export const PRIORITY_META: Record<Priority, Meta> = {
  CRITICAL: {
    label: 'Critical',
    className: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
    dot: 'bg-red-500',
  },
  HIGH: {
    label: 'High',
    className: 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300',
    dot: 'bg-orange-500',
  },
  MEDIUM: {
    label: 'Medium',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  LOW: {
    label: 'Low',
    className: 'border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300',
    dot: 'bg-slate-400',
  },
};

export const SEVERITY_META: Record<Severity, Meta> = {
  BLOCKER: {
    label: 'Blocker',
    className: 'border-red-600/40 bg-red-600/15 text-red-700 dark:text-red-300',
    dot: 'bg-red-600',
  },
  CRITICAL: {
    label: 'Critical',
    className: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
    dot: 'bg-red-500',
  },
  MAJOR: {
    label: 'Major',
    className: 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300',
    dot: 'bg-orange-500',
  },
  MINOR: {
    label: 'Minor',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
};

export const ISSUE_STATUS_META: Record<IssueStatus, Meta> = {
  OPEN: { label: 'Open', className: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300', dot: 'bg-sky-500' },
  ASSIGNED: { label: 'Assigned', className: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
  IN_PROGRESS: { label: 'In Progress', className: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  READY_FOR_TESTING: { label: 'Ready for Testing', className: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300', dot: 'bg-violet-500' },
  RESOLVED: { label: 'Resolved', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  CLOSED: { label: 'Closed', className: 'border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300', dot: 'bg-slate-400' },
  REOPENED: { label: 'Reopened', className: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  WONT_FIX: { label: "Won't Fix", className: 'border-stone-400/30 bg-stone-400/10 text-stone-600 dark:text-stone-300', dot: 'bg-stone-400' },
};

/** Most urgent first — the order these read best in a list or a breakdown. */
export const PRIORITY_ORDER: Priority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

/** Most severe first. */
export const SEVERITY_ORDER: Severity[] = ['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR'];

export const ISSUE_STATUS_ORDER: IssueStatus[] = [
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'READY_FOR_TESTING',
  'RESOLVED',
  'CLOSED',
  'REOPENED',
  'WONT_FIX',
];

export const OPEN_ISSUE_STATUSES: IssueStatus[] = [
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'READY_FOR_TESTING',
  'REOPENED',
];

export const QA_STATUS_META: Record<QaStatus, Meta> = {
  NOT_REQUIRED: { label: 'No testing needed', className: 'border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300' },
  PENDING: { label: 'Awaiting testing', className: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  IN_TESTING: { label: 'In testing', className: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300' },
  PASSED: { label: 'Passed', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  FAILED: { label: 'Failed', className: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300' },
};

export const TASK_TYPE_META: Record<TaskType, { label: string; icon: string; dot: string }> = {
  TASK: { label: 'Task', icon: 'CircleCheck', dot: 'bg-slate-400' },
  FEATURE: { label: 'Feature', icon: 'Lightbulb', dot: 'bg-sky-500' },
  BUG: { label: 'Bug', icon: 'Bug', dot: 'bg-red-500' },
  IMPROVEMENT: { label: 'Improvement', icon: 'TrendingUp', dot: 'bg-emerald-500' },
  CHORE: { label: 'Chore', icon: 'Wrench', dot: 'bg-stone-400' },
  HOTFIX: { label: 'Hotfix', icon: 'Flame', dot: 'bg-rose-500' },
};

export const STATUS_CATEGORY_META: Record<StatusCategory, { label: string }> = {
  TODO: { label: 'To do' },
  IN_PROGRESS: { label: 'In progress' },
  IN_REVIEW: { label: 'In review' },
  BLOCKED: { label: 'Blocked' },
  DONE: { label: 'Done' },
  CANCELED: { label: 'Canceled' },
};

export const PROJECT_STATUS_META: Record<ProjectStatus, Meta> = {
  PLANNING: { label: 'Planning', className: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300' },
  ACTIVE: { label: 'Active', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  ON_HOLD: { label: 'On hold', className: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  COMPLETED: { label: 'Completed', className: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' },
  ARCHIVED: { label: 'Archived', className: 'border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300' },
};

export const RISK_LEVEL_META: Record<RiskLevel, Meta> = {
  ON_TRACK: {
    label: 'On track',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  WATCH: {
    label: 'Watch',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  AT_RISK: {
    label: 'At risk',
    className: 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300',
    dot: 'bg-orange-500',
  },
  CRITICAL: {
    label: 'Critical',
    className: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
    dot: 'bg-red-500',
  },
};

/** Worst first — the order the portfolio page reads in. */
export const RISK_LEVEL_ORDER: RiskLevel[] = ['CRITICAL', 'AT_RISK', 'WATCH', 'ON_TRACK'];

export const RELEASE_STATUS_META: Record<ReleaseStatus, Meta> = {
  PLANNED: { label: 'Planned', className: 'border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300' },
  IN_DEVELOPMENT: { label: 'In development', className: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300' },
  READY: { label: 'Ready', className: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300' },
  RELEASED: { label: 'Released', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  CANCELED: { label: 'Canceled', className: 'border-stone-400/30 bg-stone-400/10 text-stone-600 dark:text-stone-300' },
};

export const HOTFIX_STATUS_META: Record<HotfixStatus, Meta> = {
  REQUESTED: { label: 'Requested', className: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  APPROVED: { label: 'Approved', className: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300' },
  IN_PROGRESS: { label: 'In progress', className: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300' },
  IN_TESTING: { label: 'In testing', className: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300' },
  READY: { label: 'Ready to deploy', className: 'border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300' },
  DEPLOYED: { label: 'Deployed', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  VERIFIED: { label: 'Verified', className: 'border-emerald-600/40 bg-emerald-600/15 text-emerald-700 dark:text-emerald-300' },
  REJECTED: { label: 'Rejected', className: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300' },
};

export const HOTFIX_STATUS_ORDER: HotfixStatus[] = [
  'REQUESTED',
  'APPROVED',
  'IN_PROGRESS',
  'IN_TESTING',
  'READY',
  'DEPLOYED',
  'VERIFIED',
  'REJECTED',
];

export const LINK_TYPE_LABEL: Record<string, string> = {
  BLOCKS: 'blocks',
  BLOCKED_BY: 'is blocked by',
  RELATES_TO: 'relates to',
  DUPLICATES: 'duplicates',
  DUPLICATED_BY: 'is duplicated by',
  FIXES: 'fixes',
  FIXED_BY: 'is fixed by',
};

export const STATUS_CATEGORY_RING: Record<StatusCategory, string> = {
  TODO: 'text-slate-400',
  IN_PROGRESS: 'text-blue-500',
  IN_REVIEW: 'text-violet-500',
  BLOCKED: 'text-red-500',
  DONE: 'text-emerald-500',
  CANCELED: 'text-stone-400',
};
