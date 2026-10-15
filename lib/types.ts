/** Shapes returned by the Kiri Task API. */

export type Paged<T> = {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

export type Grouped<T> = {
  data: { key: string; label: string; color?: string; tasks?: T[]; issues?: T[] }[];
  meta: { page: number; pageSize: number; total: number; grouped: true };
};

export type UserSummary = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  isActive: boolean;
};

export type RoleSummary = { id: string; key: string; name: string; scope?: RoleScope };

export type RoleScope = 'GLOBAL' | 'PROJECT';

export type Role = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  scope: RoleScope;
  permissions: string[];
  isSystem: boolean;
  isDefault: boolean;
  usageCount?: number;
  createdAt: string;
};

export type PermissionDefinition = {
  key: string;
  label: string;
  description: string;
  group: string;
  scope: 'GLOBAL' | 'PROJECT' | 'BOTH';
};

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  timezone: string;
  mustChangePassword: boolean;
  /** Newest "What's new" entry this person has read, or null for never. */
  changelogSeenAt: string | null;
  /** Set once they have been through the getting-started guide. */
  guideSeenAt: string | null;
  telegramLinked: boolean;
  telegramUsername: string | null;
  globalRole: RoleSummary;
  permissions: string[];
};

export type ProjectMembershipSummary = {
  id: string;
  key: string;
  name: string;
  color: string;
  status: ProjectStatus;
  role: RoleSummary;
  responsibilities: string | null;
  permissions: string[];
};

export type MeResponse = {
  user: CurrentUser;
  unreadNotifications: number;
  projects: ProjectMembershipSummary[];
};

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Severity = 'MINOR' | 'MAJOR' | 'CRITICAL' | 'BLOCKER';
export type StatusCategory = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'DONE' | 'CANCELED';
export type TaskType = 'TASK' | 'FEATURE' | 'BUG' | 'IMPROVEMENT' | 'CHORE' | 'HOTFIX';
export type QaStatus = 'NOT_REQUIRED' | 'PENDING' | 'IN_TESTING' | 'PASSED' | 'FAILED';
export type IssueStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'READY_FOR_TESTING'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED'
  | 'WONT_FIX';
export type ReleaseStatus = 'PLANNED' | 'IN_DEVELOPMENT' | 'READY' | 'RELEASED' | 'CANCELED';
export type DeploymentStatus = 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'ROLLED_BACK';
export type HotfixStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'IN_TESTING'
  | 'READY'
  | 'DEPLOYED'
  | 'VERIFIED'
  | 'REJECTED';
export type LinkType =
  | 'BLOCKS'
  | 'BLOCKED_BY'
  | 'RELATES_TO'
  | 'DUPLICATES'
  | 'DUPLICATED_BY'
  | 'FIXES'
  | 'FIXED_BY';

export type TaskStatusRef = {
  id: string;
  key: string;
  name: string;
  category: StatusCategory;
  color: string;
  order: number;
  isDefault?: boolean;
};

export type PhaseRef = {
  id: string;
  key: string;
  name: string;
  color: string;
  order: number;
  isProduction: boolean;
  description?: string | null;
};

export type LabelRef = { id: string; name: string; color: string };

export type ProjectRef = { id: string; key: string; name: string; color: string };

export type ProjectStats = {
  totalTasks: number;
  doneTasks: number;
  openTasks: number;
  overdueTasks: number;
  blockedTasks: number;
  unassignedTasks: number;
  openIssues: number;
  criticalIssues: number;
  progress: number;
};

export type ProjectListItem = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  color: string;
  status: ProjectStatus;
  startDate: string | null;
  targetDate: string | null;
  completedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  owner: UserSummary;
  members: { user: UserSummary; role: RoleSummary }[];
  memberCount: number;
  taskCount: number;
  issueCount: number;
  releaseCount: number;
  stats: ProjectStats;
};

export type ProjectMember = {
  id: string;
  responsibilities: string | null;
  joinedAt: string;
  user: UserSummary & { timezone?: string; telegramLinked: boolean };
  role: RoleSummary & { permissions?: string[] };
};

export type Milestone = {
  id: string;
  name: string;
  description: string | null;
  dueDate: string | null;
  completedAt: string | null;
  taskCount: number;
  doneTaskCount?: number;
};

export type ProjectDetail = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  color: string;
  status: ProjectStatus;
  startDate: string | null;
  targetDate: string | null;
  completedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  owner: UserSummary;
  createdBy: UserSummary;
  members: ProjectMember[];
  statuses: TaskStatusRef[];
  phases: PhaseRef[];
  labels: LabelRef[];
  milestones: Milestone[];
  stats: ProjectStats;
  myRole: RoleSummary | null;
  myPermissions: string[];
};

export type Task = {
  id: string;
  key: string;
  title: string;
  description?: string | null;
  type: TaskType;
  priority: Priority;
  qaStatus: QaStatus;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  estimateHours: number | null;
  spentHours: number | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  parentTaskId: string | null;
  project: ProjectRef;
  status: TaskStatusRef;
  phase: PhaseRef | null;
  milestone: { id: string; name: string } | null;
  release: { id: string; version: string } | null;
  reporter: UserSummary;
  assignees: UserSummary[];
  labels: LabelRef[];
  counts: { subtasks: number; comments: number; attachments: number; checklist: number };
};

export type ChecklistItem = {
  id: string;
  title: string;
  isDone: boolean;
  order: number;
  dueDate: string | null;
  completedAt: string | null;
  assignee: UserSummary | null;
};

export type Attachment = {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  bytes: number;
  width: number | null;
  height: number | null;
  createdAt: string;
  uploadedBy: UserSummary;
};

export type TaskLink = {
  id: string;
  type: LinkType;
  direction: 'in' | 'out';
  task: { id: string; key: string; title: string; status: TaskStatusRef };
};

export type TaskDetail = Task & {
  parentTask: { id: string; key: string; title: string; status: TaskStatusRef } | null;
  /** Work that points at this task — reported issues and raised hotfixes. */
  issues: { id: string; key: string; title: string; status: IssueStatus; severity: Severity }[];
  hotfixes: { id: string; key: string; title: string; status: HotfixStatus; severity: Severity }[];
  subtasks: {
    id: string;
    key: string;
    title: string;
    priority: Priority;
    dueDate: string | null;
    status: TaskStatusRef;
    assignees: { user: UserSummary }[];
  }[];
  checklist: ChecklistItem[];
  watchers: UserSummary[];
  links: TaskLink[];
  attachments: Attachment[];
};

export type BoardColumn = { status: TaskStatusRef; tasks: Task[]; count: number };

export type Issue = {
  id: string;
  key: string;
  title: string;
  description?: string | null;
  stepsToReproduce?: string | null;
  expectedResult?: string | null;
  actualResult?: string | null;
  status: IssueStatus;
  severity: Severity;
  priority: Priority;
  dueDate: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  reopenCount: number;
  createdAt: string;
  updatedAt: string;
  project: ProjectRef;
  phase: PhaseRef | null;
  reporter: UserSummary;
  assignee: UserSummary | null;
  task: { id: string; key: string; title: string } | null;
  release: { id: string; version: string } | null;
  labels: LabelRef[];
  counts: { comments: number; attachments: number; hotfixes: number };
  watchers?: UserSummary[];
  attachments?: Attachment[];
  hotfixes?: { id: string; key: string; title: string; status: HotfixStatus; severity: Severity }[];
};

export type Deployment = {
  id: string;
  status: DeploymentStatus;
  notes: string | null;
  deployedAt: string;
  phase: PhaseRef;
  deployedBy: UserSummary;
};

export type Release = {
  id: string;
  version: string;
  name: string | null;
  description: string | null;
  releaseNotes?: string | null;
  status: ReleaseStatus;
  isHotfix: boolean;
  plannedDate: string | null;
  releasedAt: string | null;
  createdAt: string;
  project: ProjectRef;
  phase: PhaseRef | null;
  createdBy: UserSummary;
  counts: { tasks: number; issues: number; hotfixes: number; deployments: number };
};

export type ReleaseDetail = Release & {
  tasks: (Pick<Task, 'id' | 'key' | 'title' | 'type' | 'priority' | 'qaStatus' | 'status'> & {
    phase: PhaseRef | null;
    assignees: UserSummary[];
  })[];
  issues: Pick<Issue, 'id' | 'key' | 'title' | 'status' | 'severity'> &
    { assignee: UserSummary | null }[];
  hotfixes: { id: string; key: string; title: string; status: HotfixStatus; severity: Severity }[];
  deployments: Deployment[];
  readiness: {
    totalTasks: number;
    doneTasks: number;
    qaPassed: number;
    qaFailed: number;
    qaPending: number;
    openIssues: number;
  };
};

export type Hotfix = {
  id: string;
  key: string;
  title: string;
  description?: string | null;
  status: HotfixStatus;
  severity: Severity;
  priority: Priority;
  dueDate: string | null;
  approvedAt: string | null;
  fixedAt: string | null;
  testedAt: string | null;
  deployedAt: string | null;
  verifiedAt: string | null;
  rootCause?: string | null;
  resolution?: string | null;
  createdAt: string;
  updatedAt: string;
  project: ProjectRef;
  requestedBy: UserSummary;
  assignee: UserSummary | null;
  issue: { id: string; key: string; title: string; severity: Severity; status: IssueStatus } | null;
  task: {
    id: string;
    key: string;
    title: string;
    qaStatus: QaStatus;
    status: TaskStatusRef;
    phase: PhaseRef | null;
  } | null;
  release: { id: string; version: string; status: ReleaseStatus; releasedAt: string | null } | null;
  counts: { comments: number; attachments: number };
  attachments?: Attachment[];
};

export type Comment = {
  id: string;
  body: string;
  entityType: string;
  parentId: string | null;
  editedAt: string | null;
  createdAt: string;
  author: UserSummary;
  mentions: UserSummary[];
  attachments: Pick<Attachment, 'id' | 'filename' | 'url' | 'mimeType' | 'bytes' | 'width' | 'height'>[];
};

export type ActivityEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
  actor: UserSummary | null;
  project: ProjectRef | null;
  task: { id: string; key: string; title: string } | null;
  issue: { id: string; key: string; title: string } | null;
  release: { id: string; version: string } | null;
  hotfix: { id: string; key: string; title: string } | null;
};

export type NotificationEventKey = string;

export type AppNotification = {
  id: string;
  event: NotificationEventKey;
  title: string;
  body: string | null;
  url: string | null;
  readAt: string | null;
  createdAt: string;
  actor: UserSummary | null;
  project: ProjectRef | null;
};

export type NotificationPreference = {
  event: NotificationEventKey;
  label: string;
  description: string;
  group: string;
  web: boolean;
  telegram: boolean;
  email: boolean;
};

export type RiskLevel = 'ON_TRACK' | 'WATCH' | 'AT_RISK' | 'CRITICAL';

export type RiskAssessment = {
  level: RiskLevel;
  score: number;
  /** Why the project scored what it did, in reading order. */
  reasons: string[];
  slipDays: number | null;
};

export type PortfolioProject = ProjectRef & {
  status: ProjectStatus;
  startDate: string | null;
  targetDate: string | null;
  completedAt: string | null;
  archivedAt: string | null;
  owner: UserSummary;
  memberCount: number;
  stats: ProjectStats;
  openHotfixes: number;
  risk: RiskAssessment;
};

export type PortfolioReport = {
  totals: {
    projects: number;
    activeProjects: number;
    tasks: number;
    openTasks: number;
    doneTasks: number;
    overdueTasks: number;
    unassignedTasks: number;
    blockedTasks: number;
    openIssues: number;
    criticalIssues: number;
    openHotfixes: number;
    progress: number;
  };
  projects: PortfolioProject[];
  attention: (ProjectRef & { risk: RiskAssessment })[];
  trend: { week: string; completed: number; created: number; estimateCompleted: number }[];
  capacity: {
    user: UserSummary;
    openTasks: number;
    overdueTasks: number;
    blockedTasks: number;
  }[];
  riskCounts: Record<RiskLevel, number>;
  includesArchived: boolean;
};

export type DashboardOverview = {
  totals: {
    projects: number;
    activeProjects: number;
    tasks: number;
    openTasks: number;
    doneTasks: number;
    overdueTasks: number;
    unassignedTasks: number;
    blockedTasks: number;
    openIssues: number;
    criticalIssues: number;
    openHotfixes: number;
    dueThisWeek: number;
    progress: number;
  };
  projects: (ProjectRef & {
    status: ProjectStatus;
    targetDate: string | null;
    archivedAt: string | null;
    owner: UserSummary;
    memberCount: number;
    stats: ProjectStats;
  })[];
  phases: { name: string; color: string; count: number }[];
  upcomingDeadlines: Task[];
  overdue: Task[];
  recentActivity: ActivityEntry[];
  releases: (Pick<Release, 'id' | 'version' | 'name' | 'status' | 'isHotfix' | 'plannedDate'> & {
    project: ProjectRef;
    phase: PhaseRef | null;
    counts: { tasks: number; issues: number };
  })[];
};

export type MyWork = {
  counts: {
    assigned: number;
    inProgress: number;
    dueToday: number;
    dueThisWeek: number;
    overdue: number;
    blocked: number;
    issues: number;
    hotfixes: number;
    reported: number;
  };
  tasks: Task[];
  issues: (Pick<Issue, 'id' | 'key' | 'title' | 'status' | 'severity' | 'priority' | 'dueDate'> & {
    project: ProjectRef;
    phase: PhaseRef | null;
  })[];
  hotfixes: (Pick<Hotfix, 'id' | 'key' | 'title' | 'status' | 'severity' | 'dueDate'> & {
    project: ProjectRef;
  })[];
  reportedIssues: (Pick<Issue, 'id' | 'key' | 'title' | 'status' | 'severity'> & {
    project: ProjectRef;
    assignee: UserSummary | null;
  })[];
  recentActivity: ActivityEntry[];
};

export type ProjectReport = {
  project: ProjectRef & {
    description: string | null;
    status: ProjectStatus;
    startDate: string | null;
    targetDate: string | null;
    completedAt: string | null;
    owner: UserSummary;
  };
  stats: ProjectStats;
  statusBreakdown: { id: string; name: string; category: StatusCategory; color: string; count: number }[];
  priorityBreakdown: { priority: Priority; count: number }[];
  typeBreakdown: { type: TaskType; count: number }[];
  qaBreakdown: { qaStatus: QaStatus; count: number }[];
  phaseBreakdown: { id: string; name: string; color: string; isProduction: boolean; count: number }[];
  issueBreakdown: { status: IssueStatus; severity: Severity; count: number }[];
  workload: (UserSummary & {
    role: { id: string; name: string };
    responsibilities: string | null;
    openTasks: number;
    overdueTasks: number;
  })[];
  milestones: Milestone[];
  releases: (Pick<Release, 'id' | 'version' | 'status' | 'isHotfix' | 'plannedDate' | 'releasedAt'> & {
    phase: PhaseRef | null;
    counts: { tasks: number; issues: number; deployments: number };
  })[];
  velocity: { week: string; completed: number }[];
};

export type PhaseBoard = {
  phases: {
    phase: PhaseRef;
    tasks: (Pick<Task, 'id' | 'key' | 'title' | 'type' | 'priority' | 'qaStatus' | 'dueDate' | 'status'> & {
      release: { id: string; version: string } | null;
      assignees: UserSummary[];
    })[];
    stats: {
      total: number;
      done: number;
      qaPassed: number;
      qaFailed: number;
      awaitingTesting: number;
      openIssues: number;
      criticalIssues: number;
    };
  }[];
  unphased: (Pick<Task, 'id' | 'key' | 'title' | 'type' | 'priority' | 'qaStatus' | 'dueDate' | 'status'> & {
    release: { id: string; version: string } | null;
    assignees: UserSummary[];
  })[];
};

export type WorkloadEntry = UserSummary & {
  openTasks: number;
  inProgress: number;
  blocked: number;
  overdue: number;
  critical: number;
  estimatedHours: number;
  openIssues: number;
};

export type TeamMember = UserSummary & {
  responsibilities: string | null;
  timezone: string;
  telegramLinked: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  globalRole: RoleSummary;
  projectCount: number;
  openTaskCount: number;
  openIssueCount: number;
};

export type Invitation = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
  role: RoleSummary;
  invitedBy: UserSummary;
};

export type SavedFilter = {
  id: string;
  name: string;
  scope: 'TASK' | 'ISSUE';
  query: Record<string, unknown>;
  isShared: boolean;
  projectId: string | null;
  createdAt: string;
  user: UserSummary;
  isMine: boolean;
};

export type Session = {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

export type TelegramStatus = {
  linked: boolean;
  username: string | null;
  linkedAt: string | null;
  botUsername: string | null;
  botConfigured: boolean;
  botRunning: boolean;
};

export type ScheduleFeed = {
  tasks: Task[];
  milestones: (Pick<Milestone, 'id' | 'name' | 'dueDate' | 'completedAt'> & { project: ProjectRef })[];
  releases: (Pick<Release, 'id' | 'version' | 'name' | 'status' | 'plannedDate' | 'releasedAt' | 'isHotfix'> & {
    project: ProjectRef;
  })[];
  range: { from: string; to: string };
};

// --- Daily plans ------------------------------------------------------------

export type DailyPlanItemKind = 'FOCUS' | 'BLOCKER';

export type DailyPlanItem = {
  id: string;
  kind: DailyPlanItemKind;
  body: string;
  isDone: boolean;
  resolvedAt: string | null;
  order: number;
  createdAt: string;
  task: TaskRef | null;
};

export type TaskRef = {
  id: string;
  key: string;
  title: string;
  status: TaskStatusRef;
  project: ProjectRef;
};

export type DailyPlan = {
  id: string;
  date: string;
  note: string | null;
  updatedAt: string;
  user: UserSummary;
  items: DailyPlanItem[];
};

export type TeamDay = {
  date: string;
  people: { user: UserSummary; plan: DailyPlan | null }[];
};
