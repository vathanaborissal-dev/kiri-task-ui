const DICEBEAR_BASE = 'https://api.dicebear.com/10.x/micah/svg';

/** Soft background pairs, picked deterministically so a person keeps one look. */
const BACKGROUNDS: [string, string][] = [
  ['c7d2fe', 'e0e7ff'],
  ['bfdbfe', 'dbeafe'],
  ['bbf7d0', 'dcfce7'],
  ['fde68a', 'fef3c7'],
  ['fbcfe8', 'fce7f3'],
  ['ddd6fe', 'ede9fe'],
  ['a5f3fc', 'cffafe'],
  ['fed7aa', 'ffedd5'],
];

const hash = (value: string): number => {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) % 100003;
  return h;
};

/**
 * A stable, generated avatar for anyone who has not uploaded one.
 *
 * The seed is the user id, so a person looks the same everywhere and never
 * changes face when they are renamed. DiceBear wants repeated query keys for
 * multi-value options — a comma-joined list is rejected — hence the manual
 * string building rather than URLSearchParams.
 */
export const generatedAvatarUrl = (seed: string): string => {
  const [from, to] = BACKGROUNDS[hash(seed) % BACKGROUNDS.length]!;
  return (
    `${DICEBEAR_BASE}?seed=${encodeURIComponent(seed)}` +
    '&radius=50' +
    '&backgroundType=gradientLinear' +
    `&backgroundColor=${from}&backgroundColor=${to}`
  );
};

export const avatarUrlFor = (user: { id: string; avatarUrl?: string | null }): string =>
  user.avatarUrl ?? generatedAvatarUrl(user.id);
