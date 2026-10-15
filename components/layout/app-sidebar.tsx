'use client';

import {
  BookOpen,
  Bug,
  CalendarDays,
  ChevronRight,
  CircleDot,
  Flame,
  Folder,
  GitBranch,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  PieChart,
  Plus,
  Rocket,
  Settings,
  ShieldCheck,
  SquareKanban,
  Sunrise,
  Users,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { KiriLogo } from '@/components/layout/kiri-logo';
import { UserMenu } from '@/components/layout/user-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { hasUnreadChanges } from '@/lib/changelog';
import { useStandupPermissions } from '@/lib/hooks/use-standup-permissions';
import { SAMPLE_PROJECT_KEY } from '@/lib/sample-project';
import { useTour } from '@/providers/tour-provider';
import { useAuth } from '@/providers/auth-provider';

const PROJECT_LINKS = [
  { href: 'board', label: 'Board', icon: SquareKanban },
  { href: 'tasks', label: 'Tasks', icon: ListChecks },
  { href: 'issues', label: 'Issues', icon: Bug },
  { href: 'phases', label: 'Phases', icon: GitBranch },
  { href: 'releases', label: 'Releases', icon: Rocket },
  { href: 'hotfixes', label: 'Hotfixes', icon: Flame },
  { href: 'reports', label: 'Reports', icon: CircleDot },
  { href: 'settings', label: 'Settings', icon: Settings },
];

/**
 * A dummy project shown only during the tour, and only to somebody who is not
 * in one yet.
 *
 * The project steps are the bulk of the tour and they all point at this menu;
 * without something to anchor to, a new joiner is told the pages exist and
 * shown nothing. The rows open the real project screens, rendered from the
 * fixtures in `lib/sample-project` — read-only, and labelled as a sample.
 */
function SampleProjectItem() {
  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip="Example project"
            data-tour="nav-project"
            className="group-data-[collapsible=icon]:justify-center"
          >
            <span
              className="size-2 shrink-0 rounded-full bg-muted-foreground/50 group-data-[collapsible=icon]:size-3"
              aria-hidden
            />
            <span className="truncate group-data-[collapsible=icon]:hidden">Example project</span>
            <span className="rounded border px-1 text-[10px] text-muted-foreground group-data-[collapsible=icon]:hidden">
              Sample
            </span>
            <ChevronRight className="ml-auto transition-transform group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub data-tour="nav-project-menu">
            <SidebarMenuSubItem>
              <SidebarMenuSubButton asChild data-tour="nav-project-overview">
                <Link href={`/projects/${SAMPLE_PROJECT_KEY}`}>Overview</Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
            {PROJECT_LINKS.map((link) => (
              <SidebarMenuSubItem key={link.href}>
                <SidebarMenuSubButton asChild data-tour={`nav-project-${link.href}`}>
                  <Link href={`/projects/${SAMPLE_PROJECT_KEY}/${link.href}`}>{link.label}</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function AppSidebar({
  variant = 'inset',
}: {
  variant?: 'sidebar' | 'floating' | 'inset';
}) {
  const pathname = usePathname();
  const { projects, can, user, unreadNotifications } = useAuth();
  const canSeePortfolio = can('project:view_all') && can('report:view');
  const { canSeeTeam } = useStandupPermissions();
  const { step: tourStep } = useTour();
  // Somebody with no project has nothing for the project steps to point at, so
  // the tour borrows a stand-in. It exists only while the tour is running, and
  // only for them, so it can never be mistaken for a project they are in.
  const showSampleProject = projects.length === 0 && tourStep !== null;
  const [createOpen, setCreateOpen] = useState(false);
  const unreadChanges = hasUnreadChanges(user?.changelogSeenAt);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <Sidebar collapsible="icon" variant={variant}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg" className="gap-2.5">
                <Link href="/dashboard" aria-label="Kiri Task dashboard">
                  <KiriLogo showWordmark={false} />
                  <span className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate text-sm font-semibold">Kiri Task</span>
                    <span className="truncate text-xs text-muted-foreground">Team workspace</span>
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/dashboard')} tooltip="Dashboard">
                    <Link href="/dashboard">
                      <LayoutDashboard />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {canSeePortfolio ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive('/overview')}
                      tooltip="Portfolio: every project ranked by health"
                    >
                      <Link href="/overview">
                        <PieChart />
                        <span>Portfolio</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/today'}
                    tooltip="Today: what you are on, and what is in the way"
                  >
                    <Link href="/today" data-tour="nav-today">
                      <Sunrise />
                      <span>Today</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {canSeeTeam ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive('/today/team')}
                      tooltip="The team's day"
                    >
                      <Link href="/today/team" data-tour="nav-team-day">
                        <UsersRound />
                        <span>The team&apos;s day</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/my-work')} tooltip="My work">
                    <Link href="/my-work" data-tour="nav-my-work">
                      <ListChecks />
                      <span>My work</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/calendar')} tooltip="Calendar">
                    <Link href="/calendar">
                      <CalendarDays />
                      <span>Calendar</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/issues')} tooltip="All issues">
                    <Link href="/issues">
                      <Bug />
                      <span>Issues</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive('/notifications')}
                    tooltip="Notifications"
                  >
                    <Link href="/notifications">
                      <CircleDot />
                      <span>Notifications</span>
                    </Link>
                  </SidebarMenuButton>
                  {unreadNotifications > 0 ? (
                    <SidebarMenuBadge>{unreadNotifications}</SidebarMenuBadge>
                  ) : null}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            {can('project:create') ? (
              <SidebarGroupAction
                title="New project"
                onClick={() => setCreateOpen(true)}
                aria-label="New project"
              >
                <Plus />
              </SidebarGroupAction>
            ) : null}
            <SidebarGroupContent>
              <SidebarMenu>
                {projects.length === 0 && !showSampleProject ? (
                  <p className="px-2 py-1.5 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                    You are not in any project yet.
                  </p>
                ) : null}
                {showSampleProject ? <SampleProjectItem /> : null}
                {projects.map((project, position) => {
                  const base = `/projects/${project.key}`;
                  const open = isActive(base);
                  return (
                    <Collapsible
                      key={`${project.id}:${open}`}
                      defaultOpen={open}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={project.name}
                            isActive={open}
                            className="group-data-[collapsible=icon]:justify-center"
                            {...(position === 0 ? { 'data-tour': 'nav-project' } : {})}
                          >
                            {/* Collapsed, this dot is the row's only icon, so it
                                grows to sit on the same optical size as the
                                lucide icons above it rather than reading as a
                                speck pinned to the left of the button. */}
                            <span
                              className="size-2 shrink-0 rounded-full group-data-[collapsible=icon]:size-3"
                              style={{ backgroundColor: project.color }}
                              aria-hidden
                            />
                            <span className="truncate group-data-[collapsible=icon]:hidden">
                              {project.name}
                            </span>
                            <ChevronRight className="ml-auto transition-transform group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub
                            {...(position === 0 ? { 'data-tour': 'nav-project-menu' } : {})}
                          >
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild isActive={pathname === base}>
                                <Link
                                  href={base}
                                  {...(position === 0
                                    ? { 'data-tour': 'nav-project-overview' }
                                    : {})}
                                >
                                  Overview
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            {PROJECT_LINKS.map((link) => (
                              <SidebarMenuSubItem key={link.href}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={pathname.startsWith(`${base}/${link.href}`)}
                                >
                                  <Link
                                    href={`${base}/${link.href}`}
                                    {...(position === 0
                                      ? { 'data-tour': `nav-project-${link.href}` }
                                      : {})}
                                  >
                                    {link.label}
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                })}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/projects'} tooltip="All projects">
                    <Link href="/projects" data-tour="nav-all-projects">
                      <Folder />
                      <span>All projects</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {can('user:view') || can('role:view') ? (
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {can('user:view') ? (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive('/team')} tooltip="Team">
                        <Link href="/team">
                          <Users />
                          <span>Team</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ) : null}
                  {can('role:view') ? (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive('/roles')} tooltip="Roles">
                        <Link href="/roles">
                          <ShieldCheck />
                          <span>Roles & permissions</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ) : null}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ) : null}
          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel>Help</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive('/whats-new')}
                    tooltip={unreadChanges ? "What's new, unread" : "What's new"}
                  >
                    <Link href="/whats-new" data-tour="nav-whats-new">
                      <Megaphone />
                      <span>What&apos;s new</span>
                    </Link>
                  </SidebarMenuButton>
                  {/* A dot, not a count: there is only ever one newest release. */}
                  {unreadChanges ? (
                    <SidebarMenuBadge className="pointer-events-none">
                      <span
                        className="size-2 rounded-full bg-primary"
                        aria-label="Unread updates"
                      />
                    </SidebarMenuBadge>
                  ) : null}
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive('/guide')}
                    tooltip="Beginner guide"
                  >
                    <Link href="/guide">
                      <BookOpen />
                      <span>Beginner guide</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <UserMenu />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
