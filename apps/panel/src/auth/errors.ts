import {
  getProblemDetails,
  getProblemMessage,
  isValidationProblemDetails,
  type ApiError,
  type ProblemDetails,
  type ValidationProblemDetails,
} from '@repo/shared';

export type AuthErrorSource = 'external' | 'login';

export type AuthProblemCode =
  | 'BrandOwnerRequired'
  | 'EmailNotVerified'
  | 'InvalidCreds'
  | 'InvalidExternalLogin'
  | 'UserBlocked'
  | 'UserLockedOut';

export type AuthProblemDetails = ProblemDetails & {
  code?: AuthProblemCode | string;
};

const fallbackMessages: Record<AuthProblemCode, Record<AuthErrorSource, string>> = {
  InvalidCreds: {
    external: 'Google sign-in failed. Please try again.',
    login: 'Invalid email or password.',
  },
  InvalidExternalLogin: {
    external: 'Google sign-in failed. Please try again.',
    login: 'Invalid email or password.',
  },
  UserBlocked: {
    external: 'Your account is blocked.',
    login: 'Your account is blocked.',
  },
  UserLockedOut: {
    external: 'Your account is temporarily locked. Please try again later.',
    login: 'Your account is temporarily locked. Please try again later.',
  },
  EmailNotVerified: {
    external: 'Your email is not verified.',
    login: 'Your email is not verified.',
  },
  BrandOwnerRequired: {
    external: 'This account does not own a brand.',
    login: 'This account does not own a brand.',
  },
};

export function getApiAuthErrorMessage(
  error: ApiError<AuthProblemDetails | ValidationProblemDetails> | null,
  fieldName?: string,
) {
  const problem = getProblemDetails(error);

  if (isValidationProblemDetails(problem) && fieldName) {
    return problem.errors?.[fieldName]?.[0] ?? getProblemMessage(problem);
  }

  return getAuthProblemMessage(problem, 'login');
}

export function getAuthProblemMessage(
  problem: AuthProblemDetails | ProblemDetails | null | undefined,
  source: AuthErrorSource,
) {
  if (!problem) {
    return fallbackMessages.InvalidExternalLogin[source];
  }

  if (problem.detail) {
    return problem.detail;
  }

  const code = problem.code;

  if (isAuthProblemCode(code)) {
    return fallbackMessages[code][source];
  }

  return getProblemMessage(problem) ?? fallbackMessages.InvalidExternalLogin[source];
}

export function isAuthProblemCode(code: unknown): code is AuthProblemCode {
  return typeof code === 'string' && code in fallbackMessages;
}
