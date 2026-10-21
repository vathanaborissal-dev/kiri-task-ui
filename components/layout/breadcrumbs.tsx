'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';

const SECTION_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  overview: 'Portfolio',
  today: 'Today',
  'my-work': 'My work',
  calendar: 'Calendar',
  issues: 'Issues',
  projects: 'Projects',
  team: 'Team',
  roles: 'Roles & permissions',
  settings: 'Settings',
  board: 'Board',
  tasks: 'Tasks',
  phases: 'Phases',
  releases: 'Releases',
  hotfixes: 'Hotfixes',
  reports: 'Reports',
  profile: 'Profile',
  appearance: 'Appearance',
  notifications: 'Notifications',
  security: 'Security',
  telegram: 'Telegram',
  activity: 'Activity',
  guide: 'Beginner guide',
  'whats-new': "What's new",
};

/** `KIRI-12`, `KIRI-I3`, `KIRI-HF1` — a work item key rather than a section. */
const isItemKey = (segment: string) => /^[A-Z][A-Z0-9]{1,9}-(?:I|HF)?\d+$/.test(segment);

type Crumb = { label: string; href?: string };

export function Breadcrumbs() {
  const pathname = usePathname();
  const { projects } = useAuth();

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs: Crumb[] = [];
  let href = '';

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]!;
    href += `/${segment}`;
    const isLast = index === segments.length - 1;

    // A project key resolves to the project's real name.
    const previous = segments[index - 1];
    if (previous === 'projects') {
      const project = projects.find((p) => p.key === segment);
      crumbs.push({ label: project?.name ?? segment, ...(isLast ? {} : { href }) });
      continue;
    }

    if (isItemKey(segment)) {
      crumbs.push({ label: segment, ...(isLast ? {} : { href }) });
      continue;
    }

    // Opaque ids (a release, a teammate) add nothing a person can read.
    if (!SECTION_LABELS[segment] && segment.length > 16) continue;

    crumbs.push({
      label: SECTION_LABELS[segment] ?? segment.replace(/-/g, ' '),
      ...(isLast ? {} : { href }),
    });
  }

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb className="hidden min-w-0 md:block">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, index) => {
          // Narrow screens show only where you are; the ancestors would all
          // collapse to ellipses and tell you nothing.
          const isLast = index === crumbs.length - 1;
          const hideWhenTight = isLast ? '' : 'hidden lg:flex';
          return (
            <Fragment key={`${crumb.label}-${index}`}>
              {index > 0 ? <BreadcrumbSeparator className="hidden lg:block" /> : null}
              <BreadcrumbItem className={cn('min-w-0', hideWhenTight)}>
                {crumb.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href} className="truncate">
                      {crumb.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
