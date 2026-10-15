import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  isThisYear,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
} from 'date-fns';

const toDate = (value: string | Date | null | undefined): Date | null => {
  if (!value) return null;
  const date = typeof value === 'string' ? parseISO(value) : value;
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDate = (value: string | Date | null | undefined): string => {
  const date = toDate(value);
  if (!date) return '—';
  return format(date, isThisYear(date) ? 'd MMM' : 'd MMM yyyy');
};

export const formatLongDate = (value: string | Date | null | undefined): string => {
  const date = toDate(value);
  return date ? format(date, 'd MMMM yyyy') : '—';
};

export const formatDateTime = (value: string | Date | null | undefined): string => {
  const date = toDate(value);
  return date ? format(date, "d MMM yyyy 'at' HH:mm") : '—';
};

export const formatTimeAgo = (value: string | Date | null | undefined): string => {
  const date = toDate(value);
  if (!date) return '—';
  return `${formatDistanceToNowStrict(date, { addSuffix: true })}`;
};

/** Human deadline wording: "Today", "in 3 days", "4 days overdue". */
export const formatDueDate = (
  value: string | Date | null | undefined,
): { label: string; tone: 'overdue' | 'today' | 'soon' | 'later' | 'none' } => {
  const date = toDate(value);
  if (!date) return { label: 'No deadline', tone: 'none' };

  const days = differenceInCalendarDays(date, new Date());
  if (days < 0) {
    return {
      label: `${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} overdue`,
      tone: 'overdue',
    };
  }
  if (isToday(date)) return { label: 'Due today', tone: 'today' };
  if (isTomorrow(date)) return { label: 'Due tomorrow', tone: 'soon' };
  if (days <= 7) return { label: `Due in ${days} days`, tone: 'soon' };
  return { label: `Due ${formatDate(date)}`, tone: 'later' };
};

export const formatShortDueDate = (value: string | Date | null | undefined): string => {
  const date = toDate(value);
  if (!date) return '';
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  return formatDate(date);
};

export const isOverdue = (value: string | Date | null | undefined): boolean => {
  const date = toDate(value);
  return date ? date.getTime() < Date.now() : false;
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export const initials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

export const titleCase = (value: string): string =>
  value
    .toLowerCase()
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export const pluralize = (count: number, singular: string, plural?: string): string =>
  `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;

export const toInputDate = (value: string | Date | null | undefined): string => {
  const date = toDate(value);
  return date ? format(date, 'yyyy-MM-dd') : '';
};

/** Deterministic colour for an avatar without an image. */
export const avatarTone = (seed: string): string => {
  const tones = [
    'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
    'bg-teal-500/15 text-teal-700 dark:text-teal-300',
    'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    'bg-violet-500/15 text-violet-700 dark:text-violet-300',
    'bg-sky-500/15 text-sky-700 dark:text-sky-300',
    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 9973;
  return tones[hash % tones.length]!;
};
