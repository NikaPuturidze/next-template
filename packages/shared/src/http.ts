import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type CreateAxiosDefaults,
  type InternalAxiosRequestConfig,
} from 'axios';

const DEFAULT_TIMEOUT_MS = 30_000;
export const API_ROOT = process.env.NEXT_PUBLIC_API_ROOT ?? 'http://localhost:5122/api';

type ApiVersion = `v${number}`;
type AxiosInstanceConfig = Omit<CreateAxiosDefaults, 'baseURL'>;
type AuthTokens = {
  accessToken: string | null;
  accessTokenExpiresAt?: string | null;
  refreshToken: string | null;
  refreshTokenExpiresAt?: string | null;
};

type RefreshedAuthTokens = {
  accessToken: string;
  accessTokenExpiresAt: string | null;
  refreshToken: string;
  refreshTokenExpiresAt: string | null;
};

type RefreshResponse = {
  accessToken?: string;
  accessTokenExpiresAt?: string;
  refreshToken?: string;
  refreshTokenExpiresAt?: string;
};

type AxiosAuthConfig = {
  clearTokens: () => void;
  getTokens: () => AuthTokens;
  loginPath?: string;
  setTokens: (tokens: RefreshedAuthTokens) => void;
};

type RetryRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const defaultAxiosConfig: AxiosInstanceConfig = {
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: DEFAULT_TIMEOUT_MS,
  withCredentials: false,
};

let authConfig: AxiosAuthConfig | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  reject: (reason?: unknown) => void;
  resolve: (token: string) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error || !token) {
      reject(error);
      return;
    }

    resolve(token);
  });
  failedQueue = [];
};

export const createAxiosInstance = (
  version: ApiVersion = 'v1',
  config?: AxiosInstanceConfig,
): AxiosInstance => {
  const instance = axios.create({
    ...defaultAxiosConfig,
    ...config,
    baseURL: `${API_ROOT}/${version}`,
    headers: {
      ...defaultAxiosConfig.headers,
      ...config?.headers,
    },
  });

  instance.interceptors.request.use((request) => attachAccessToken(request));
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => handleAuthError(error, instance, version),
  );

  return instance;
};

export const axiosInstance = createAxiosInstance('v1');

export default axiosInstance;

export function configureAxiosAuth(config: AxiosAuthConfig) {
  authConfig = config;
}

function attachAccessToken(config: InternalAxiosRequestConfig) {
  const accessToken = authConfig?.getTokens().accessToken;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.headers.delete('Content-Type');
  }

  return config;
}

async function handleAuthError(
  error: AxiosError,
  instance: AxiosInstance,
  version: ApiVersion,
): Promise<AxiosResponse> {
  const originalRequest = error.config as RetryRequestConfig | undefined;

  if (!authConfig || error.response?.status !== 401 || !originalRequest || originalRequest._retry || isLoginPage(authConfig.loginPath)) {
    return Promise.reject(error);
  }

  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    }).then((token) => {
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return instance(originalRequest);
    });
  }

  const tokens = authConfig.getTokens();

  if (!tokens.refreshToken) {
    authConfig.clearTokens();
    return Promise.reject(error);
  }

  originalRequest._retry = true;
  isRefreshing = true;

  try {
    const refreshResponse = await axios.post<RefreshResponse>(
      `${API_ROOT}/${version}/auth/refresh`,
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: DEFAULT_TIMEOUT_MS,
      },
    );

    const refreshedTokens = normalizeRefreshResponse(refreshResponse.data);
    authConfig.setTokens(refreshedTokens);
    processQueue(null, refreshedTokens.accessToken);

    originalRequest.headers.Authorization = `Bearer ${refreshedTokens.accessToken}`;
    return instance(originalRequest);
  } catch (refreshError) {
    processQueue(refreshError);
    authConfig.clearTokens();
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
}

function normalizeRefreshResponse(response: RefreshResponse): RefreshedAuthTokens {
  if (!response.accessToken || !response.refreshToken) {
    throw new Error('Refresh response did not include auth tokens.');
  }

  return {
    accessToken: response.accessToken,
    accessTokenExpiresAt: response.accessTokenExpiresAt ?? null,
    refreshToken: response.refreshToken,
    refreshTokenExpiresAt: response.refreshTokenExpiresAt ?? null,
  };
}

function isLoginPage(loginPath = '/login') {
  return typeof window !== 'undefined' && window.location.pathname.endsWith(loginPath);
}

export type { ApiVersion, AxiosInstanceConfig };
