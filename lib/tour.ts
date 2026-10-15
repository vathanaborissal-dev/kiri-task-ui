/**
 * The guided tour.
 *
 * Each step points at something real on the screen, so the explanation sits
 * next to the thing it is explaining rather than describing it from a page
 * somebody has to translate back into clicks.
 *
 * `target` is a `data-tour` value, not a class or an id — markup moves, and a
 * step that silently points at nothing is worse than no step at all.
 */

import { SAMPLE_PROJECT_KEY } from './sample-project';

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right';

export type TourStep = {
  id: string;
  /** The `data-tour` attribute to point at. Omitted for a step with no anchor. */
  target?: string;
  /** Where the tour should be before this step runs. */
  route?: string;
  /** Needs `:projectKey` substituting, and is skipped when there is no project. */
  needsProject?: boolean;
  /** Shown only when the viewer has not joined a project yet. */
  needsNoProject?: boolean;
  /** Hidden unless the viewer holds this permission somewhere. */
  permission?: string;
  title: string;
  body: string;
  /** A short group name shown above the title. */
  section?: string;
  /** Compact definitions for menu maps and command lists. */
  items?: { label: string; description: string }[];
  /** Preferred side; the overlay flips it when there is no room. */
  placement?: TourPlacement;
  /** Lives in the sidebar, which is a closed sheet on a phone. */
  inSidebar?: boolean;
  /** Shown under the body as a hint about what to try. */
  action?: string;
};

export const TOUR: TourStep[] = [
  {
    id: 'welcome',
    section: 'Start here',
    title: 'Scrum can be simple',
    body: 'Choose work, move it as you build, say when you are stuck, and finish it. This short tour shows where to do each part.',
  },
  {
    id: 'no-project',
    route: '/dashboard',
    needsNoProject: true,
    target: 'nav-all-projects',
    inSidebar: true,
    section: 'Start here',
    title: 'No project yet? That is okay',
    body: 'Open All projects. Create one if the button is available, or ask a manager to add you.',
    placement: 'right',
  },
  {
    id: 'no-project-sections',
    route: '/projects/:projectKey',
    needsNoProject: true,
    target: 'nav-project',
    inSidebar: true,
    section: 'Your project',
    title: 'This menu is your project map',
    body: 'Example project is a stand-in, filled with made-up work so the next few screens have something to show. A real project opens into exactly these pages.',
    placement: 'right',
    action: 'Nothing here can be edited — it is a sample.',
  },
  {
    id: 'project-menu',
    route: '/projects/:projectKey',
    needsProject: true,
    target: 'nav-project',
    inSidebar: true,
    section: 'Your project',
    title: 'This menu is your project map',
    body: 'You do not need every page each day. Start with Board and Tasks.',
    placement: 'right',
    items: [
      { label: 'Overview', description: 'Project health' },
      { label: 'Board', description: 'Move work' },
      { label: 'Tasks', description: 'Find all work' },
      { label: 'Issues', description: 'Report bugs' },
      { label: 'Phases', description: 'Where it runs' },
      { label: 'Releases', description: 'Planned delivery' },
      { label: 'Hotfixes', description: 'Urgent live fix' },
      { label: 'Reports', description: 'Progress and workload' },
      { label: 'Settings', description: 'People and setup' },
    ],
  },
  {
    id: 'project-overview',
    route: '/projects/:projectKey',
    target: 'nav-project-overview',
    inSidebar: true,
    section: 'Your project',
    title: 'Overview: check before you start',
    body: 'See progress, deadlines, people, and recent changes in one place.',
    placement: 'right',
  },
  {
    id: 'board',
    route: '/projects/:projectKey/board',
    target: 'board-column-header',
    section: 'Daily work',
    title: 'Board: move work left to right',
    body: '**Backlog** means later. **To do** means ready. **In progress** means building. **Done** means finished.',
    placement: 'bottom',
    action: 'Drag a card when its work step changes.',
  },
  {
    id: 'card',
    route: '/projects/:projectKey/board',
    target: 'board-card',
    section: 'Daily work',
    title: 'A card is one small piece of work',
    body: 'Open it for the description, deadline, files, comments, and people doing it.',
    placement: 'right',
  },
  {
    id: 'tasks',
    route: '/projects/:projectKey/tasks',
    target: 'nav-project-tasks',
    inSidebar: true,
    section: 'Daily work',
    title: 'Tasks: the same work as a list',
    body: 'Use this page to search, filter, and compare dates. The Board and Tasks pages show the same work.',
    placement: 'right',
  },
  {
    id: 'issues',
    route: '/projects/:projectKey/issues',
    target: 'nav-project-issues',
    inSidebar: true,
    section: 'Problems',
    title: 'Issues: report what is broken',
    body: 'Use an issue for a bug, not normal planned work. Say what happened, where, and how serious it is.',
    placement: 'right',
  },
  {
    id: 'report-issue',
    route: '/projects/:projectKey/issues',
    target: 'topbar-report-issue',
    permission: 'issue:create',
    section: 'Problems',
    title: 'Report a bug from any page',
    body: 'Use this button when something breaks. Add what happened, where it happened, and a screenshot if useful.',
    placement: 'bottom',
  },
  {
    id: 'phases',
    route: '/projects/:projectKey/phases',
    target: 'nav-project-phases',
    inSidebar: true,
    section: 'Delivery',
    title: 'Phases: where the code runs',
    body: 'A phase is a place such as Development, Testing, or Live. It shows how far work has reached.',
    placement: 'right',
  },
  {
    id: 'releases',
    route: '/projects/:projectKey/releases',
    target: 'nav-project-releases',
    inSidebar: true,
    section: 'Delivery',
    title: 'Releases: group work to ship',
    body: 'Put tasks and fixes into one version, then record each move toward Live.',
    placement: 'right',
  },
  {
    id: 'hotfixes',
    route: '/projects/:projectKey/hotfixes',
    target: 'nav-project-hotfixes',
    inSidebar: true,
    section: 'Delivery',
    title: 'Hotfixes: urgent live fixes',
    body: 'Use a hotfix when Live is broken and the fix cannot wait for the next release.',
    placement: 'right',
  },
  {
    id: 'reports',
    route: '/projects/:projectKey/reports',
    target: 'nav-project-reports',
    inSidebar: true,
    section: 'Project health',
    title: 'Reports: see progress and risk',
    body: 'Check finished, late, blocked, workload, and phase progress before planning or sharing an update.',
    placement: 'right',
  },
  {
    id: 'project-settings',
    route: '/projects/:projectKey/settings',
    target: 'nav-project-settings',
    inSidebar: true,
    section: 'Project setup',
    title: 'Settings: manage the project',
    body: 'Change people, work steps, phases, labels, and project details here.',
    placement: 'right',
  },
  {
    id: 'today-nav',
        target: 'nav-today',
    inSidebar: true,
    section: 'Your day',
    title: 'Start each day here',
    body: 'Today is a short update: what you will do and what is stopping you.',
    placement: 'right',
    action: 'Next opens Today.',
  },
  {
    id: 'today-focus',
    route: '/today',
        target: 'today-focus',
    section: 'Your day',
    title: 'Write what you will work on',
    body: 'Add a short line, connect it to a task, and tick it when finished.',
    placement: 'right',
  },
  {
    id: 'today-blockers',
    route: '/today',
        target: 'today-blockers',
    section: 'Your day',
    title: 'Say when you are stuck',
    body: 'Write what blocks you. Project leads get an alert in the app and on Telegram.',
    placement: 'left',
  },
  {
    id: 'my-work',
    route: '/today',
        target: 'nav-my-work',
    inSidebar: true,
    section: 'Your day',
    title: 'My work: only what belongs to you',
    body: 'See assigned work from every project. Late and blocked work comes first.',
    placement: 'right',
  },
  {
    id: 'telegram-alerts',
    route: '/settings/telegram',
    target: 'telegram-alerts',
    section: 'Telegram',
    title: 'Get useful alerts on your phone',
    body: 'Connect once. Telegram tells you about assignments, comments, mentions, and changed deadlines. Each alert links back to the work.',
    placement: 'left',
  },
  {
    id: 'telegram-commands',
    route: '/settings/telegram',
    target: 'telegram-commands',
    section: 'Telegram',
    title: 'Four commands are enough to start',
    body: 'Send these commands to the Kiri Task bot.',
    placement: 'left',
    items: [
      { label: '/today', description: 'Today’s work' },
      { label: '/mytasks', description: 'Assigned tasks' },
      { label: '/report', description: 'Report a bug' },
      { label: '/help', description: 'All commands' },
    ],
  },
  {
    id: 'search',
    target: 'topbar-search',
    section: 'You are ready',
    title: 'Search is the fastest way around',
    body: 'Find a task, issue, project, or page by its name or key. Press Ctrl K or Command K from anywhere.',
    placement: 'bottom',
  },
];

/** Resolves a step's route, or null when it cannot run for this person. */
export const routeFor = (step: TourStep, projectKey: string | null): string | null => {
  if (!step.route) return null;
  if (!step.route.includes(':projectKey')) return step.route;
  // Somebody with no project still walks these pages — they open on the sample
  // project, which renders the real screens from fixtures.
  return step.route.replace(':projectKey', projectKey ?? SAMPLE_PROJECT_KEY);
};
