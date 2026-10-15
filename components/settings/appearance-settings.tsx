'use client';

import { Check, Monitor, Moon, RotateCcw, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  CONTENT_LAYOUTS,
  FONT_CHOICES,
  SIDEBAR_VARIANTS,
  THEME_PRESETS,
  type ContentLayout,
  type SidebarVariant,
} from '@/lib/appearance';
import { useAppearance } from '@/providers/appearance-provider';
import { cn } from '@/lib/utils';

const MODES = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'Match system', icon: Monitor },
] as const;

const SIDEBAR_LABELS: Record<SidebarVariant, { label: string; hint: string }> = {
  sidebar: { label: 'Flush', hint: 'Edge to edge, no gap' },
  floating: { label: 'Floating', hint: 'Detached card with a shadow' },
  inset: { label: 'Inset', hint: 'Content sits in a rounded panel' },
};

const LAYOUT_LABELS: Record<ContentLayout, { label: string; hint: string }> = {
  full: { label: 'Full width', hint: 'Use the whole screen' },
  centered: { label: 'Centred', hint: 'Cap the width on wide displays' },
};

export function AppearanceSettings() {
  const { mode, preset, font, sidebarVariant, contentLayout, resolvedMode, set, reset } =
    useAppearance();

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Colour mode</CardTitle>
          <CardDescription>
            Saved on this device, so your phone and your desk can differ.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-3">
            {MODES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => set({ mode: option.value })}
                aria-pressed={mode === option.value}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg border p-3 text-sm transition-colors',
                  mode === option.value
                    ? 'border-primary bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50',
                )}
              >
                <option.icon className="size-4 shrink-0" aria-hidden />
                {option.label}
                {mode === option.value ? (
                  <Check className="ml-auto size-4 text-primary" aria-hidden />
                ) : null}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Theme</CardTitle>
          <CardDescription>
            Each theme changes colours, corner radius and shadows across the whole app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {THEME_PRESETS.map((option) => {
              const swatch = option.swatch[resolvedMode];
              const active = preset === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => set({ preset: option.id })}
                  aria-pressed={active}
                  className={cn(
                    'overflow-hidden rounded-xl border text-left transition-colors',
                    active ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/40',
                  )}
                >
                  {/* A miniature of the shell, painted in the theme's own colours. */}
                  <span
                    className="flex h-20 gap-1.5 p-2"
                    style={{ backgroundColor: swatch[0] }}
                    aria-hidden
                  >
                    <span
                      className="h-full w-6 shrink-0 rounded"
                      style={{ backgroundColor: swatch[3] }}
                    />
                    <span className="flex flex-1 flex-col gap-1.5">
                      <span
                        className="h-5 w-full rounded"
                        style={{ backgroundColor: swatch[1] }}
                      />
                      <span className="flex flex-1 gap-1.5">
                        <span
                          className="h-full flex-1 rounded"
                          style={{ backgroundColor: swatch[1] }}
                        />
                        <span
                          className="h-full w-8 rounded"
                          style={{ backgroundColor: swatch[2] }}
                        />
                      </span>
                    </span>
                  </span>
                  <span className="block border-t p-3">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      {option.name}
                      {active ? <Check className="size-3.5 text-primary" aria-hidden /> : null}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Typeface</CardTitle>
          <CardDescription>Every sample below is set in the face it names.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {FONT_CHOICES.map((option) => {
              const active = font === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => set({ font: option.id })}
                  aria-pressed={active}
                  style={{ fontFamily: option.stack }}
                  className={cn(
                    'rounded-lg border p-3 text-left transition-colors',
                    active ? 'border-primary bg-accent/50' : 'hover:bg-accent/40',
                  )}
                >
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    {option.name}
                    {active ? <Check className="size-3.5 text-primary" aria-hidden /> : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{option.note}</span>
                  <span className="mt-2 block truncate text-base">
                    Ship KIRI-42 to Production
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Layout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs tracking-wide uppercase">Sidebar</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {SIDEBAR_VARIANTS.map((variant) => (
                <button
                  key={variant}
                  type="button"
                  onClick={() => set({ sidebarVariant: variant })}
                  aria-pressed={sidebarVariant === variant}
                  className={cn(
                    'rounded-lg border p-3 text-left text-sm transition-colors',
                    sidebarVariant === variant
                      ? 'border-primary bg-accent/50'
                      : 'hover:bg-accent/40',
                  )}
                >
                  {SIDEBAR_LABELS[variant].label}
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {SIDEBAR_LABELS[variant].hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs tracking-wide uppercase">Content width</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {CONTENT_LAYOUTS.map((layout) => (
                <button
                  key={layout}
                  type="button"
                  onClick={() => set({ contentLayout: layout })}
                  aria-pressed={contentLayout === layout}
                  className={cn(
                    'rounded-lg border p-3 text-left text-sm transition-colors',
                    contentLayout === layout ? 'border-primary bg-accent/50' : 'hover:bg-accent/40',
                  )}
                >
                  {LAYOUT_LABELS[layout].label}
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {LAYOUT_LABELS[layout].hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Button variant="outline" className="gap-2" onClick={reset}>
            <RotateCcw className="size-4" aria-hidden />
            Reset appearance
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
