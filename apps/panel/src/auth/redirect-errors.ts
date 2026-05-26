import { type AuthErrorSource } from './errors';

const AUTH_REDIRECT_ERROR_KEY = 'panel-auth-redirect-error';

export type AuthRedirectError = {
  code: string;
  message?: string;
  source: AuthErrorSource;
};

export function getAuthRedirectErrorFromSearchParams(
  searchParams: Pick<URLSearchParams, 'get'>,
  source: AuthErrorSource,
): AuthRedirectError | null {
  const rawCode = searchParams.get('error');
  const rawMessage = searchParams.get('message');

  if (!rawCode) {
    return null;
  }

  return {
    code: rawCode,
    message: rawMessage || undefined,
    source,
  };
}

export function storeAuthRedirectError(error: Omit<AuthRedirectError, 'message'> & { message?: string }) {
  sessionStorage.setItem(AUTH_REDIRECT_ERROR_KEY, JSON.stringify(error));
}

export function consumeAuthRedirectError() {
  const raw = sessionStorage.getItem(AUTH_REDIRECT_ERROR_KEY);
  sessionStorage.removeItem(AUTH_REDIRECT_ERROR_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthRedirectError;
  } catch {
    return null;
  }
}

export function clearStoredAuthRedirectError() {
  sessionStorage.removeItem(AUTH_REDIRECT_ERROR_KEY);
}

export function clearAuthRedirectErrorSearchParams() {
  const url = new URL(window.location.href);

  url.searchParams.delete('error');
  url.searchParams.delete('message');
  window.history.replaceState(null, '', url);
}
