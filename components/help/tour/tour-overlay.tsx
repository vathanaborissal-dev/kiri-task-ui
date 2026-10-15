'use client';

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Emphasis } from '@/components/help/emphasis';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import type { TourPlacement } from '@/lib/tour';
import { useTour } from '@/providers/tour-provider';
import { cn } from '@/lib/utils';

type Box = { top: number; left: number; width: number; height: number };

const CARD_WIDTH = 380;
const GAP = 14;
const MARGIN = 12;
/** A target can be a route change away; keep looking before giving up on it. */
const LOOKUP_TIMEOUT_MS = 2500;

/**
 * Scrolls a target into view.
 *
 * `scrollIntoView` is what handles nested scroll containers — the sidebar has
 * its own, and a target down in the Help group is otherwise never reached by
 * scrolling the window. `block: 'center'` is wrong for anything taller than
 * the viewport, though: it centres the middle of a long element and pushes the
 * part worth looking at off the top. The `scroll-margin-top` on `[data-tour]`
 * in globals.css keeps the result clear of the sticky top bar.
 */
const bringIntoView = (element: HTMLElement) => {
  const tall = element.getBoundingClientRect().height > window.innerHeight - 200;
  element.scrollIntoView({
    behavior: 'smooth',
    block: tall ? 'start' : 'center',
    inline: 'nearest',
  });
};

/**
 * Waits for `[data-tour="…"]` to exist and tracks where it is.
 *
 * The element may not be mounted yet (the tour just pushed a new route), may
 * move as data loads, and will move again when the window scrolls — so this
 * polls until it appears and then watches for changes.
 */
const useTargetBox = (target: string | undefined): Box | null => {
  // Keyed by target so a new step starts from nothing without having to reset
  // state in an effect — the measurement below only ever runs inside the loop.
  const [measured, setMeasured] = useState<{ target: string; box: Box } | null>(null);

  useLayoutEffect(() => {
    if (!target) return;

    let frame = 0;
    let settled = false;
    const deadline = Date.now() + LOOKUP_TIMEOUT_MS;

    const measure = () => {
      const element = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);

      if (!element) {
        // Nothing yet. Keep looking until the deadline, then show the step
        // without a spotlight rather than stalling the tour.
        if (!settled && Date.now() > deadline) settled = true;
        frame = requestAnimationFrame(measure);
        return;
      }

      if (!settled) {
        settled = true;
        bringIntoView(element);
      }

      const rect = element.getBoundingClientRect();
      setMeasured((current) => {
        const box = current?.target === target ? current.box : null;
        if (
          box &&
          Math.abs(box.top - rect.top) < 1 &&
          Math.abs(box.left - rect.left) < 1 &&
          Math.abs(box.width - rect.width) < 1 &&
          Math.abs(box.height - rect.height) < 1
        ) {
          return current;
        }
        return {
          target,
          box: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        };
      });
      frame = requestAnimationFrame(measure);
    };

    measure();
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return measured && measured.target === target ? measured.box : null;
};

/** Where the callout goes, and which way its arrow points. */
const place = (
  box: Box | null,
  placement: TourPlacement | undefined,
  viewport: { width: number; height: number },
  cardHeight: number,
): { style: React.CSSProperties; arrow: TourPlacement | null } => {
  if (!box) {
    return {
      style: {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: Math.min(CARD_WIDTH, viewport.width - MARGIN * 2),
      },
      arrow: null,
    };
  }

  const width = Math.min(CARD_WIDTH, viewport.width - MARGIN * 2);
  const clamp = (value: number, max: number) => Math.max(MARGIN, Math.min(value, max - MARGIN));

  const room = {
    right: viewport.width - (box.left + box.width),
    left: box.left,
    bottom: viewport.height - (box.top + box.height),
    top: box.top,
  };

  // Use the asked-for side when it fits, otherwise the side with most room.
  const order: TourPlacement[] = [
    ...(placement ? [placement] : []),
    'right',
    'bottom',
    'left',
    'top',
  ];
  const fits = (side: TourPlacement) =>
    side === 'right' || side === 'left'
      ? room[side] >= width + GAP + MARGIN
      : room[side] >= cardHeight + GAP + MARGIN;

  const side = order.find(fits) ?? (room.bottom >= room.top ? 'bottom' : 'top');

  if (side === 'right' || side === 'left') {
    return {
      style: {
        width,
        left: side === 'right' ? box.left + box.width + GAP : box.left - width - GAP,
        top: clamp(box.top + box.height / 2 - cardHeight / 2, viewport.height - cardHeight),
      },
      arrow: side === 'right' ? 'left' : 'right',
    };
  }

  return {
    style: {
      width,
      left: clamp(box.left + box.width / 2 - width / 2, viewport.width - width),
      top: clamp(
        side === 'bottom' ? box.top + box.height + GAP : box.top - cardHeight - GAP,
        viewport.height - cardHeight,
      ),
    },
    arrow: side === 'bottom' ? 'top' : 'bottom',
  };
};

const ARROW_POSITION: Record<TourPlacement, string> = {
  top: 'left-1/2 -top-3.5 -translate-x-1/2',
  bottom: 'left-1/2 -bottom-3.5 -translate-x-1/2',
  left: '-left-3.5 top-1/2 -translate-y-1/2',
  right: '-right-3.5 top-1/2 -translate-y-1/2',
};

export function TourOverlay() {
  const { step, index, total, next, back, stop } = useTour();
  const { isMobile, setOpenMobile } = useSidebar();

  // On a phone the sidebar is a sheet. Keep it open only while the current
  // step points into navigation, so the guide never competes with two layers
  // of UI or leaves the sheet covering the next page.
  const needsSidebar = Boolean(step?.inSidebar) && isMobile;
  const openedByTour = useRef(false);
  useEffect(() => {
    if (!isMobile) return;

    if (needsSidebar) {
      setOpenMobile(true);
      openedByTour.current = true;
      return;
    }

    if (step || openedByTour.current) {
      setOpenMobile(false);
      openedByTour.current = false;
    }
  }, [step, needsSidebar, isMobile, setOpenMobile]);

  const box = useTargetBox(step?.target);
  const [card, setCard] = useState<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  // false while server-rendering and on the hydration pass, true afterwards —
  // `document.body` has to exist before anything can be portalled into it.
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  useEffect(() => {
    const read = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, []);

  // Arrow keys and Esc, because a tour you cannot leave is a trap.
  //
  // Captured and swallowed: these keys must not also reach the page behind the
  // overlay, where an arrow press can quietly change whatever select, menu or
  // slider happens to hold focus. Anything the person is actually typing into
  // is left alone.
  useEffect(() => {
    if (!step) return;

    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.closest(
          'input, textarea, select, [contenteditable="true"], [role="menu"], [role="listbox"], [role="combobox"], [role="dialog"]:not([aria-modal="false"])',
        )
      ) {
        return;
      }

      const handled =
        event.key === 'Escape' ||
        event.key === 'Enter' ||
        event.key === 'ArrowRight' ||
        event.key === 'ArrowLeft';
      if (!handled) return;

      event.preventDefault();
      event.stopPropagation();

      if (event.key === 'Escape') stop();
      else if (event.key === 'ArrowLeft') back();
      else next();
    };

    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [step, next, back, stop]);

  if (!mounted || !step || viewport.width === 0) return null;

  const cardHeight = card?.offsetHeight ?? 210;
  const { style, arrow } = place(box, step.placement, viewport, cardHeight);
  const last = index + 1 >= total;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-100" role="dialog" aria-modal="false">
      {/* The dim is one huge shadow cast outwards from the hole, so the target
          stays fully lit and nothing has to be re-rendered to cut it out. */}
      {box ? (
        <div
          // No CSS transition: the position is recomputed every frame while the
          // page scrolls, and a transition would leave the dim trailing behind
          // the thing it is meant to be framing.
          className="pointer-events-none absolute rounded-xl ring-2 ring-primary outline-4 outline-primary/15"
          style={{
            top: box.top - 6,
            left: box.left - 6,
            width: box.width + 12,
            height: box.height + 12,
            boxShadow: '0 0 0 9999px rgb(0 0 0 / 0.55)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/55" />
      )}

      <div
        ref={setCard}
        className="pointer-events-auto absolute rounded-2xl border bg-popover p-4 text-popover-foreground shadow-xl ring-1 ring-foreground/5"
        style={style}
      >
        {arrow ? (
          <span
            aria-hidden
            className={cn(
              'absolute z-10 grid size-7 place-items-center rounded-full border bg-popover text-primary shadow-md',
              ARROW_POSITION[arrow],
            )}
          >
            {arrow === 'top' ? <ArrowUp className="size-4" /> : null}
            {arrow === 'bottom' ? <ArrowDown className="size-4" /> : null}
            {arrow === 'left' ? <ArrowLeft className="size-4" /> : null}
            {arrow === 'right' ? <ArrowRight className="size-4" /> : null}
          </span>
        ) : null}

        <div className="absolute inset-x-4 top-0 h-0.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>

        <div className="mb-3 flex items-start gap-2 pt-1.5">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2 text-xs">
              <span className="font-medium text-primary">{step.section ?? 'Quick tour'}</span>
              <span className="text-muted-foreground" aria-label={`Step ${index + 1} of ${total}`}>
                {index + 1}/{total}
              </span>
            </div>
            <h2 className="text-base font-semibold leading-snug">{step.title}</h2>
          </div>
          <button
            type="button"
            onClick={stop}
            aria-label="Close the tour"
            className="-mt-1 -mr-1 shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          <Emphasis>{step.body}</Emphasis>
        </p>
        {step.items ? (
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg border bg-muted/35 p-3">
            {step.items.map((item) => (
              <div key={item.label} className="min-w-0">
                <dt
                  className={cn(
                    'truncate text-xs font-medium text-foreground',
                    item.label.startsWith('/') && 'font-mono',
                  )}
                >
                  {item.label}
                </dt>
                <dd className="truncate text-[11px] text-muted-foreground">{item.description}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {step.action ? (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
            <ArrowRight className="size-3.5 shrink-0" aria-hidden />
            <p>{step.action}</p>
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-end gap-1.5">
          <Button variant="ghost" size="sm" onClick={stop}>
            Skip
          </Button>
          {index > 0 ? (
            <Button variant="outline" size="sm" className="gap-1" onClick={back}>
              <ArrowLeft className="size-3.5" aria-hidden />
              Back
            </Button>
          ) : null}
          <Button size="sm" className="gap-1" onClick={next}>
            {last ? 'Done' : 'Next'}
            {last ? null : <ArrowRight className="size-3.5" aria-hidden />}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
