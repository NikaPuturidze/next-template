export const ATTRIBUTE_TYPES = [
  { labelKey: 'attributeTypes.text', value: 1 },
  { labelKey: 'attributeTypes.integer', value: 2 },
  { labelKey: 'attributeTypes.boolean', value: 3 },
  { labelKey: 'attributeTypes.select', value: 4 },
] as const;

export type AttributeType = (typeof ATTRIBUTE_TYPES)[number]['value'];

export type AttributeOption = {
  id: number;
  value: string;
  order: number;
};

export type ProductAttribute = {
  id: number;
  name: string;
  type: AttributeType;
  unit?: string | null;
  options: AttributeOption[];
};

export type CreateAttributeInput = {
  name: string;
  type: AttributeType;
  unit?: string | null;
  options?: CreateAttributeOptionDraft[] | null;
};

export type CreateAttributeOptionDraft = {
  value: string;
  order: number;
};

export type CreateAttributeOptionInput = {
  attributeId: number;
  value: string;
  order: number;
};

export type UpdateAttributeOptionInput = {
  optionId: number;
  value: string;
  order: number;
};

export type DeleteAttributeOptionInput = {
  optionId: number;
};

export type ReorderAttributeOptionsInput = {
  attributeId: number;
  options: AttributeOptionOrderInput[];
};

export type AttributeOptionOrderInput = {
  optionId: number;
  order: number;
};
