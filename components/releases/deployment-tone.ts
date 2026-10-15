import type { DeploymentStatus } from '@/lib/types';

export const DEPLOYMENT_TONE: Record<DeploymentStatus, string> = {
  SUCCEEDED: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  IN_PROGRESS: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  PENDING: 'border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300',
  FAILED: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
  ROLLED_BACK: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
};
