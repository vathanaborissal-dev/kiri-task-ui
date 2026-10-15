'use client';

import { Bell, Palette, Send, ShieldCheck, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PageHeader } from '@/components/common/page-header';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/settings/profile', label: 'Profile', icon: User },
  { href: '/settings/appearance', label: 'Appearance', icon: Palette },
  { href: '/settings/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings/telegram', label: 'Telegram', icon: Send },
  { href: '/settings/security', label: 'Security', icon: ShieldCheck },
];

export function SettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Settings" description="Your profile, notifications and account security." />

      <nav className="flex flex-wrap gap-1 border-b pb-px" aria-label="Settings sections">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-1.5 rounded-t-md border-b-2 px-3 py-2 text-sm transition-colors',
                active
                  ? 'border-primary font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
              )}
            >
              <tab.icon className="size-3.5" aria-hidden />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
