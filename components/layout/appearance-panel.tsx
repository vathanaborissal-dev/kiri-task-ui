'use client';

import { Check, Monitor, Moon, Palette, RotateCcw, Sun } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
  { value: 'system', label: 'System', icon: Monitor },
] as const;

const SIDEBAR_LABELS: Record<SidebarVariant, string> = {
  sidebar: 'Flush',
  floating: 'Floating',
  inset: 'Inset',
};

const LAYOUT_LABELS: Record<ContentLayout, string> = {
  full: 'Full width',
  centered: 'Centred',
};

function SectionLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-0.5">
      <Label className="text-xs font-medium tracking-wide uppercase">{children}</Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function AppearancePanel() {
  const appearance = useAppearance();
  const [open, setOpen] = useState(false);
  const { preset, font, mode, resolvedMode, sidebarVariant, contentLayout, set, reset } = appearance;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Appearance">
              <Palette className="size-4" aria-hidden />
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent>Appearance</TooltipContent>
      </Tooltip>

      <SheetContent className="w-full gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="border-b">
          <SheetTitle>Appearance</SheetTitle>
          <SheetDescription>
            Changes apply immediately and are remembered on this device.
          </SheetDescription>
        </SheetHeader>

        {/* `min-h-0` is what makes this scroll. A flex child defaults to
            `min-height: auto`, so `flex-1` alone grew the scroller to its own
            content height: the panel overflowed the sheet, the sections below
            Typeface were unreachable and the Reset button was pushed off the
            bottom of the screen. */}
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-6 p-4">
            <section className="space-y-2.5">
              <SectionLabel>Colour mode</SectionLabel>
              <div className="grid grid-cols-3 gap-2">
                {MODES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => set({ mode: option.value })}
                    aria-pressed={mode === option.value}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-colors',
                      mode === option.value
                        ? 'border-primary bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50',
                    )}
                  >
                    <option.icon className="size-4" aria-hidden />
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            <Separator />

            <section className="space-y-2.5">
              <SectionLabel hint="Colours, corners and shadows across the whole app.">
                Theme
              </SectionLabel>
              <div className="space-y-2">
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
                        'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                        active ? 'border-primary bg-accent/60' : 'hover:bg-accent/40',
                      )}
                    >
                      <span
                        className="mt-0.5 flex size-9 shrink-0 overflow-hidden rounded-md border"
                        aria-hidden
                      >
                        {swatch.map((colour, index) => (
                          <span
                            key={index}
                            className="h-full flex-1"
                            style={{ backgroundColor: colour }}
                          />
                        ))}
                      </span>
                      <span className="min-w-0 flex-1">
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
            </section>

            <Separator />

            <section className="space-y-2.5">
              <SectionLabel hint="Each sample is rendered in the face itself.">
                Typeface
              </SectionLabel>
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
                        'rounded-lg border p-2.5 text-left transition-colors',
                        active ? 'border-primary bg-accent/60' : 'hover:bg-accent/40',
                      )}
                    >
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        {option.name}
                        {active ? <Check className="size-3.5 text-primary" aria-hidden /> : null}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                        {option.note}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <Separator />

            <section className="space-y-2.5">
              <SectionLabel>Sidebar</SectionLabel>
              <div className="grid grid-cols-3 gap-2">
                {SIDEBAR_VARIANTS.map((variant) => (
                  <button
                    key={variant}
                    type="button"
                    onClick={() => set({ sidebarVariant: variant })}
                    aria-pressed={sidebarVariant === variant}
                    className={cn(
                      'rounded-lg border p-2.5 text-xs transition-colors',
                      sidebarVariant === variant
                        ? 'border-primary bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50',
                    )}
                  >
                    {SIDEBAR_LABELS[variant]}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-2.5">
              <SectionLabel>Content width</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                {CONTENT_LAYOUTS.map((layout) => (
                  <button
                    key={layout}
                    type="button"
                    onClick={() => set({ contentLayout: layout })}
                    aria-pressed={contentLayout === layout}
                    className={cn(
                      'rounded-lg border p-2.5 text-xs transition-colors',
                      contentLayout === layout
                        ? 'border-primary bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50',
                    )}
                  >
                    {LAYOUT_LABELS[layout]}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <Button variant="outline" className="w-full gap-2" onClick={reset}>
            <RotateCcw className="size-4" aria-hidden />
            Reset to defaults
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
