import {
  DM_Sans,
  Figtree,
  Geist,
  Geist_Mono,
  Inter,
  JetBrains_Mono,
  Outfit,
  Plus_Jakarta_Sans,
  Public_Sans,
  Space_Grotesk,
} from 'next/font/google';

/**
 * Every selectable face is loaded once and exposed as a CSS variable; the
 * `data-font` attribute on <html> decides which one `--font-sans` points at.
 */
const geist = Geist({ variable: '--font-geist', subsets: ['latin'], display: 'swap' });
const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' });
const dmSans = DM_Sans({ variable: '--font-dm-sans', subsets: ['latin'], display: 'swap' });
const outfit = Outfit({ variable: '--font-outfit', subsets: ['latin'], display: 'swap' });
const figtree = Figtree({ variable: '--font-figtree', subsets: ['latin'], display: 'swap' });
const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  display: 'swap',
});
const publicSans = Public_Sans({
  variable: '--font-public-sans',
  subsets: ['latin'],
  display: 'swap',
});
const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'], display: 'swap' });
const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const fontVariables = [
  geist,
  inter,
  dmSans,
  outfit,
  figtree,
  jakarta,
  publicSans,
  spaceGrotesk,
  geistMono,
  jetbrainsMono,
]
  .map((font) => font.variable)
  .join(' ');
