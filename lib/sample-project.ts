/**
 * A stand-in project for the guided tour.
 *
 * Somebody who has not been added to a project yet has nothing for the project
 * half of the tour to point at. Rather than describe those pages in the
 * abstract, the tour opens this one: the real screens, rendered from fixtures
 * instead of the API, so Board, Tasks, Issues, Phases, Releases and Hotfixes
 * all show plausible work.
 *
 * It is read-only by construction. `myPermissions` grants only the `view`
 * keys, and every view already derives its buttons and drag handles from that
 * list — so nothing here can be edited, dragged or submitted, and no mutation
 * is ever fired at an id the API does not have.
 */
import type {
  BoardColumn,
  Grouped,
  Hotfix,
  Issue,
  Paged,
  PhaseBoard,
  ProjectDetail,
  ProjectReport,
  ProjectMember,
  Release,
  Task,
  TaskStatusRef,
  UserSummary,
} from './types';

export const SAMPLE_PROJECT_KEY = 'SAMPLE';
export const SAMPLE_PROJECT_ID = 'sample-project';

export const isSampleProject = (idOrKey: string | undefined | null): boolean =>
  idOrKey === SAMPLE_PROJECT_ID || idOrKey?.toUpperCase() === SAMPLE_PROJECT_KEY;

/** Dates are relative so the sample never looks abandoned. */
const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString();
};

const user = (id: string, name: string, jobTitle: string): UserSummary => ({
  id,
  name,
  email: `${id}@example.test`,
  avatarUrl: null,
  jobTitle,
  isActive: true,
});

const MAYA = user('sample-maya', 'Maya Chen', 'Product Manager');
const ARUN = user('sample-arun', 'Arun Patel', 'Senior Engineer');
const LENA = user('sample-lena', 'Lena Fischer', 'QA Engineer');

const projectRef = {
  id: SAMPLE_PROJECT_ID,
  key: SAMPLE_PROJECT_KEY,
  name: 'Example project',
  color: '#6366f1',
};

const status = (
  key: string,
  name: string,
  category: TaskStatusRef['category'],
  color: string,
  order: number,
): TaskStatusRef => ({ id: `sample-status-${key}`, key, name, category, color, order });

const STATUSES: TaskStatusRef[] = [
  status('backlog', 'Backlog', 'TODO', '#64748b', 0),
  status('todo', 'To do', 'TODO', '#0ea5e9', 1),
  status('in-progress', 'In progress', 'IN_PROGRESS', '#6366f1', 2),
  status('in-review', 'In review', 'IN_REVIEW', '#a855f7', 3),
  status('blocked', 'Blocked', 'BLOCKED', '#ef4444', 4),
  status('done', 'Done', 'DONE', '#22c55e', 5),
];

const byKey = (key: string) => STATUSES.find((s) => s.key === key)!;

const PHASES = [
  { id: 'sample-phase-dev', key: 'development', name: 'Development', color: '#3b82f6', order: 0, isProduction: false },
  { id: 'sample-phase-uat', key: 'uat', name: 'UAT', color: '#f59e0b', order: 1, isProduction: false },
  { id: 'sample-phase-pilot', key: 'pilot', name: 'Pilot', color: '#8b5cf6', order: 2, isProduction: false },
  { id: 'sample-phase-prod', key: 'production', name: 'Production', color: '#22c55e', order: 3, isProduction: true },
];

const LABELS = [
  { id: 'sample-label-api', name: 'api', color: '#6366f1' },
  { id: 'sample-label-ui', name: 'ui', color: '#0ea5e9' },
  { id: 'sample-label-billing', name: 'billing', color: '#f59e0b' },
];

const task = (
  n: number,
  title: string,
  statusKey: string,
  over: Partial<Task> = {},
): Task => ({
  id: `sample-task-${n}`,
  key: `${SAMPLE_PROJECT_KEY}-${n}`,
  title,
  description: null,
  type: 'TASK',
  priority: 'MEDIUM',
  qaStatus: 'NOT_REQUIRED',
  startDate: null,
  dueDate: null,
  completedAt: null,
  estimateHours: null,
  spentHours: null,
  progress: byKey(statusKey).category === 'DONE' ? 100 : 0,
  issue: null,
  position: n,
  createdAt: day(-14),
  updatedAt: day(-1),
  parentTaskId: null,
  project: projectRef,
  status: byKey(statusKey),
  phase: PHASES[0]!,
  milestone: null,
  release: null,
  reporter: MAYA,
  assignees: [],
  labels: [],
  counts: { subtasks: 0, comments: 0, attachments: 0, checklist: 0 },
  ...over,
});

const TASKS: Task[] = [
  task(1, 'Let customers export invoices as PDF', 'backlog', {
    type: 'FEATURE',
    priority: 'HIGH',
    labels: [LABELS[2]!],
    counts: { subtasks: 3, comments: 2, attachments: 0, checklist: 4 },
  }),
  task(2, 'Rate-limit the public search endpoint', 'backlog', {
    type: 'CHORE',
    labels: [LABELS[0]!],
  }),
  task(3, 'Add a monthly usage summary to the dashboard', 'todo', {
    type: 'FEATURE',
    priority: 'HIGH',
    assignees: [MAYA],
    dueDate: day(6),
    estimateHours: 12,
    labels: [LABELS[1]!],
    counts: { subtasks: 0, comments: 1, attachments: 0, checklist: 3 },
  }),
  task(4, 'Send a receipt email after every payment', 'todo', {
    type: 'FEATURE',
    assignees: [ARUN],
    dueDate: day(9),
    labels: [LABELS[2]!],
  }),
  task(5, 'Rewrite the billing webhook handler', 'in-progress', {
    priority: 'CRITICAL',
    assignees: [ARUN],
    dueDate: day(2),
    estimateHours: 16,
    spentHours: 9,
    labels: [LABELS[0]!, LABELS[2]!],
    counts: { subtasks: 2, comments: 5, attachments: 1, checklist: 6 },
  }),
  task(6, 'Tidy up the empty states on the reports page', 'in-progress', {
    type: 'IMPROVEMENT',
    priority: 'LOW',
    assignees: [MAYA],
    labels: [LABELS[1]!],
  }),
  task(7, 'Checkout fails on slow connections', 'in-review', {
    type: 'BUG',
    priority: 'HIGH',
    qaStatus: 'IN_TESTING',
    assignees: [ARUN, LENA],
    phase: PHASES[1]!,
    counts: { subtasks: 0, comments: 3, attachments: 2, checklist: 0 },
  }),
  task(8, 'Waiting on the payment provider sandbox key', 'blocked', {
    priority: 'HIGH',
    assignees: [ARUN],
    dueDate: day(-3),
    counts: { subtasks: 0, comments: 4, attachments: 0, checklist: 0 },
  }),
  task(9, 'Move session storage to Redis', 'done', {
    type: 'CHORE',
    qaStatus: 'PASSED',
    assignees: [ARUN],
    phase: PHASES[3]!,
    completedAt: day(-4),
    spentHours: 7,
  }),
  task(10, 'Add two-factor sign-in', 'done', {
    type: 'FEATURE',
    qaStatus: 'PASSED',
    assignees: [MAYA, LENA],
    phase: PHASES[3]!,
    completedAt: day(-9),
  }),
];

const member = (u: UserSummary, roleName: string, id: string): ProjectMember => ({
  id,
  responsibilities: null,
  joinedAt: day(-60),
  user: { ...u, telegramLinked: false },
  role: { id: `sample-role-${id}`, key: roleName.toLowerCase().replace(/\s+/g, '-'), name: roleName },
});

export const sampleMembers: ProjectMember[] = [
  member(MAYA, 'Project Manager', 'sample-member-1'),
  member(ARUN, 'Developer', 'sample-member-2'),
  member(LENA, 'QA / Tester', 'sample-member-3'),
];

const done = TASKS.filter((t) => t.status.category === 'DONE').length;

export const sampleProject: ProjectDetail = {
  id: SAMPLE_PROJECT_ID,
  key: SAMPLE_PROJECT_KEY,
  name: 'Example project',
  description: 'A stand-in project so the tour has something to show. Nothing here is real.',
  color: '#6366f1',
  status: 'ACTIVE',
  startDate: day(-70),
  targetDate: day(45),
  completedAt: null,
  archivedAt: null,
  createdAt: day(-70),
  updatedAt: day(-1),
  owner: MAYA,
  createdBy: MAYA,
  members: sampleMembers,
  statuses: STATUSES,
  phases: PHASES,
  labels: LABELS,
  milestones: [],
  stats: {
    totalTasks: TASKS.length,
    doneTasks: done,
    openTasks: TASKS.length - done,
    overdueTasks: 1,
    blockedTasks: 1,
    unassignedTasks: 2,
    openIssues: 2,
    criticalIssues: 1,
    progress: Math.round((done / TASKS.length) * 100),
  },
  myRole: { id: 'sample-role-viewer', key: 'viewer', name: 'Viewer' },
  // View-only on purpose: every screen reads its buttons and drag handles from
  // this list, so the sample cannot be edited and never fires a mutation.
  myPermissions: [
    'project:view',
    'task:view',
    'issue:view',
    'release:view',
    'hotfix:view',
    'report:view',
    'activity:view',
  ],
};

export const sampleBoard: BoardColumn[] = STATUSES.map((s) => {
  const tasks = TASKS.filter((t) => t.status.id === s.id);
  return { status: s, tasks, count: tasks.length };
});

export const sampleTaskList: Paged<Task> = {
  data: TASKS,
  meta: { page: 1, pageSize: 50, total: TASKS.length, totalPages: 1 },
};

export const sampleGroupedTasks: Grouped<Task> = {
  data: STATUSES.map((s) => ({
    key: s.id,
    label: s.name,
    color: s.color,
    tasks: TASKS.filter((t) => t.status.id === s.id),
  })),
  meta: { page: 1, pageSize: 50, total: TASKS.length, grouped: true },
};

const issue = (n: number, title: string, over: Partial<Issue> = {}): Issue => ({
  id: `sample-issue-${n}`,
  key: `${SAMPLE_PROJECT_KEY}-I${n}`,
  title,
  status: 'OPEN',
  severity: 'MAJOR',
  priority: 'MEDIUM',
  startDate: null,
  dueDate: null,
  resolvedAt: null,
  closedAt: null,
  reopenCount: 0,
  createdAt: day(-6),
  updatedAt: day(-1),
  project: projectRef,
  phase: PHASES[1]!,
  reporter: LENA,
  assignee: null,
  task: null,
  release: null,
  labels: [],
  counts: { comments: 0, attachments: 0, hotfixes: 0, tasks: 0 },
  ...over,
});

export const sampleIssues: Paged<Issue> = {
  data: [
    issue(1, 'Invoice total is wrong when a discount is applied', {
      severity: 'CRITICAL',
      priority: 'CRITICAL',
      status: 'IN_PROGRESS',
      assignee: ARUN,
      phase: PHASES[3]!,
      counts: { comments: 4, attachments: 1, hotfixes: 1, tasks: 2 },
    }),
    issue(2, 'Date picker shows the wrong month in Khmer', {
      severity: 'MINOR',
      status: 'ASSIGNED',
      assignee: MAYA,
    }),
    issue(3, 'Search returns archived projects', {
      status: 'RESOLVED',
      resolvedAt: day(-2),
      assignee: ARUN,
    }),
  ],
  meta: { page: 1, pageSize: 50, total: 3, totalPages: 1 },
};

export const sampleReleases: Paged<Release> = {
  data: [
    {
      id: 'sample-release-1',
      version: '2.4.0',
      name: 'Billing and exports',
      description: null,
      status: 'IN_DEVELOPMENT',
      isHotfix: false,
      plannedDate: day(12),
      releasedAt: null,
      createdAt: day(-20),
      project: projectRef,
      phase: PHASES[0]!,
      createdBy: MAYA,
      counts: { tasks: 4, issues: 1, hotfixes: 0, deployments: 0 },
    },
    {
      id: 'sample-release-2',
      version: '2.3.1',
      name: 'Sign-in fixes',
      description: null,
      status: 'RELEASED',
      isHotfix: false,
      plannedDate: day(-15),
      releasedAt: day(-14),
      createdAt: day(-40),
      project: projectRef,
      phase: PHASES[3]!,
      createdBy: ARUN,
      counts: { tasks: 6, issues: 2, hotfixes: 1, deployments: 3 },
    },
  ],
  meta: { page: 1, pageSize: 50, total: 2, totalPages: 1 },
};

export const sampleHotfixes: Paged<Hotfix> = {
  data: [
    {
      id: 'sample-hotfix-1',
      key: `${SAMPLE_PROJECT_KEY}-H1`,
      title: 'Discounted invoices charge the wrong amount',
      description: null,
      status: 'IN_PROGRESS',
      severity: 'CRITICAL',
      priority: 'CRITICAL',
      dueDate: day(1),
      approvedAt: day(-1),
      fixedAt: null,
      testedAt: null,
      deployedAt: null,
      verifiedAt: null,
      rootCause: null,
      resolution: null,
      createdAt: day(-1),
      updatedAt: day(0),
      project: projectRef,
      requestedBy: LENA,
      assignee: ARUN,
      issue: {
        id: 'sample-issue-1',
        key: `${SAMPLE_PROJECT_KEY}-I1`,
        title: 'Invoice total is wrong when a discount is applied',
        severity: 'CRITICAL',
        status: 'IN_PROGRESS',
      },
      task: null,
      release: null,
      counts: { comments: 2, attachments: 0 },
    },
  ],
  meta: { page: 1, pageSize: 50, total: 1, totalPages: 1 },
};

const phaseTask = (t: Task) => ({
  id: t.id,
  key: t.key,
  title: t.title,
  type: t.type,
  priority: t.priority,
  qaStatus: t.qaStatus,
  dueDate: t.dueDate,
  status: t.status,
  release: t.release,
  assignees: t.assignees,
});

export const samplePhaseBoard: PhaseBoard = {
  phases: PHASES.map((phase) => {
    const tasks = TASKS.filter((t) => t.phase?.id === phase.id);
    return {
      phase,
      tasks: tasks.map(phaseTask),
      stats: {
        total: tasks.length,
        done: tasks.filter((t) => t.status.category === 'DONE').length,
        qaPassed: tasks.filter((t) => t.qaStatus === 'PASSED').length,
        qaFailed: 0,
        awaitingTesting: tasks.filter((t) => t.qaStatus === 'IN_TESTING').length,
        openIssues: phase.isProduction ? 1 : 0,
        criticalIssues: phase.isProduction ? 1 : 0,
      },
    };
  }),
  unphased: [],
};

export const sampleReport: ProjectReport = {
  project: {
    ...projectRef,
    description: sampleProject.description,
    status: 'ACTIVE',
    startDate: sampleProject.startDate,
    targetDate: sampleProject.targetDate,
    completedAt: null,
    owner: MAYA,
  },
  stats: sampleProject.stats,
  statusBreakdown: STATUSES.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    color: s.color,
    count: TASKS.filter((t) => t.status.id === s.id).length,
  })),
  priorityBreakdown: [
    { priority: 'CRITICAL', count: 1 },
    { priority: 'HIGH', count: 3 },
    { priority: 'MEDIUM', count: 5 },
    { priority: 'LOW', count: 1 },
  ],
  typeBreakdown: [
    { type: 'FEATURE', count: 4 },
    { type: 'TASK', count: 3 },
    { type: 'BUG', count: 1 },
    { type: 'CHORE', count: 2 },
  ],
  qaBreakdown: [
    { qaStatus: 'NOT_REQUIRED', count: 7 },
    { qaStatus: 'IN_TESTING', count: 1 },
    { qaStatus: 'PASSED', count: 2 },
  ],
  phaseBreakdown: PHASES.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    isProduction: p.isProduction,
    count: TASKS.filter((t) => t.phase?.id === p.id).length,
  })),
  issueBreakdown: [
    { status: 'IN_PROGRESS', severity: 'CRITICAL', count: 1 },
    { status: 'ASSIGNED', severity: 'MINOR', count: 1 },
    { status: 'RESOLVED', severity: 'MAJOR', count: 1 },
  ],
  workload: [
    { ...ARUN, role: { id: 'r1', name: 'Developer' }, responsibilities: null, openTasks: 4, overdueTasks: 1 },
    { ...MAYA, role: { id: 'r2', name: 'Project Manager' }, responsibilities: null, openTasks: 2, overdueTasks: 0 },
    { ...LENA, role: { id: 'r3', name: 'QA / Tester' }, responsibilities: null, openTasks: 1, overdueTasks: 0 },
  ],
  milestones: [],
  releases: sampleReleases.data.map((r) => ({
    id: r.id,
    version: r.version,
    status: r.status,
    isHotfix: r.isHotfix,
    plannedDate: r.plannedDate,
    releasedAt: r.releasedAt,
    phase: r.phase,
    counts: { tasks: r.counts.tasks, issues: r.counts.issues, deployments: r.counts.deployments },
  })),
  velocity: Array.from({ length: 8 }, (_, i) => ({
    week: day(-7 * (7 - i)).slice(0, 10),
    completed: [1, 0, 2, 3, 1, 2, 4, 2][i]!,
  })),
};
