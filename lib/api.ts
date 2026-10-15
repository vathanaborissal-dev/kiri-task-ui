import { isPublicAuthPath } from './auth-routes';

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4100/api').replace(
  /\/$/,
  '',
);

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Field-level messages from the API's zod validation errors. */
  get fieldErrors(): Record<string, string> {
    if (!Array.isArray(this.details)) return {};
    const out: Record<string, string> = {};
    for (const item of this.details as { path?: string; message?: string }[]) {
      if (item?.path && item.message && !out[item.path]) out[item.path] = item.message;
    }
    return out;
  }
}

const readCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
};

const csrfHeaders = (): Record<string, string> => {
  const csrf = readCookie('kiri_csrf');
  return csrf ? { 'x-csrf-token': csrf } : {};
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  formData?: FormData;
  signal?: AbortSignal;
  /** Skip the automatic refresh-and-retry (used by the refresh call itself). */
  skipRefresh?: boolean;
};

let refreshPromise: Promise<boolean> | null = null;

/** Single-flight refresh so a burst of 401s only rotates the token once. */
const refreshSession = (): Promise<boolean> => {
  refreshPromise ??= fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    // Refresh itself is not CSRF-gated (see auth.routes.ts), but sending the
    // header costs nothing and keeps every call in this client consistent.
    headers: csrfHeaders(),
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      // Let the next 401 start a fresh attempt.
      setTimeout(() => {
        refreshPromise = null;
      }, 0);
    });
  return refreshPromise;
};

/**
 * The API refuses the app until a generated password has been replaced. Send
 * them to the one page that can fix it rather than surfacing a bare 403 on
 * whatever they happened to open.
 */
const onPasswordChangeRequired = () => {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/settings/security')) return;
  window.location.href = '/settings/security?first=1';
};

const onUnauthorized = () => {
  if (typeof window === 'undefined') return;
  const { pathname, search } = window.location;
  // Every page mounts the session probe, including the pages for people who do
  // not have a session yet. Bouncing them to sign-in there is a dead end.
  if (isPublicAuthPath(pathname)) return;
  const next = encodeURIComponent(`${pathname}${search}`);
  window.location.href = `/login?next=${next}`;
};

const send = async (path: string, options: RequestOptions): Promise<Response> => {
  const headers: Record<string, string> = {};
  if (!options.formData) headers['content-type'] = 'application/json';

  Object.assign(headers, csrfHeaders());

  return fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers,
    ...(options.formData
      ? { body: options.formData }
      : options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
    ...(options.signal ? { signal: options.signal } : {}),
  });
};

export const api = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  let response: Response;
  try {
    response = await send(path, options);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Is the API running?');
  }

  if (response.status === 401 && !options.skipRefresh) {
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await send(path, options);
    } else {
      onUnauthorized();
    }
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const error = (payload as { error?: { code?: string; message?: string; details?: unknown } })
      ?.error;
    if (response.status === 403 && error?.code === 'PASSWORD_CHANGE_REQUIRED') {
      onPasswordChangeRequired();
    }
    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN',
      error?.message ?? `Request failed (${response.status})`,
      error?.details,
    );
  }

  return payload as T;
};

/** Builds a query string, dropping empty values and expanding arrays. */
export const qs = (params: Record<string, unknown>): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      search.set(key, value.join(','));
    } else if (typeof value === 'boolean') {
      search.set(key, value ? 'true' : 'false');
    } else {
      search.set(key, String(value));
    }
  }
  const str = search.toString();
  return str ? `?${str}` : '';
};
