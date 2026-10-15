/**
 * Pages reachable without a session.
 *
 * Shared by the proxy (which decides whether to bounce a visitor to sign-in)
 * and the API client (which decides whether a 401 means "go and sign in").
 * They were separate lists, and the API client's only exempted `/login` — so a
 * signed-out visitor opening an emailed reset link or an invitation was thrown
 * straight back to sign-in by the session probe the root layout fires on every
 * page, which is exactly the set of people who cannot sign in yet.
 */
export const PUBLIC_AUTH_PATHS = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/accept-invitation',
] as const;

export const isPublicAuthPath = (pathname: string): boolean =>
  PUBLIC_AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
