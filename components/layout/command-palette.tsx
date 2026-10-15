"use client";

import {
  Bell,
  BookOpen,
  Bug,
  CalendarDays,
  Flame,
  Folder,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  PieChart,
  Rocket,
  Search,
  ShieldCheck,
  SquareKanban,
  Sunrise,
  Users,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useIssues } from "@/lib/hooks/use-issues";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useStandupPermissions } from "@/lib/hooks/use-standup-permissions";
import { useAuth } from "@/providers/auth-provider";

const EVENT = "kiri:open-command-palette";

export const openCommandPalette = () => {
  window.dispatchEvent(new Event(EVENT));
};

export function CommandPalette() {
  const router = useRouter();
  const { projects, can } = useAuth();
  const { canSeeTeam } = useStandupPermissions();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    const onEvent = () => setOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(EVENT, onEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(EVENT, onEvent);
    };
  }, []);

  const trimmed = search.trim();
  const searching = trimmed.length >= 2;

  const { data: tasks } = useTasks(
    { search: trimmed, pageSize: 6, topLevelOnly: false },
    open && searching,
  );
  const { data: issues } = useIssues(
    { search: trimmed, pageSize: 5 },
    open && searching,
  );

  const go = (href: string) => {
    setOpen(false);
    setSearch("");
    router.push(href);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search Kiri Task"
      description="Search tasks and issues, or jump to a page"
    >
      {/* The API already filtered the search results, so cmdk only filters the
          static navigation entries. */}
      <Command shouldFilter={!searching}>
        <CommandInput
          placeholder="Search tasks, issues, or jump to a page…"
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>
            {searching
              ? "Nothing matched that search."
              : "Type at least two characters to search."}
          </CommandEmpty>

          {searching && tasks?.data.length ? (
            <CommandGroup heading="Tasks">
              {tasks.data.map((task) => (
                <CommandItem
                  key={task.id}
                  value={`task-${task.key}-${task.title}`}
                  onSelect={() =>
                    go(`/projects/${task.project.key}/tasks/${task.key}`)
                  }
                  className="gap-2"
                >
                  <ListChecks className="size-4 shrink-0 text-muted-foreground" />
                  <span className="font-mono text-xs text-muted-foreground">
                    {task.key}
                  </span>
                  <span className="truncate">{task.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {searching && issues?.data.length ? (
            <CommandGroup heading="Issues">
              {issues.data.map((issue) => (
                <CommandItem
                  key={issue.id}
                  value={`issue-${issue.key}-${issue.title}`}
                  onSelect={() =>
                    go(`/projects/${issue.project.key}/issues/${issue.key}`)
                  }
                  className="gap-2"
                >
                  <Bug className="size-4 shrink-0 text-muted-foreground" />
                  <span className="font-mono text-xs text-muted-foreground">
                    {issue.key}
                  </span>
                  <span className="truncate">{issue.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {searching ? <CommandSeparator /> : null}

          <CommandGroup heading="Go to">
            <CommandItem onSelect={() => go("/dashboard")} className="gap-2">
              <LayoutDashboard className="size-4" />
              Dashboard
            </CommandItem>
            {can('project:view_all') && can('report:view') ? (
              <CommandItem onSelect={() => go("/overview")} className="gap-2">
                <PieChart className="size-4" />
                Portfolio
              </CommandItem>
            ) : null}
            <CommandItem onSelect={() => go("/today")} className="gap-2">
              <Sunrise className="size-4" />
              Today
            </CommandItem>
            {canSeeTeam ? (
              <CommandItem onSelect={() => go("/today/team")} className="gap-2">
                <UsersRound className="size-4" />
                The team&apos;s day
              </CommandItem>
            ) : null}
            <CommandItem onSelect={() => go("/my-work")} className="gap-2">
              <ListChecks className="size-4" />
              My work
            </CommandItem>
            <CommandItem onSelect={() => go("/calendar")} className="gap-2">
              <CalendarDays className="size-4" />
              Calendar
            </CommandItem>
            <CommandItem onSelect={() => go("/issues")} className="gap-2">
              <Bug className="size-4" />
              All issues
            </CommandItem>
            <CommandItem
              onSelect={() => go("/notifications")}
              className="gap-2"
            >
              <Bell className="size-4" />
              Notifications
            </CommandItem>
            <CommandItem onSelect={() => go("/projects")} className="gap-2">
              <Folder className="size-4" />
              All projects
            </CommandItem>
            {can("user:view") ? (
              <CommandItem onSelect={() => go("/team")} className="gap-2">
                <Users className="size-4" />
                Team
              </CommandItem>
            ) : null}
            {can("role:view") ? (
              <CommandItem onSelect={() => go("/roles")} className="gap-2">
                <ShieldCheck className="size-4" />
                Roles & permissions
              </CommandItem>
            ) : null}
            <CommandItem onSelect={() => go("/guide")} className="gap-2">
              <BookOpen className="size-4" />
              Beginner guide
            </CommandItem>
            <CommandItem onSelect={() => go("/whats-new")} className="gap-2">
              <Megaphone className="size-4" />
              What&apos;s new
            </CommandItem>
          </CommandGroup>

          {projects.length > 0 ? (
            <CommandGroup heading="Projects">
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={`project-${project.key}-${project.name}`}
                  onSelect={() => go(`/projects/${project.key}`)}
                  className="gap-2"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: project.color }}
                    aria-hidden
                  />
                  <span className="truncate">{project.name}</span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground">
                    {project.key}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {projects.length > 0 ? (
            <CommandGroup heading="Project views">
              {projects.slice(0, 4).flatMap((project) => [
                <CommandItem
                  key={`${project.id}-board`}
                  value={`${project.key} board`}
                  onSelect={() => go(`/projects/${project.key}/board`)}
                  className="gap-2"
                >
                  <SquareKanban className="size-4" />
                  {project.key} board
                </CommandItem>,
                <CommandItem
                  key={`${project.id}-releases`}
                  value={`${project.key} releases`}
                  onSelect={() => go(`/projects/${project.key}/releases`)}
                  className="gap-2"
                >
                  <Rocket className="size-4" />
                  {project.key} releases
                </CommandItem>,
                <CommandItem
                  key={`${project.id}-hotfixes`}
                  value={`${project.key} hotfixes`}
                  onSelect={() => go(`/projects/${project.key}/hotfixes`)}
                  className="gap-2"
                >
                  <Flame className="size-4" />
                  {project.key} hotfixes
                </CommandItem>,
              ])}
            </CommandGroup>
          ) : null}

          <CommandGroup heading="Tips">
            <CommandItem
              disabled
              className="gap-2 text-xs text-muted-foreground"
            >
              <Search className="size-4" />
              Press ⌘K / Ctrl+K anywhere to open this
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
