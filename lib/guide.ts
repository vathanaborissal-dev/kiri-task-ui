/**
 * The getting-started guide.
 *
 * Copy starts with a beginner's question ("what do I do?") instead of the
 * product navigation. Numbered sections are real sequences; everything else
 * is a reference that can be scanned in any order.
 */

export type GuideStep = {
  title: string;
  body: string;
  href?: string;
  linkLabel?: string;
};

export type GuideSection = {
  id: string;
  title: string;
  intro: string;
  icon:
    | 'compass'
    | 'kanban'
    | 'layers'
    | 'bug'
    | 'rocket'
    | 'sun'
    | 'send'
    | 'shield'
    | 'code'
    | 'chart'
    | 'map'
    | 'list';
  /** Use numbers only when order matters. */
  variant?: 'steps' | 'list' | 'directory';
  audience?: 'Everyone' | 'Developer' | 'Manager';
  /** The practical benefit, shown after the section. */
  takeaway?: string;
  permission?: string;
  steps: GuideStep[];
};

export const GUIDE: GuideSection[] = [
  {
    id: 'scrum-basics',
    title: 'Common work words, made simple',
    intro: 'Some teams call this Scrum. The board simply shows what is waiting, what people are doing, and what is finished.',
    icon: 'compass',
    variant: 'list',
    audience: 'Everyone',
    takeaway: 'Move a card when the real work changes. Do not wait until the end of the week.',
    steps: [
      {
        title: 'Backlog = do later',
        body: 'These are ideas or future tasks. The team may do them later. They are **not promised yet**.',
      },
      {
        title: 'To do = ready to start',
        body: 'The task is clear and the team has chosen it. A developer can start it.',
      },
      {
        title: 'In progress = working now',
        body: 'Move it here when work starts. Add the person doing it so the team knows who to ask.',
      },
      {
        title: 'In review = someone is checking it',
        body: 'Another person is checking the code or result. It is close, but not finished yet.',
      },
      {
        title: 'Blocked = stuck',
        body: 'The person cannot continue. Write why and add it to **Today** so someone can help.',
      },
      {
        title: 'Done = finished',
        body: 'The work is finished. It may still need testing, and it may not be live for users yet.',
      },
      {
        title: 'Sprint = work chosen for one or two weeks',
        body: 'Some teams choose a small group of tasks to finish in the next one or two weeks. Kiri Task does not need a separate Sprint page.',
      },
      {
        title: 'Daily Scrum = a short daily update',
        body: 'Use **Today** to say what you are doing and where you are stuck. The goal is to share and get help.',
      },
    ],
  },
  {
    id: 'first-day',
    title: 'Your first day: do these five things',
    intro: 'This is the shortest useful path through Kiri Task.',
    icon: 'map',
    variant: 'steps',
    audience: 'Everyone',
    steps: [
      {
        title: 'Open My work',
        body: 'Start here to see every task, issue and hotfix assigned to you across all projects.',
        href: '/my-work',
        linkLabel: 'Open My work',
      },
      {
        title: 'Open one item and read what it should do',
        body: 'Check the details, small steps, due date, links and comments. If the result is not clear, ask before starting.',
      },
      {
        title: 'Move it to In progress (working) when you start',
        body: 'On the Board, drag the card or use **Move to**. The team can now see that someone is working on it.',
      },
      {
        title: 'Write a short Today update',
        body: 'Say what you are doing and where you are stuck. A lead can help without asking you in another meeting.',
        href: '/today',
        linkLabel: 'Open Today',
      },
      {
        title: 'Keep the card up to date',
        body: 'Move it to In review (checking), Blocked (stuck), or Done (finished) when the work changes. Add a comment when another person needs more information.',
      },
    ],
  },
  {
    id: 'choose-item',
    title: 'What should I create?',
    intro: 'Choose the item that best matches the work.',
    icon: 'list',
    variant: 'directory',
    audience: 'Everyone',
    steps: [
      {
        title: 'Feature',
        body: 'Something new a user can do, such as “Customers can export invoices.” Make smaller tasks if it needs many people or steps.',
      },
      {
        title: 'Task',
        body: 'One clear piece of work, such as “Add the export button.”',
      },
      {
        title: 'Improvement',
        body: 'Something already works, but you are making it easier, faster or clearer.',
      },
      {
        title: 'Chore',
        body: 'Work the team needs but users may not see, such as updating a code package or cleaning data.',
      },
      {
        title: 'Issue',
        body: 'Something did not work as expected. Write what happened, where it happened, and how serious the problem is.',
      },
      {
        title: 'Hotfix',
        body: 'A serious problem in the live app that cannot wait. A manager must approve it, and Kiri Task keeps a full history.',
      },
      {
        title: 'Release',
        body: 'A group of finished work sent out together. Kiri Task records where it was sent, such as Testing or the live app.',
      },
    ],
  },
  {
    id: 'developer-flow',
    title: 'Developer steps: build something new',
    intro: 'Use these steps for normal work, from starting it to sending it to users.',
    icon: 'code',
    variant: 'steps',
    audience: 'Developer',
    takeaway: 'The team can see who is doing the work, what happens next, and whether it is ready—without asking you.',
    steps: [
      {
        title: 'Remember the main steps',
        body: '**New feature → Backlog (later) → To do (ready) → In progress (working) → In review (checking) → Done (finished) → Testing → Release → Production (live).** Some work may skip a step.',
      },
      {
        title: 'Pick ready work',
        body: 'Open **My work** or the project **Board**. Choose a To do (ready) item when you understand the result.',
        href: '/my-work',
        linkLabel: 'See My work',
      },
      {
        title: 'Start it',
        body: 'Add yourself to the task if needed. Move it to **In progress (working)**. Try not to start too many tasks at the same time.',
      },
      {
        title: 'Add useful information',
        body: 'Tick the small steps, link related work, attach a file if it helps, and comment on choices another person should know.',
      },
      {
        title: 'Show when you are stuck',
        body: 'Move the card to **Blocked (stuck)**, write why, and add it to **Today**. Move it back when you can continue.',
      },
      {
        title: 'Ask someone to check it',
        body: 'Move it to **In review (checking)**. @mention the person if they need a message. Keep their comments on the same task.',
      },
      {
        title: 'Finish the work, then test it',
        body: 'Move it to **Done (finished)** when the work is complete. Testing (QA) is separate: Waiting, Testing now, Passed, or Failed.',
      },
      {
        title: 'Send it out in a Release',
        body: 'A Release is a group of finished work sent out together. When you record where it was sent, every task moves to that place, such as UAT or Production (live).',
      },
    ],
  },
  {
    id: 'issue-flow',
    title: 'Developer steps: normal problem or urgent fix?',
    intro: 'Ask two things: Where is the problem? How quickly must we fix it?',
    icon: 'bug',
    variant: 'list',
    audience: 'Developer',
    steps: [
      {
        title: 'A normal problem: report an Issue',
        body: '**Report Issue → write what should happen and what happened → choose how serious it is → choose where you found it → add or link the fix task → fix and test → mark Resolved after someone checks it.** Use the bug button at the top of any page.',
        href: '/issues',
        linkLabel: 'See all issues',
      },
      {
        title: 'A serious live problem: request a Hotfix',
        body: '**Live problem → request Hotfix → manager approves → a HOTFIX task appears on the Board → developer fixes and tests → add it to a Release → send it to Production (live) → mark Verified.** Managers get a message right away.',
      },
      {
        title: 'Not urgent? Use the normal Release steps',
        body: 'A problem in the live app is not always a Hotfix. Use a Hotfix only when waiting for the next Release would cause a serious problem.',
      },
    ],
  },
  {
    id: 'manager-flow',
    title: 'Manager steps: check the team and project',
    intro: 'Start with the big picture. Open more details only when something needs help.',
    icon: 'chart',
    variant: 'steps',
    audience: 'Manager',
    takeaway: 'You see problems early, know who is doing each task, and know what is ready—without another meeting.',
    steps: [
      {
        title: 'Start on the Dashboard',
        body: 'Look for late work, stuck tasks, serious issues, open Hotfixes, due dates, and Releases still being worked on. These need your attention.',
        href: '/dashboard',
        linkLabel: 'Open Dashboard',
      },
      {
        title: 'Read The team’s day',
        body: 'See what each person plans to do. Show only people who are stuck, then help them before giving them more work.',
        href: '/today/team',
        linkLabel: 'Open The team’s day',
      },
      {
        title: 'Open the project Board',
        body: 'Check if tasks are moving. Look for too many tasks in In progress (working), In review (checking), or Blocked (stuck). Finishing work matters more than keeping everyone busy.',
      },
      {
        title: 'Check location and testing before promising a date',
        body: 'Done (finished) work may still need testing or may only be in Development. Phases shows whether it reached UAT (user testing), Pilot (small live test), or Production (live for everyone).',
      },
      {
        title: 'Use Reports to see repeated problems',
        body: 'See finished work each week, late work, testing results, serious issues, and who has too much work. Use these numbers to ask helpful questions, not to rank people.',
      },
      {
        title: 'Check the Release before sending it out',
        body: 'Check the work inside it, failed tests, stuck tasks, and open issues. After sending it out, record where it went so the history is correct.',
      },
    ],
  },
  {
    id: 'progress-labels',
    title: 'Three labels with three simple jobs',
    intro: 'Kiri Task keeps these separate so “finished” is easy to understand.',
    icon: 'layers',
    variant: 'list',
    audience: 'Everyone',
    steps: [
      {
        title: 'Status = what is happening to the work?',
        body: 'Backlog (later), To do (ready), In progress (working), In review (checking), Blocked (stuck), or Done (finished).',
      },
      {
        title: 'QA = did it pass testing?',
        body: 'QA means testing. The choices are: No test needed, Waiting for test, Testing now, Passed, or Failed.',
      },
      {
        title: 'Phase = where is the work now?',
        body: 'A Phase is where the work is now: Development (being built), UAT (user testing), Pilot (small live test), or Production (live for everyone).',
      },
    ],
  },
  {
    id: 'page-guide',
    title: 'Every page, in one sentence',
    intro: 'Find the question you want to answer, then open that page.',
    icon: 'map',
    variant: 'directory',
    audience: 'Everyone',
    steps: [
      {
        title: 'Dashboard — “Where should I look first?”',
        body: 'See finished work, due dates, stuck tasks, problems, Hotfixes, and Releases across all your projects.',
        href: '/dashboard',
        linkLabel: 'Open Dashboard',
      },
      {
        title: 'Today — “What am I doing and what is stopping me?”',
        body: 'Write your short plan for today and say where you are stuck. Update it when your day changes.',
        href: '/today',
        linkLabel: 'Open Today',
      },
      {
        title: 'The team’s day — “Who needs help?”',
        body: 'See everyone’s daily plan in one place. You can show only people who are stuck.',
        href: '/today/team',
        linkLabel: 'Open the team view',
      },
      {
        title: 'My work — “What belongs to me?”',
        body: 'See tasks, issues, and Hotfixes given to you, including work that is late or stuck.',
        href: '/my-work',
        linkLabel: 'Open My work',
      },
      {
        title: 'Calendar — “What is due, and when?”',
        body: 'See due dates, important dates, and planned Releases by month or in one line of time.',
        href: '/calendar',
        linkLabel: 'Open Calendar',
      },
      {
        title: 'All issues — “What is broken anywhere?”',
        body: 'See problems from all your projects, so an urgent problem is easy to find.',
        href: '/issues',
        linkLabel: 'Open Issues',
      },
      {
        title: 'Notifications — “What changed that needs me?”',
        body: 'See messages when someone names you, gives you work, asks for approval, or changes something important.',
        href: '/notifications',
        linkLabel: 'Open Notifications',
      },
      {
        title: 'Projects — “Which product or team space do I need?”',
        body: 'See every project you can open and how much work is finished.',
        href: '/projects',
        linkLabel: 'Open Projects',
      },
      {
        title: 'Project overview — “Is this project healthy?”',
        body: 'See finished work, current tasks, due dates, problems, and recent changes for one project.',
      },
      {
        title: 'Board — “What is moving or stuck?”',
        body: 'See cards in Backlog (later), To do (ready), In progress (working), In review (checking), Blocked (stuck), or Done (finished). Move a card when the work changes.',
      },
      {
        title: 'Tasks — “Can I scan or filter all the work?”',
        body: 'See all tasks in a simple list. Search or show only the tasks you need.',
      },
      {
        title: 'Project issues — “What is broken in this project?”',
        body: 'See problems in one project, how serious they are, who owns them, where they were found, and the task that fixes them.',
      },
      {
        title: 'Phases — “Where is the work now?”',
        body: 'See work in Development (being built), UAT (user testing), Pilot (small live test), or Production (live for everyone), with its test result.',
      },
      {
        title: 'Releases — “What will we send out together?”',
        body: 'See each Release, the work inside it, whether it is ready, notes, and where it was sent.',
      },
      {
        title: 'Hotfixes — “What serious live problem are we fixing?”',
        body: 'See urgent live fixes, who approved them, who owns them, their tasks, and the Release that sent them out.',
      },
      {
        title: 'Reports — “Is the project going well?”',
        body: 'See finished work each week, late work, testing, problems, and how much work each person has.',
      },
      {
        title: 'Project settings — “Who can do what here?”',
        body: 'Change project details, people, access, Board columns, work locations, and other project choices.',
      },
      {
        title: 'Personal settings — “How should Kiri Task work for me?”',
        body: 'Change your profile, colours, messages, Telegram link, password, and account safety.',
        href: '/settings/profile',
        linkLabel: 'Open Settings',
      },
    ],
  },
  {
    id: 'set-up-later',
    title: 'Useful choices for later',
    intro: 'Learn the daily steps first. You can set these up later.',
    icon: 'sun',
    variant: 'directory',
    steps: [
      {
        title: 'Telegram',
        body: 'Link your account to get messages and work with tasks, comments, and Hotfix approvals from your phone.',
        href: '/settings/telegram',
        linkLabel: 'Connect Telegram',
      },
      {
        title: 'Notifications',
        body: 'Choose which messages you get in the app, on Telegram, or by email.',
        href: '/settings/notifications',
        linkLabel: 'Choose notifications',
      },
      {
        title: 'Appearance',
        body: 'Choose light or dark mode, a theme, typeface, sidebar style and content width.',
        href: '/settings/appearance',
        linkLabel: 'Change appearance',
      },
      {
        title: 'Roles and access',
        body: 'A Role decides what each person can see or change in the whole app and inside a project.',
      },
    ],
  },
  {
    id: 'roles',
    title: 'For app managers',
    intro: 'Give each person only the access they need.',
    icon: 'shield',
    variant: 'list',
    permission: 'role:view',
    steps: [
      {
        title: 'You can change Roles',
        body: 'Create or rename a Role, then choose what it can do. The Roles already in the app are only examples.',
        href: '/roles',
        linkLabel: 'Open Roles & permissions',
      },
      {
        title: 'App access and project access work together',
        body: 'A person can manage one project and only read another. Their main Role gives basic access. Their project Role adds access for that project.',
      },
    ],
  },
];
