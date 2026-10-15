'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { TOUR, routeFor, type TourStep } from '@/lib/tour';
import { useMarkSeen } from '@/lib/hooks/use-seen';
import { useAuth } from '@/providers/auth-provider';

type TourValue = {
  /** The step on screen, or null when the tour is not running. */
  step: TourStep | null;
  index: number;
  total: number;
  start: () => void;
  stop: () => void;
  next: () => void;
  back: () => void;
};

/** Long enough for the dashboard to be on screen first, short enough to feel
 *  like part of signing in rather than an interruption. */
const AUTO_START_DELAY_MS = 700;

const TourContext = createContext<TourValue | null>(null);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { canAnywhere, projects, user, isLoading } = useAuth();
  const markSeen = useMarkSeen();

  const [index, setIndex] = useState<number | null>(null);

  // The board steps need somewhere to happen. Use the first project this
  // person is actually in, and drop those steps when there is none.
  const projectKey = projects[0]?.key ?? null;

  const steps = useMemo(
    () =>
      TOUR.filter((step) => {
        if (step.permission && !canAnywhere(step.permission)) return false;
        if (step.needsProject && !projectKey) return false;
        if (step.needsNoProject && projectKey) return false;
        return true;
      }),
    [canAnywhere, projectKey],
  );

  const step = index === null ? null : (steps[index] ?? null);

  // Walking to a step may mean changing page first.
  useEffect(() => {
    if (!step) return;
    const route = routeFor(step, projectKey);
    if (route && route !== pathname) router.push(route);
  }, [step, projectKey, pathname, router]);

  const stop = useCallback(() => {
    setIndex(null);
    markSeen({ guide: true });
  }, [markSeen]);

  const next = useCallback(() => {
    setIndex((current) => {
      if (current === null) return null;
      if (current + 1 >= steps.length) return null;
      return current + 1;
    });
  }, [steps.length]);

  // Finishing the last step counts as having seen the guide.
  const finished = useRef(false);
  useEffect(() => {
    if (index === null && finished.current) {
      finished.current = false;
      markSeen({ guide: true });
    }
    if (index !== null) finished.current = true;
  }, [index, markSeen]);

  const back = useCallback(() => {
    setIndex((current) => (current === null ? null : Math.max(0, current - 1)));
  }, []);

  const start = useCallback(() => {
    const openingRoute = projectKey ? `/projects/${projectKey}` : '/dashboard';
    if (pathname !== openingRoute) router.push(openingRoute, { scroll: false });
    setIndex(0);
  }, [pathname, projectKey, router]);

  /**
   * First sign-in starts the tour on its own.
   *
   * `guideSeenAt` is set the moment somebody finishes or closes the tour, so
   * this fires once per account and then never again — the dashboard's welcome
   * card and the user menu remain the ways back in.
   */
  /**
   * First sign-in starts the tour on its own.
   *
   * `guideSeenAt` is set the moment somebody finishes or closes the tour, so
   * this fires once per account and then never again — the dashboard's welcome
   * card and the user menu remain the ways back in.
   */
  const autoStarted = useRef(false);
  const autoStartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // `start` is rebuilt when the route changes, so the scheduled call reads it
  // from a ref rather than capturing a copy that is stale by the time it fires.
  const startRef = useRef(start);
  useEffect(() => {
    startRef.current = start;
  }, [start]);

  useEffect(() => {
    if (autoStarted.current || isLoading || !user || user.guideSeenAt) return;
    // Somebody signed in on a generated password is on their way to choose a
    // real one. A tour over the top of that is noise.
    if (user.mustChangePassword) return;
    // Only from a landing page. If their first click was a deep link — a task
    // from a Telegram notification, say — they came here to read that, and
    // hijacking it into a tour would be rude.
    if (pathname !== '/dashboard' && pathname !== '/overview') return;

    // A beat after the shell paints, rather than during it: the first thing
    // somebody sees should be their workspace, with the tour arriving over it.
    autoStartTimer.current = setTimeout(() => {
      // Marked here, not at schedule time. A remount clears the pending timer,
      // and a flag set on scheduling would then refuse to set another — which
      // is exactly what happens under StrictMode's double mount, where the ref
      // survives but the timer does not.
      autoStarted.current = true;
      startRef.current();
    }, AUTO_START_DELAY_MS);

    return () => {
      if (autoStartTimer.current) clearTimeout(autoStartTimer.current);
      autoStartTimer.current = null;
    };
  }, [isLoading, user, pathname]);

  const value = useMemo<TourValue>(
    () => ({ step, index: index ?? 0, total: steps.length, start, stop, next, back }),
    [step, index, steps.length, start, stop, next, back],
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export const useTour = (): TourValue => {
  const context = useContext(TourContext);
  if (!context) throw new Error('useTour must be used inside <TourProvider>');
  return context;
};
