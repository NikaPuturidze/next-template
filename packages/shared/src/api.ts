import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type QueryKey,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

import { axiosInstance } from './http';

type ApiClient = AxiosInstance;
type ApiError<TError = unknown> = AxiosError<TError>;
type ApiMutationMethod = 'post' | 'put' | 'patch' | 'delete';

type ApiQueryConfig<TData, TError, TQueryKey extends QueryKey> = Omit<
  UseQueryOptions<TData, ApiError<TError>, TData, TQueryKey>,
  'queryKey' | 'queryFn'
> & {
  queryKey: TQueryKey;
  url: string;
  client?: ApiClient;
  request?: AxiosRequestConfig;
};

type ApiMutationConfig<TData, TVariables, TError, TContext> = Omit<
  UseMutationOptions<TData, ApiError<TError>, TVariables, TContext>,
  'mutationFn'
> & {
  url: string | ((variables: TVariables) => string);
  method: ApiMutationMethod;
  client?: ApiClient;
  invalidateQueries?: QueryKey | QueryKey[];
  queryClient?: QueryClient;
  request?: AxiosRequestConfig | ((variables: TVariables) => AxiosRequestConfig | undefined);
};

const resolveValue = <TVariables, TValue>(
  value: TValue | ((variables: TVariables) => TValue),
  variables: TVariables,
) => (typeof value === 'function' ? (value as (variables: TVariables) => TValue)(variables) : value);

export async function apiGet<TData>(
  url: string,
  config?: AxiosRequestConfig,
  client: ApiClient = axiosInstance,
) {
  const response = await client.get<TData>(url, config);
  return response.data;
}

export async function apiMutate<TData, TVariables = unknown>(
  method: ApiMutationMethod,
  url: string,
  variables?: TVariables,
  config?: AxiosRequestConfig,
  client: ApiClient = axiosInstance,
) {
  const response =
    method === 'delete'
      ? await client.delete<TData>(url, { ...config, data: variables })
      : await client[method]<TData>(url, variables, config);

  return response.data;
}

export function useApiQuery<
  TData,
  TError = unknown,
  TQueryKey extends QueryKey = QueryKey,
>({
  client = axiosInstance,
  request,
  url,
  ...options
}: ApiQueryConfig<TData, TError, TQueryKey>): UseQueryResult<TData, ApiError<TError>> {
  return useQuery({
    ...options,
    queryFn: () => apiGet<TData>(url, request, client),
  });
}

export function useApiMutation<
  TData,
  TVariables = unknown,
  TError = unknown,
  TContext = unknown,
>({
  client = axiosInstance,
  invalidateQueries,
  method,
  onSuccess,
  queryClient,
  request,
  url,
  ...options
}: ApiMutationConfig<TData, TVariables, TError, TContext>): UseMutationResult<
  TData,
  ApiError<TError>,
  TVariables,
  TContext
> {
  const activeQueryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: (variables) =>
      apiMutate<TData, TVariables>(
        method,
        resolveValue(url, variables),
        variables,
        resolveValue(request, variables),
        client,
      ),
    onSuccess: async (data, variables, context, mutationContext) => {
      await onSuccess?.(data, variables, context, mutationContext);

      const keys = Array.isArray(invalidateQueries?.[0])
        ? (invalidateQueries as QueryKey[])
        : invalidateQueries
          ? [invalidateQueries as QueryKey]
          : [];

      await Promise.all(
        keys.map((queryKey) => (queryClient ?? activeQueryClient).invalidateQueries({ queryKey })),
      );
    },
  });
}

export const useApiPost = <TData, TVariables = unknown, TError = unknown, TContext = unknown>(
  config: Omit<ApiMutationConfig<TData, TVariables, TError, TContext>, 'method'>,
) => useApiMutation({ ...config, method: 'post' });

export const useApiPut = <TData, TVariables = unknown, TError = unknown, TContext = unknown>(
  config: Omit<ApiMutationConfig<TData, TVariables, TError, TContext>, 'method'>,
) => useApiMutation({ ...config, method: 'put' });

export const useApiPatch = <TData, TVariables = unknown, TError = unknown, TContext = unknown>(
  config: Omit<ApiMutationConfig<TData, TVariables, TError, TContext>, 'method'>,
) => useApiMutation({ ...config, method: 'patch' });

export const useApiDelete = <TData, TVariables = unknown, TError = unknown, TContext = unknown>(
  config: Omit<ApiMutationConfig<TData, TVariables, TError, TContext>, 'method'>,
) => useApiMutation({ ...config, method: 'delete' });

export type { ApiError, ApiMutationConfig, ApiMutationMethod, ApiQueryConfig };
