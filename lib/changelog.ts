/**
 * What's new.
 *
 * Plain data, newest first. `date` is the day the change reached people, and
 * the sidebar compares the newest date here against the reader's own
 * `changelogSeenAt` to decide whether to show a dot — so adding an entry is the
 * whole job of announcing a release.
 */

export type ChangeKind = 'new' | 'improved' | 'fixed';

export type ChangeEntry = {
  version: string;
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  title: string;
  summary: string;
  changes: { kind: ChangeKind; text: string }[];
};

export const CHANGE_KIND_LABEL: Record<ChangeKind, string> = {
  new: 'New',
  improved: 'Improved',
  fixed: 'Fixed',
};

export const CHANGELOG: ChangeEntry[] = [
  {
    version: '1.4',
    date: '2026-10-24',
    title: 'Issues that carry their work',
    summary:
      'An issue can now hold as many tasks as the fix needs, each with its own percentage, and the two keep each other honest — the issue moves as its tasks do, and a settled issue freezes them until somebody reopens it.',
    changes: [
      {
        kind: 'new',
        text: '**An issue can have many tasks.** The issue page lists them all, rolls their progress into one bar, and lets you move or assign several at once. The first one raised is still the “main fix” everything else links to.',
      },
      {
        kind: 'new',
        text: '**Completed percentage on a task.** A slider and five quick buttons, on the task page and in bulk from the task list. Finishing a task sets it to 100%, and moving one back out of Done drops it below the line, so the board and the number can never disagree.',
      },
      {
        kind: 'new',
        text: '**Ask for help.** Anyone already on a task can pull in another developer without waiting for a lead. They are notified, start watching the task and appear alongside you on it. Taking somebody off still needs **Assign tasks**.',
      },
      {
        kind: 'new',
        text: '**Status changes follow a workflow.** An issue cannot slide back down from Resolved, Closed or Won’t Fix — it has to be **reopened** first, which is what makes the reopen count mean something. Only the moves you are allowed to make are offered, and the whole table, with the roles that hold each gate, is on **Roles & permissions**.',
      },
      {
        kind: 'new',
        text: '**Close** and **Reopen** are now permissions of their own, held by project managers, team leads and the new **Issue Manager** role. Assigning an issue already needed **Assign issues**; QA can reopen what it tested.',
      },
      {
        kind: 'new',
        text: '**Start and end dates on an issue**, in the web form and in the Telegram **/report** flow, which now asks for both with one-tap shortcuts — or a typed date.',
      },
      {
        kind: 'new',
        text: '**Multi-select on issues.** Tick several and change status, severity, priority, owner or end date in one go. Only statuses every selected issue can actually reach are offered.',
      },
      {
        kind: 'improved',
        text: '**Tasks and their issue stay in step.** The first task to start moves the issue to In Progress; the last one to finish moves it to Ready for Testing. While an issue is settled its tasks are frozen, and the refusal says which issue to reopen.',
      },
      {
        kind: 'improved',
        text: '**The create forms are grouped and labelled.** The guidance that used to live in placeholder text — and vanished the moment you typed — now sits under each field and stays put. Reproduction steps and planning fields fold away until you want them.',
      },
      {
        kind: 'improved',
        text: '**Image previews open full screen**, with zoom to 800%, drag to pan, arrow keys to step through a bug report’s screenshots, and a filmstrip. Previously a screenshot opened in a box narrower than a phone.',
      },
      {
        kind: 'fixed',
        text: 'The **top bar** stays put when you scroll a long page, instead of sliding away.',
      },
      {
        kind: 'fixed',
        text: 'The **Appearance** panel scrolls, so the sidebar, content-width and reset controls below Typeface are reachable again.',
      },
    ],
  },
  {
    version: '1.3',
    date: '2026-10-11',
    title: 'Today, and the team’s day',
    summary:
      'A short daily list of what you are working on and what is in your way, so nobody has to ask — and so the people who can unblock you find out the same day.',
    changes: [
      {
        kind: 'new',
        text: '**Today** — a few bullets for the day. Tick them off, link a bullet to a task, and leave a note if there is context worth sharing.',
      },
      {
        kind: 'new',
        text: 'Write down a **blocker** and the people who oversee your projects are told straight away, in the app and on Telegram.',
      },
      {
        kind: 'new',
        text: '**The team’s day** shows everyone’s list side by side, with a filter for just the people who are stuck. Needs the new **See the team’s day** permission, which project managers, team leads and workspace managers now have.',
      },
      {
        kind: 'new',
        text: 'A **guided tour** that points at the real screens and walks you through them — start it from **Show me around** in your account menu, any time. There is a written **Beginner guide** too, for looking things up.',
      },
      {
        kind: 'new',
        text: 'This **What’s new** page, with a dot in the sidebar when there is something you have not read.',
      },
      {
        kind: 'improved',
        text: 'The **board** now works properly on a phone: one column at a time, snapping as you swipe, with a row of status chips to jump between them. Dragging a card lands instantly instead of waiting for the server, and a swipe over a card scrolls rather than picking it up.',
      },
      {
        kind: 'improved',
        text: 'Hovering a group of avatars lists **everyone** on it, with their faces — no more hunting through a stack one at a time.',
      },
      {
        kind: 'improved',
        text: 'Anything that needs a round trip now says so: the button you pressed spins and stops accepting clicks until it is done.',
      },
      {
        kind: 'improved',
        text: 'A project no longer repeats its sections as a row of tabs — the sidebar already lists them. On a phone, where the sidebar is tucked away, the tabs stay.',
      },
      {
        kind: 'improved',
        text: 'Telegram: a **Reply** button on comment notifications, an `/app` command, and — on an https deployment — Kiri Task opens inside Telegram as a Mini App.',
      },
      {
        kind: 'fixed',
        text: 'A board column header was painting over the first card, hiding its key and making the card look oddly padded.',
      },
      {
        kind: 'fixed',
        text: 'The divider in the top bar sat against the top edge instead of the middle.',
      },
      {
        kind: 'fixed',
        text: 'A comment typed into the Telegram bot could vanish if the bot had restarted since it asked. Drafts now survive a restart, and a message the bot was not expecting gets an answer rather than silence.',
      },
    ],
  },
  {
    version: '1.2',
    date: '2026-10-10',
    title: 'A sharper read on where things stand',
    summary:
      'Reporting told a few small lies. It does not any more, and a handful of rough edges around permissions went with it.',
    changes: [
      {
        kind: 'fixed',
        text: 'Milestones in a project report showed **0 of N done** no matter how much had shipped.',
      },
      {
        kind: 'fixed',
        text: 'The throughput chart quietly dropped weeks where nothing was finished, which made delivery look steadier than it was.',
      },
      {
        kind: 'fixed',
        text: 'Signing out and back in as somebody else could briefly show the previous person’s name and permissions.',
      },
      {
        kind: 'improved',
        text: 'Priority and severity breakdowns now read **Critical first**, and overdue work is marked in red on the calendar.',
      },
      {
        kind: 'improved',
        text: 'Read-only screens say so instead of just greying out, and the task sidebar is properly labelled for screen readers.',
      },
      {
        kind: 'improved',
        text: 'A task now lists the issues and hotfixes waiting on it.',
      },
    ],
  },
  {
    version: '1.1',
    date: '2026-10-08',
    title: 'Make it yours',
    summary: 'Themes, fonts and a layout you can set to taste.',
    changes: [
      {
        kind: 'new',
        text: 'Five **theme presets** — default, neobrutalism, soft pop, glassmorphism and neumorphism — each with its own light and dark treatment.',
      },
      { kind: 'new', text: 'Eight **typefaces**, a choice of sidebar style and a wide or centred content width.' },
      { kind: 'improved', text: 'Tooltips on every icon-only control, so nothing is a guess.' },
    ],
  },
  {
    version: '1.0',
    date: '2026-10-06',
    title: 'Kiri Task',
    summary:
      'Projects, tasks, phases, issues, releases and hotfixes — with roles you define yourself and a Telegram bot that respects them.',
    changes: [
      { kind: 'new', text: 'Projects with a board, a task list, deadlines, labels, milestones and dependencies.' },
      {
        kind: 'new',
        text: 'Work status, testing status and the environment a change has reached are tracked **separately**, so “done in development” and “verified in UAT” are different facts.',
      },
      { kind: 'new', text: 'Issue reporting with screenshots, severity and the phase it was found in.' },
      { kind: 'new', text: 'Releases, deployments and an approval trail for urgent hotfixes.' },
      {
        kind: 'new',
        text: 'Roles are **data, not code** — invent as many as you need and scope them per project.',
      },
      { kind: 'new', text: 'A Telegram bot for notifications, quick actions and reporting an issue from your phone.' },
    ],
  },
];

export const LATEST_CHANGE = CHANGELOG[0]!;

/** True when there is an entry the reader has not opened yet. */
export const hasUnreadChanges = (seenAt: string | null | undefined): boolean => {
  if (!seenAt) return true;
  return new Date(`${LATEST_CHANGE.date}T00:00:00.000Z`) > new Date(seenAt);
};
