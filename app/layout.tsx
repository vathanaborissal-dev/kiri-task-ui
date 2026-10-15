import type { Metadata, Viewport } from 'next';
import { AppProviders } from '@/providers';
import { appearanceBootScript } from '@/lib/appearance';
import { fontVariables } from '@/lib/fonts';
import './globals.css';

const description =
  'Project and task management for development teams: tasks, phases, releases, issues and hotfixes in one place.';

const deploymentUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3100');

export const metadata: Metadata = {
  metadataBase: new URL(deploymentUrl),
  title: {
    default: 'Kiri Task',
    template: '%s · Kiri Task',
  },
  description,
  applicationName: 'Kiri Task',
  openGraph: {
    title: 'Kiri Task',
    description,
    type: 'website',
    siteName: 'Kiri Task',
    images: [
      {
        url: '/banner.png',
        width: 1672,
        height: 941,
        alt: 'Kiri Task: simple task management for your team',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kiri Task',
    description,
    images: [
      {
        url: '/banner.png',
        alt: 'Kiri Task: simple task management for your team',
      },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#101014' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme-mode="light"
      data-theme-preset="default"
      data-font="geist"
      data-sidebar-variant="inset"
      data-content-layout="full"
      className={`${fontVariables} h-full antialiased`}
    >
      <head>
        {/* Applies the stored appearance before first paint — no flash of the
            wrong theme, no hydration mismatch. */}
        <script dangerouslySetInnerHTML={{ __html: appearanceBootScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
