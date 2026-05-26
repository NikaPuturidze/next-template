'use client';

import { useApiMutation, useApiQuery } from '@repo/shared';

import type {
  AttributeOption,
  CreateAttributeInput,
  CreateAttributeOptionInput,
  DeleteAttributeOptionInput,
  ProductAttribute,
  ReorderAttributeOptionsInput,
  UpdateAttributeOptionInput,
} from '@/types/attribute';

export function useAttributes() {
  return useApiQuery<ProductAttribute[], unknown, ['attributes']>({
    queryKey: ['attributes'],
    url: '/attributes',
    retry: false,
  });
}

export function useCreateAttribute(onSuccess?: () => void) {
  return useApiMutation<ProductAttribute, CreateAttributeInput, unknown, unknown>({
    method: 'post',
    url: '/attributes',
    invalidateQueries: ['attributes'],
    onSuccess,
  });
}

export function useCreateAttributeOption(onSuccess?: () => void) {
  return useApiMutation<AttributeOption, CreateAttributeOptionInput, unknown, unknown>({
    method: 'post',
    url: '/attributes/options',
    invalidateQueries: ['attributes'],
    onSuccess,
  });
}

export function useUpdateAttributeOption(onSuccess?: () => void) {
  return useApiMutation<AttributeOption, UpdateAttributeOptionInput, unknown, unknown>({
    method: 'put',
    url: '/attributes/options',
    invalidateQueries: ['attributes'],
    onSuccess,
  });
}

export function useReorderAttributeOptions(onSuccess?: () => void) {
  return useApiMutation<AttributeOption[], ReorderAttributeOptionsInput, unknown, unknown>({
    method: 'put',
    url: '/attributes/options/order',
    invalidateQueries: ['attributes'],
    onSuccess,
  });
}

export function useDeleteAttributeOption(onSuccess?: () => void) {
  return useApiMutation<void, DeleteAttributeOptionInput, unknown, unknown>({
    method: 'delete',
    url: '/attributes/options',
    invalidateQueries: ['attributes'],
    onSuccess,
  });
}
