import type { ApiError } from './api';

export type ProblemDetails = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: string;
  traceId?: string;
};

export type ValidationProblemDetails = ProblemDetails & {
  code: 'ValidationError';
  errors: Record<string, string[]>;
};

export function getProblemDetails(error: ApiError<ProblemDetails> | null | undefined) {
  return error?.response?.data;
}

export function isValidationProblemDetails(
  problem: ProblemDetails | null | undefined,
): problem is ValidationProblemDetails {
  return problem?.status === 400 && problem.code === 'ValidationError' && hasErrors(problem);
}

export function getValidationFieldErrors(problem: ValidationProblemDetails) {
  return Object.fromEntries(
    Object.entries(problem.errors).flatMap(([field, messages]) => {
      const message = messages[0];

      return message ? [[toCamelCaseFieldName(field), message]] : [];
    }),
  );
}

export function getProblemMessage(
  problem: ProblemDetails | null | undefined,
  fallback = 'Something went wrong. Please try again.',
) {
  if (problem?.status && problem.status >= 500) {
    return fallback;
  }

  return problem?.detail || problem?.title || fallback;
}

function hasErrors(problem: ProblemDetails): problem is ProblemDetails & { errors: unknown } {
  return 'errors' in problem && typeof problem.errors === 'object' && problem.errors !== null;
}

function toCamelCaseFieldName(field: string) {
  return field ? `${field[0].toLowerCase()}${field.slice(1)}` : field;
}
