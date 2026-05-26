'use client';

import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { type JSX, type SyntheticEvent, useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@repo/ui';
import {
  API_ROOT,
  getProblemDetails,
  getValidationFieldErrors,
  isValidationProblemDetails,
  useApiPost,
  type ApiError,
} from '@repo/shared';

import { useRouter } from '@/i18n/navigation';
import { getAccessClaims } from '@/auth/claims';
import { getApiAuthErrorMessage, type AuthProblemDetails } from '@/auth/errors';
import {
  clearAuthRedirectErrorSearchParams,
  consumeAuthRedirectError,
  getAuthRedirectErrorFromSearchParams,
  type AuthRedirectError,
} from '@/auth/redirect-errors';
import { extractAuthTokens } from '@/auth/tokens';
import { getDefaultPanelRoute } from '@/config/panel-routes';
import { useAuthStore } from '@/stores/auth-store';
import type { PanelAuthResponse } from '@/types/auth';

const PANEL_AUTH_PATH = '/panel/auth';

type LoginFormProps = {
  labels: {
    email: string;
    login: string;
    password: string;
    withGoogle: string;
  };
};

export function LoginForm({ labels }: LoginFormProps): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const [redirectError, setRedirectError] = useState<AuthRedirectError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isGoogleRedirecting, setIsGoogleRedirecting] = useState(false);
  const login = useApiPost<
    PanelAuthResponse,
    { email: string; password: string },
    AuthProblemDetails
  >({
    url: `${PANEL_AUTH_PATH}/login`,
    onSuccess: (response) => {
      const tokens = extractAuthTokens(response);
      setSession({ tokens, user: response.user });
      router.push(getDefaultPanelRoute(getAccessClaims(tokens.accessToken)) ?? '/login');
    },
    onError: (error) => {
      const problem = getProblemDetails(error);

      if (isValidationProblemDetails(problem)) {
        setFieldErrors(getValidationFieldErrors(problem));
        return;
      }

      setFieldErrors({});
    },
  });

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    event.preventDefault();

    if (isGoogleRedirecting) {
      return;
    }

    setFieldErrors({});
    setRedirectError(null);

    const formData = new FormData(event.currentTarget);

    login.mutate({
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
    });
  };

  const handleGoogleLogin = () => {
    if (login.isPending || isGoogleRedirecting) {
      return;
    }

    setIsGoogleRedirecting(true);
    const returnUrl = `${window.location.origin}${window.location.pathname.replace(/\/login$/, '/auth/google/callback')}`;

    window.location.href = `${API_ROOT}/v1${PANEL_AUTH_PATH}/external/google?returnUrl=${encodeURIComponent(returnUrl)}`;
  };

  useEffect(() => {
    const queryError = getAuthRedirectErrorFromSearchParams(searchParams, 'external');

    if (queryError) {
      setRedirectError(queryError);
      clearAuthRedirectErrorSearchParams();
      return;
    }

    const storedError = consumeAuthRedirectError();

    if (storedError) {
      setRedirectError(storedError);
    }
  }, [searchParams]);

  const error = login.error as ApiError<AuthProblemDetails> | null;
  const errorMessage = login.isError
    ? getApiAuthErrorMessage(error, 'email')
    : redirectError
      ? redirectError.message
      : null;
  const isBusy = login.isPending || isGoogleRedirecting;

  return (
    <Card className="w-full max-w-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <CardHeader>
          <CardTitle>{labels.login}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            {errorMessage ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="email">{labels.email}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="email@example.com"
                aria-invalid={Boolean(fieldErrors.email)}
                required
              />
              {fieldErrors.email ? <FieldError message={fieldErrors.email} /> : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{labels.password}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                aria-invalid={Boolean(fieldErrors.password)}
                required
              />
              {fieldErrors.password ? <FieldError message={fieldErrors.password} /> : null}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isBusy}>
            {labels.login}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isBusy}
            onClick={handleGoogleLogin}
          >
            <Image src="/google.svg" alt="" width={16} height={16} aria-hidden="true" />
            {labels.withGoogle}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="text-sm text-destructive">{message}</p>;
}
