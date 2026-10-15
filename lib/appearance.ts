/**
 * Appearance is three independent choices — colour mode, theme preset and font —
 * each written to an attribute on <html> and read back by CSS. Nothing in the
 * component tree branches on the theme; the stylesheet does all of it.
 */

export const THEME_MODES = ['light', 'dark', 'system'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export type ThemePreset = {
  id: string;
  name: string;
  description: string;
  /** Swatch shown in the picker: [background, surface, primary, accent]. */
  swatch: { light: [string, string, string, string]; dark: [string, string, string, string] };
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Calm neutrals with an indigo accent. Built for long working days.',
    swatch: {
      light: ['#fcfdff', '#ffffff', '#5a5edd', '#eceafd'],
      dark: ['#1a1d26', '#232733', '#7f86ef', '#2f3550'],
    },
  },
  {
    id: 'neobrutalism',
    name: 'Neobrutalism',
    description: 'Hard edges, black outlines and offset shadows. Loud and legible.',
    swatch: {
      light: ['#fffdf5', '#ffffff', '#ff5a3c', '#ffe14d'],
      dark: ['#15120c', '#211c12', '#ff7a5e', '#ffd43b'],
    },
  },
  {
    id: 'soft-pop',
    name: 'Soft pop',
    description: 'Rounded, friendly and high-contrast. Good for screens people share.',
    swatch: {
      light: ['#fbf8ff', '#ffffff', '#7c3aed', '#fde68a'],
      dark: ['#171327', '#201b36', '#a78bfa', '#4a3a86'],
    },
  },
  {
    id: 'glassmorphism',
    name: 'Glass',
    description: 'Translucent panels over a soft gradient. Light, airy, modern.',
    swatch: {
      light: ['#eef2ff', '#ffffffcc', '#4f46e5', '#c7d2fe'],
      dark: ['#0d1220', '#1b2334bb', '#818cf8', '#2b3450'],
    },
  },
  {
    id: 'neumorphism',
    name: 'Neumorphism',
    description: 'Soft extruded surfaces with gentle light and shadow. Quiet and tactile.',
    swatch: {
      light: ['#eceef3', '#eceef3', '#5566d6', '#dfe3ec'],
      dark: ['#22262e', '#22262e', '#8f9bf0', '#2b303a'],
    },
  },
];

export type FontChoice = {
  id: string;
  name: string;
  /** How it reads, so people can pick without trying each one. */
  note: string;
  /** Rendered in the picker as a live sample. */
  stack: string;
};

export const FONT_CHOICES: FontChoice[] = [
  { id: 'geist', name: 'Geist', note: 'Clean and neutral — the default', stack: 'var(--font-geist)' },
  { id: 'inter', name: 'Inter', note: 'The familiar interface workhorse', stack: 'var(--font-inter)' },
  { id: 'dm-sans', name: 'DM Sans', note: 'Soft, geometric, friendly', stack: 'var(--font-dm-sans)' },
  { id: 'outfit', name: 'Outfit', note: 'Wide and confident', stack: 'var(--font-outfit)' },
  { id: 'figtree', name: 'Figtree', note: 'Rounded and approachable', stack: 'var(--font-figtree)' },
  { id: 'jakarta', name: 'Plus Jakarta', note: 'Crisp with a little character', stack: 'var(--font-jakarta)' },
  { id: 'public-sans', name: 'Public Sans', note: 'Sturdy and very readable', stack: 'var(--font-public-sans)' },
  { id: 'space-grotesk', name: 'Space Grotesk', note: 'Technical, slightly quirky', stack: 'var(--font-space-grotesk)' },
];

export const SIDEBAR_VARIANTS = ['sidebar', 'floating', 'inset'] as const;
export type SidebarVariant = (typeof SIDEBAR_VARIANTS)[number];

export const CONTENT_LAYOUTS = ['full', 'centered'] as const;
export type ContentLayout = (typeof CONTENT_LAYOUTS)[number];

export type Appearance = {
  mode: ThemeMode;
  preset: string;
  font: string;
  sidebarVariant: SidebarVariant;
  contentLayout: ContentLayout;
};

export const DEFAULT_APPEARANCE: Appearance = {
  mode: 'system',
  preset: 'default',
  font: 'geist',
  sidebarVariant: 'inset',
  contentLayout: 'full',
};

export const APPEARANCE_STORAGE_KEY = 'kiri-appearance';

/**
 * Runs before paint, inlined into the document head, so the first frame is
 * already in the right theme. Kept dependency-free and defensive: storage can
 * throw in a private window.
 */
export const appearanceBootScript = `(function(){try{
var d=document.documentElement;
var raw=localStorage.getItem('${APPEARANCE_STORAGE_KEY}');
var a=raw?JSON.parse(raw):{};
var mode=a.mode||'${DEFAULT_APPEARANCE.mode}';
var dark=mode==='dark'||(mode==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
d.classList.toggle('dark',dark);
d.style.colorScheme=dark?'dark':'light';
d.setAttribute('data-theme-mode',dark?'dark':'light');
d.setAttribute('data-theme-preset',a.preset||'${DEFAULT_APPEARANCE.preset}');
d.setAttribute('data-font',a.font||'${DEFAULT_APPEARANCE.font}');
d.setAttribute('data-sidebar-variant',a.sidebarVariant||'${DEFAULT_APPEARANCE.sidebarVariant}');
d.setAttribute('data-content-layout',a.contentLayout||'${DEFAULT_APPEARANCE.contentLayout}');
}catch(e){}})();`;
