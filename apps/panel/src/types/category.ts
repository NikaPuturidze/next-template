import type { AttributeOption, AttributeType } from './attribute';

export type CategoryNode = {
  id: number;
  name: string;
  description?: string | null;
  parentId?: number | null;
  isLeaf: boolean;
  children: CategoryNode[];
  attributes: CategoryAttributeLink[];
};

export type CategoryAttributeLink = {
  id: number;
  attributeId: number;
  name: string;
  type: AttributeType;
  unit?: string | null;
  isRequired: boolean;
  isFilterable: boolean;
  order: number;
  options: AttributeOption[];
};

export type CreateCategoryInput = {
  name: string;
  description?: string | null;
  parentId?: number | null;
};

export type LinkCategoryAttributeInput = {
  categoryId: number;
  attributeId: number;
  isRequired: boolean;
  isFilterable: boolean;
  order: number;
};

export type UpdateCategoryAttributeInput = {
  categoryAttributeId: number;
  isRequired: boolean;
  isFilterable: boolean;
  order: number;
};
