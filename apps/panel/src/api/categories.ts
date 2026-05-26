'use client';

import { useApiMutation, useApiQuery } from '@repo/shared';

import type {
  CategoryAttributeLink,
  CategoryNode,
  CreateCategoryInput,
  LinkCategoryAttributeInput,
  UpdateCategoryAttributeInput,
} from '@/types/category';

export function useCategories() {
  return useApiQuery<CategoryNode[], unknown, ['categories']>({
    queryKey: ['categories'],
    url: '/categories',
    retry: false,
  });
}

export function useCreateCategory(onSuccess?: () => void) {
  return useApiMutation<CategoryNode, CreateCategoryInput, unknown, unknown>({
    method: 'post',
    url: '/categories',
    invalidateQueries: ['categories'],
    onSuccess,
  });
}

export function useLinkCategoryAttribute(onSuccess?: () => void) {
  return useApiMutation<CategoryAttributeLink, LinkCategoryAttributeInput, unknown, unknown>({
    method: 'post',
    url: '/categories/attributes',
    invalidateQueries: ['categories'],
    onSuccess,
  });
}

export function useUpdateCategoryAttribute(onSuccess?: () => void) {
  return useApiMutation<CategoryAttributeLink, UpdateCategoryAttributeInput, unknown, unknown>({
    method: 'put',
    url: '/categories/attributes',
    invalidateQueries: ['categories'],
    onSuccess,
  });
}
