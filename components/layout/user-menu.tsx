'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  ChevronsUpDown,
  LogOut,
  Palette,
  Send,
  Settings,
  ShieldCheck,
  Route,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { UserAvatar } from '@/components/common/user-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { useTour } from '@/providers/tour-provider';

export function UserMenu() {
  const { user } = useAuth();
  const { isMobile } = useSidebar();
  const { start } = useTour();
  const queryClient = useQueryClient();

  if (!user) return null;

  const signOut = async () => {
    await api('/auth/logout', { method: 'POST', skipRefresh: true }).catch(() => undefined);
    // Cancel first: clear() does not stop requests already in flight, and one of
    // them resolving afterwards put the previous user's name and permissions
    // back into a freshly emptied cache. Then leave by a full page load so no
    // in-memory state survives into the next session.
    await queryClient.cancelQueries();
    queryClient.clear();
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a full load is the point here
    window.location.href = '/login';
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="gap-2.5">
              <UserAvatar user={user} size="md" showTooltip={false} />
              <span className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.globalRole.name}
                </span>
              </span>
              <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-60 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5">
                <UserAvatar user={user} size="md" showTooltip={false} />
                <div className="grid flex-1 leading-tight">
                  <span className="truncate text-sm font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/settings/profile">
                  <User />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/appearance">
                  <Palette />
                  Appearance
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/notifications">
                  <Bell />
                  Notifications
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/telegram">
                  <Send />
                  Telegram
                  {!user.telegramLinked ? (
                    <span className="ml-auto text-xs text-muted-foreground">Not connected</span>
                  ) : null}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/security">
                  <ShieldCheck />
                  Security
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings />
                  All settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={start}>
              <Route />
              Show me around
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void signOut()} variant="destructive">
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
