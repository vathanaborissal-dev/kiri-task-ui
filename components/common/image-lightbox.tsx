'use client';

import {
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { IconButton } from '@/components/common/icon-button';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/format';
import { cn } from '@/lib/utils';

export type LightboxImage = {
  id: string;
  url: string;
  filename: string;
  bytes?: number;
  width?: number | null;
  height?: number | null;
};

/** Zoom stops, so the buttons step through recognisable sizes. */
const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8] as const;
const MIN_ZOOM = ZOOM_STEPS[0];
const MAX_ZOOM = ZOOM_STEPS[ZOOM_STEPS.length - 1];

const stepUp = (zoom: number) => ZOOM_STEPS.find((step) => step > zoom + 0.001) ?? MAX_ZOOM;
const stepDown = (zoom: number) =>
  [...ZOOM_STEPS].reverse().find((step) => step < zoom - 0.001) ?? MIN_ZOOM;

/**
 * A full-screen image viewer with zoom and pan.
 *
 * Deliberately not built on `DialogContent`: that primitive is capped at
 * `sm:max-w-sm`, which is why the old preview opened a screenshot in a 24rem
 * box on a desktop and gave no way to look closer. This renders its own
 * full-viewport surface instead, and the image is the only thing in it.
 *
 * The open image is derived from `openId` rather than mirrored into state, and
 * the zoom lives in `Stage`, which is keyed by image id — so moving to the next
 * picture remounts a freshly fitted view without an effect to reset it.
 */
export function ImageLightbox({
  images,
  openId,
  onOpenChange,
}: {
  images: LightboxImage[];
  /** The image to show, or `null` when the viewer is closed. */
  openId: string | null;
  onOpenChange: (openId: string | null) => void;
}) {
  const index = images.findIndex((image) => image.id === openId);
  const image = index >= 0 ? images[index] : undefined;

  const go = useCallback(
    (delta: number) => {
      if (images.length < 2 || index < 0) return;
      const next = (index + delta + images.length) % images.length;
      onOpenChange(images[next]!.id);
    },
    [images, index, onOpenChange],
  );

  useEffect(() => {
    if (!image) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        go(1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        go(-1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [image, go]);

  if (!image) return null;

  return (
    <DialogPrimitive.Root open onOpenChange={(next) => !next && onOpenChange(null)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex flex-col outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
          // The viewer owns the arrow keys for navigation, so Radix must not
          // also use them to move focus between the toolbar buttons.
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DialogPrimitive.Title className="sr-only">{image.filename}</DialogPrimitive.Title>

          <Stage
            key={image.id}
            image={image}
            position={index + 1}
            total={images.length}
            onNext={() => go(1)}
            onPrevious={() => go(-1)}
          />

          {images.length > 1 ? (
            <div className="flex shrink-0 gap-1.5 overflow-x-auto bg-black/40 px-3 py-2">
              {images.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onOpenChange(entry.id)}
                  aria-current={entry.id === image.id}
                  aria-label={entry.filename}
                  className={cn(
                    'size-12 shrink-0 overflow-hidden rounded border-2 transition-colors',
                    entry.id === image.id
                      ? 'border-white'
                      : 'border-transparent opacity-60 hover:opacity-100',
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={entry.url} alt="" loading="lazy" className="size-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}

          <p className="shrink-0 bg-black/40 px-3 pb-2 text-center text-[11px] text-white/45">
            Scroll to zoom · drag to pan · double-click to zoom · ← → to browse · 0 to fit · Esc to
            close
          </p>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * One image, with its own zoom and pan.
 *
 * Keyed by image id from the parent, so each picture gets a fresh, fitted view
 * and there is nothing to reset when the selection changes.
 */
function Stage({
  image,
  position,
  total,
  onNext,
  onPrevious,
}: {
  image: LightboxImage;
  position: number;
  total: number;
  onNext: () => void;
  onPrevious: () => void;
}) {
  /**
   * `fitted` is a third state alongside the zoom number: it means "as large as
   * the viewport allows", which is not the same as 100% and is what Fit and the
   * `0` key return to.
   */
  const [fitted, setFitted] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragOrigin = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);

  const fit = useCallback(() => {
    setFitted(true);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const zoomTo = useCallback((value: number) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
    setFitted(false);
    setZoom(clamped);
    // At the smallest size there is nothing to pan to, so recentre rather than
    // leaving the image parked off to one side.
    if (clamped <= MIN_ZOOM) setOffset({ x: 0, y: 0 });
  }, []);

  const scale = fitted ? 1 : zoom;
  const canPan = !fitted && zoom > 1;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        zoomTo(stepUp(scale));
      } else if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        zoomTo(stepDown(scale));
      } else if (event.key === '0') {
        event.preventDefault();
        fit();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [scale, zoomTo, fit]);

  return (
    <>
      {/* --- Toolbar --------------------------------------------------- */}
      <div className="flex shrink-0 items-center gap-2 bg-black/40 px-3 py-2 text-white">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{image.filename}</p>
          <p className="text-[11px] text-white/60">
            {[
              total > 1 ? `${position} of ${total}` : null,
              naturalSize ? `${naturalSize.width}×${naturalSize.height}` : null,
              image.bytes ? formatBytes(image.bytes) : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <IconButton
            variant="ghost"
            className="text-white hover:bg-white/15 hover:text-white"
            onClick={() => zoomTo(stepDown(scale))}
            disabled={!fitted && zoom <= MIN_ZOOM}
            label="Zoom out"
          >
            <Minus className="size-4" aria-hidden />
          </IconButton>
          <button
            type="button"
            onClick={fit}
            className="min-w-14 rounded-md px-1.5 py-1 text-xs tabular-nums text-white/90 transition-colors hover:bg-white/15"
            aria-label={`Zoom ${fitted ? 'fitted to the window' : `${Math.round(zoom * 100)} percent`} — click to fit`}
          >
            {fitted ? 'Fit' : `${Math.round(zoom * 100)}%`}
          </button>
          <IconButton
            variant="ghost"
            className="text-white hover:bg-white/15 hover:text-white"
            onClick={() => zoomTo(stepUp(scale))}
            disabled={!fitted && zoom >= MAX_ZOOM}
            label="Zoom in"
          >
            <Plus className="size-4" aria-hidden />
          </IconButton>
          <IconButton
            variant="ghost"
            className="text-white hover:bg-white/15 hover:text-white"
            onClick={() => zoomTo(1)}
            label="Actual size"
          >
            <Maximize2 className="size-4" aria-hidden />
          </IconButton>
          <IconButton
            variant="ghost"
            className="text-white hover:bg-white/15 hover:text-white"
            onClick={fit}
            label="Fit to window"
          >
            <RotateCcw className="size-4" aria-hidden />
          </IconButton>

          <span className="mx-1 h-5 w-px bg-white/20" aria-hidden />

          <Button
            asChild
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/15 hover:text-white"
          >
            <a
              href={image.url}
              target="_blank"
              rel="noopener noreferrer"
              download={image.filename}
              aria-label={`Download ${image.filename}`}
            >
              <Download className="size-4" aria-hidden />
            </a>
          </Button>
          <DialogPrimitive.Close asChild>
            <IconButton
              variant="ghost"
              className="text-white hover:bg-white/15 hover:text-white"
              label="Close"
            >
              <X className="size-4" aria-hidden />
            </IconButton>
          </DialogPrimitive.Close>
        </div>
      </div>

      {/* --- The image ------------------------------------------------- */}
      <div
        className={cn(
          'relative flex min-h-0 flex-1 items-center justify-center overflow-hidden',
          canPan ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in',
        )}
        onWheel={(event) => {
          event.preventDefault();
          const factor = event.ctrlKey || event.metaKey ? 1.15 : 1.08;
          zoomTo(event.deltaY < 0 ? scale * factor : scale / factor);
        }}
        onDoubleClick={() => (fitted || zoom < 2 ? zoomTo(2) : fit())}
        onPointerDown={(event) => {
          if (!canPan) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          dragOrigin.current = {
            x: event.clientX,
            y: event.clientY,
            offsetX: offset.x,
            offsetY: offset.y,
          };
          setDragging(true);
        }}
        onPointerMove={(event) => {
          const origin = dragOrigin.current;
          if (!origin) return;
          setOffset({
            x: origin.offsetX + (event.clientX - origin.x),
            y: origin.offsetY + (event.clientY - origin.y),
          });
        }}
        onPointerUp={(event) => {
          dragOrigin.current = null;
          setDragging(false);
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          dragOrigin.current = null;
          setDragging(false);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.filename}
          draggable={false}
          onLoad={(event) =>
            setNaturalSize({
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            })
          }
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            // Snapping back to fit should glide; dragging must not lag behind
            // the pointer.
            transition: dragging ? 'none' : 'transform 120ms ease-out',
          }}
          className={cn(
            'max-h-full max-w-full origin-center select-none object-contain',
            // Enlarged screenshots and pixel art read better crisp than blurred.
            scale >= 2 && '[image-rendering:pixelated]',
          )}
        />

        {total > 1 ? (
          <>
            <IconButton
              variant="ghost"
              className="absolute top-1/2 left-2 size-10 -translate-y-1/2 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
              onClick={onPrevious}
              label="Previous image"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </IconButton>
            <IconButton
              variant="ghost"
              className="absolute top-1/2 right-2 size-10 -translate-y-1/2 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
              onClick={onNext}
              label="Next image"
            >
              <ChevronRight className="size-5" aria-hidden />
            </IconButton>
          </>
        ) : null}
      </div>
    </>
  );
}
