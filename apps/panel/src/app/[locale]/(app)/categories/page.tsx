'use client';

import { useMemo, useState, type CSSProperties, type SyntheticEvent } from 'react';
import {
  Badge,
  Button,
  Checkbox,
  ChevronDownIcon,
  ChevronRightIcon,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  PlusIcon,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@repo/ui';
import { useTranslations } from 'next-intl';

import { useAttributes } from '@/api/attributes';
import {
  useCategories,
  useCreateCategory,
  useLinkCategoryAttribute,
  useUpdateCategoryAttribute,
} from '@/api/categories';
import type { ProductAttribute } from '@/types/attribute';
import type { CategoryAttributeLink, CategoryNode } from '@/types/category';

type VisibleCategory = {
  category: CategoryNode;
  depth: number;
};

export default function CategoriesPage() {
  const t = useTranslations('CategoriesPage');
  const categories = useCategories();
  const attributes = useAttributes();
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState<CategoryNode | null>(null);

  const flatCategories = useMemo(() => flattenAllCategories(categories.data ?? []), [categories.data]);
  const visibleCategories = useMemo(
    () => flattenVisibleCategories(categories.data ?? [], expandedIds),
    [categories.data, expandedIds],
  );
  const selectedCategory = useMemo(() => {
    if (!flatCategories.length) {
      return null;
    }

    return (
      flatCategories.find((item) => item.category.id === selectedCategoryId)?.category ??
      flatCategories[0].category
    );
  }, [flatCategories, selectedCategoryId]);
  const createCategory = useCreateCategory(() => {
    setIsCategoryDialogOpen(false);
    categories.refetch();
  });
  const linkAttribute = useLinkCategoryAttribute(() => {
    setLinkTarget(null);
    categories.refetch();
  });

  const toggleExpanded = (categoryId: number) => {
    setExpandedIds((current) => {
      const next = new Set(current);

      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }

      return next;
    });
  };

  return (
    <section className="max-w-[96rem] space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-normal">{t('title')}</h2>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <Button type="button" onClick={() => setIsCategoryDialogOpen(true)}>
          <PlusIcon />
          {t('addCategory')}
        </Button>
      </div>

      {categories.isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {t('loadError')}
        </div>
      ) : null}

      {categories.isPending ? <CategoriesSkeleton /> : null}

      {categories.isSuccess && !flatCategories.length ? (
        <div className="rounded-md border bg-white px-4 py-5 text-sm text-muted-foreground">
          {t('empty')}
        </div>
      ) : null}

      {flatCategories.length ? (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)]">
          <CategoryTree
            expandedIds={expandedIds}
            labels={{
              attributes: t('attributes'),
              category: t('category'),
              children: t('children'),
              collapse: t('collapse'),
              expand: t('expand'),
              leaf: t('leaf'),
              parent: t('parent'),
              tree: t('tree'),
            }}
            selectedCategoryId={selectedCategory?.id ?? null}
            visibleCategories={visibleCategories}
            onSelect={(categoryId) => setSelectedCategoryId(categoryId)}
            onToggleExpanded={toggleExpanded}
          />

          <CategoryDetails
            attributes={attributes.data ?? []}
            category={selectedCategory}
            labels={{
              addAttributeLink: t('addAttributeLink'),
              attribute: t('attribute'),
              attributes: t('attributes'),
              attributeTypesBoolean: t('attributeTypes.boolean'),
              attributeTypesInteger: t('attributeTypes.integer'),
              attributeTypesSelect: t('attributeTypes.select'),
              attributeTypesText: t('attributeTypes.text'),
              children: t('children'),
              filterable: t('filterable'),
              leaf: t('leaf'),
              leafOnly: t('leafOnly'),
              noDescription: t('noDescription'),
              noLinkedAttributes: t('noLinkedAttributes'),
              noUnit: t('noUnit'),
              nonLeaf: t('nonLeaf'),
              options: t('options'),
              order: t('order'),
              required: t('required'),
              save: t('save'),
              saving: t('saving'),
              selectedCategory: t('selectedCategory'),
              type: t('type'),
              unit: t('unit'),
            }}
            onLinkAttribute={(category) => setLinkTarget(category)}
            onSaved={() => categories.refetch()}
          />
        </div>
      ) : null}

      <CreateCategoryDialog
        categories={flatCategories}
        isSaving={createCategory.isPending}
        labels={{
          addCategory: t('addCategory'),
          cancel: t('cancel'),
          descriptionField: t('descriptionField'),
          name: t('name'),
          noParent: t('noParent'),
          parent: t('parent'),
          save: t('save'),
          saving: t('saving'),
        }}
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        onSubmit={(payload) => createCategory.mutate(payload)}
      />

      {linkTarget ? (
        <LinkAttributeDialog
          attributes={attributes.data ?? []}
          category={linkTarget}
          isSaving={linkAttribute.isPending}
          labels={{
            addAttributeLink: t('addAttributeLink'),
            attribute: t('attribute'),
            cancel: t('cancel'),
            filterable: t('filterable'),
            noAttributesAvailable: t('noAttributesAvailable'),
            order: t('order'),
            required: t('required'),
            save: t('save'),
            saving: t('saving'),
            selectAttribute: t('selectAttribute'),
          }}
          onClose={() => setLinkTarget(null)}
          onSubmit={(payload) => linkAttribute.mutate(payload)}
        />
      ) : null}
    </section>
  );
}

function CategoryTree({
  expandedIds,
  labels,
  onSelect,
  onToggleExpanded,
  selectedCategoryId,
  visibleCategories,
}: {
  expandedIds: Set<number>;
  labels: Record<string, string>;
  onSelect: (categoryId: number) => void;
  onToggleExpanded: (categoryId: number) => void;
  selectedCategoryId: number | null;
  visibleCategories: VisibleCategory[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{labels.tree}</h3>
        <Badge variant="secondary">{visibleCategories.length}</Badge>
      </div>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>{labels.category}</TableHead>
              <TableHead className="w-28">{labels.children}</TableHead>
              <TableHead className="w-28">{labels.attributes}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleCategories.map(({ category, depth }) => {
              const hasChildren = category.children.length > 0;
              const isExpanded = expandedIds.has(category.id);
              const isSelected = category.id === selectedCategoryId;
              const indentStyle: CSSProperties = { paddingLeft: `${depth * 1.25}rem` };

              return (
                <TableRow
                  key={category.id}
                  className="cursor-pointer"
                  data-state={isSelected ? 'selected' : undefined}
                  onClick={() => onSelect(category.id)}
                >
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-2" style={indentStyle}>
                      {hasChildren ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={isExpanded ? labels.collapse : labels.expand}
                          onClick={(event) => {
                            event.stopPropagation();
                            onToggleExpanded(category.id);
                          }}
                        >
                          {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                        </Button>
                      ) : (
                        <span className="size-6 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="block truncate font-medium">{category.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {category.isLeaf ? labels.leaf : labels.parent}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{category.children.length}</TableCell>
                  <TableCell>{category.attributes.length}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CategoryDetails({
  attributes,
  category,
  labels,
  onLinkAttribute,
  onSaved,
}: {
  attributes: ProductAttribute[];
  category: CategoryNode | null;
  labels: Record<string, string>;
  onLinkAttribute: (category: CategoryNode) => void;
  onSaved: () => void;
}) {
  if (!category) {
    return null;
  }

  const linkedAttributeIds = new Set(category.attributes.map((attribute) => attribute.attributeId));
  const hasLinkableAttributes = attributes.some((attribute) => !linkedAttributeIds.has(attribute.id));

  return (
    <aside className="space-y-4 rounded-md border bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-muted-foreground">{labels.selectedCategory}</p>
          <h3 className="truncate text-lg font-semibold">{category.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {category.description || labels.noDescription}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={!category.isLeaf || !hasLinkableAttributes}
          onClick={() => onLinkAttribute(category)}
        >
          <PlusIcon />
          {labels.addAttributeLink}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant={category.isLeaf ? 'secondary' : 'outline'}>
          {category.isLeaf ? labels.leaf : labels.nonLeaf}
        </Badge>
        <Badge variant="outline">
          {labels.children}: {category.children.length}
        </Badge>
        <Badge variant="outline">
          {labels.attributes}: {category.attributes.length}
        </Badge>
      </div>

      {!category.isLeaf ? (
        <div className="rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">
          {labels.leafOnly}
        </div>
      ) : category.attributes.length ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>{labels.attribute}</TableHead>
                <TableHead>{labels.type}</TableHead>
                <TableHead>{labels.required}</TableHead>
                <TableHead>{labels.filterable}</TableHead>
                <TableHead className="w-24">{labels.order}</TableHead>
                <TableHead className="w-24 text-right">{labels.save}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {category.attributes.map((attribute) => (
                <CategoryAttributeSettingsRow
                  key={attribute.id}
                  attribute={attribute}
                  labels={labels}
                  onSaved={onSaved}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">
          {labels.noLinkedAttributes}
        </div>
      )}
    </aside>
  );
}

function CategoryAttributeSettingsRow({
  attribute,
  labels,
  onSaved,
}: {
  attribute: CategoryAttributeLink;
  labels: Record<string, string>;
  onSaved: () => void;
}) {
  const [isRequired, setIsRequired] = useState(attribute.isRequired);
  const [isFilterable, setIsFilterable] = useState(attribute.isFilterable);
  const [order, setOrder] = useState(attribute.order);
  const updateAttribute = useUpdateCategoryAttribute(onSaved);
  const isDirty =
    isRequired !== attribute.isRequired || isFilterable !== attribute.isFilterable || order !== attribute.order;

  return (
    <TableRow>
      <TableCell className="max-w-[16rem]">
        <span className="block truncate font-medium">{attribute.name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {attribute.unit || labels.noUnit}
        </span>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">{getAttributeTypeLabel(attribute.type, labels)}</Badge>
      </TableCell>
      <TableCell>
        <Checkbox checked={isRequired} onCheckedChange={(value) => setIsRequired(value === true)} />
      </TableCell>
      <TableCell>
        <Checkbox checked={isFilterable} onCheckedChange={(value) => setIsFilterable(value === true)} />
      </TableCell>
      <TableCell>
        <Input
          className="h-8 w-20"
          type="number"
          value={order}
          onChange={(event) => setOrder(Number(event.target.value))}
        />
      </TableCell>
      <TableCell className="text-right">
        <Button
          type="button"
          size="sm"
          disabled={!isDirty || updateAttribute.isPending}
          onClick={() =>
            updateAttribute.mutate({
              categoryAttributeId: attribute.id,
              isRequired,
              isFilterable,
              order,
            })
          }
        >
          {updateAttribute.isPending ? labels.saving : labels.save}
        </Button>
      </TableCell>
    </TableRow>
  );
}

function CreateCategoryDialog({
  categories,
  isSaving,
  labels,
  onOpenChange,
  onSubmit,
  open,
}: {
  categories: VisibleCategory[];
  isSaving: boolean;
  labels: Record<string, string>;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { name: string; description?: string | null; parentId?: number | null }) => void;
  open: boolean;
}) {
  const [parentId, setParentId] = useState<string>('none');

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSubmit({
      name: String(formData.get('name') ?? ''),
      description: String(formData.get('description') ?? '') || null,
      parentId: parentId === 'none' ? null : Number(parentId),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">
        <DialogHeader>
          <DialogTitle>{labels.addCategory}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-5">
            <div className="grid gap-2">
              <Label htmlFor="category-name">{labels.name}</Label>
              <Input id="category-name" name="name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-parent">{labels.parent}</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger id="category-parent">
                  <SelectValue placeholder={labels.noParent} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{labels.noParent}</SelectItem>
                  {categories.map(({ category, depth }) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {`${'-- '.repeat(depth)}${category.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-description">{labels.descriptionField}</Label>
              <Textarea id="category-description" name="description" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {labels.cancel}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? labels.saving : labels.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LinkAttributeDialog({
  attributes,
  category,
  isSaving,
  labels,
  onClose,
  onSubmit,
}: {
  attributes: ProductAttribute[];
  category: CategoryNode;
  isSaving: boolean;
  labels: Record<string, string>;
  onClose: () => void;
  onSubmit: (payload: {
    categoryId: number;
    attributeId: number;
    isRequired: boolean;
    isFilterable: boolean;
    order: number;
  }) => void;
}) {
  const linkedAttributeIds = new Set(category.attributes.map((attribute) => attribute.attributeId));
  const availableAttributes = attributes.filter((attribute) => !linkedAttributeIds.has(attribute.id));
  const [attributeId, setAttributeId] = useState<string>(availableAttributes[0]?.id ? String(availableAttributes[0].id) : '');
  const [isRequired, setIsRequired] = useState(false);
  const [isFilterable, setIsFilterable] = useState(false);

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSubmit({
      categoryId: category.id,
      attributeId: Number(attributeId),
      isRequired,
      isFilterable,
      order: Number(formData.get('order') ?? 0),
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0">
        <DialogHeader>
          <DialogTitle>{labels.addAttributeLink}</DialogTitle>
          <DialogDescription>{category.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-5">
            {availableAttributes.length ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="category-attribute">{labels.attribute}</Label>
                  <Select value={attributeId} onValueChange={setAttributeId}>
                    <SelectTrigger id="category-attribute">
                      <SelectValue placeholder={labels.selectAttribute} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAttributes.map((attribute) => (
                        <SelectItem key={attribute.id} value={String(attribute.id)}>
                          {attribute.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category-attribute-order">{labels.order}</Label>
                  <Input id="category-attribute-order" name="order" type="number" defaultValue={0} />
                </div>
                <div className="flex flex-wrap gap-4">
                  <Label className="flex items-center gap-2">
                    <Checkbox checked={isRequired} onCheckedChange={(value) => setIsRequired(value === true)} />
                    {labels.required}
                  </Label>
                  <Label className="flex items-center gap-2">
                    <Checkbox checked={isFilterable} onCheckedChange={(value) => setIsFilterable(value === true)} />
                    {labels.filterable}
                  </Label>
                </div>
              </>
            ) : (
              <div className="rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">
                {labels.noAttributesAvailable}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {labels.cancel}
            </Button>
            <Button type="submit" disabled={!availableAttributes.length || !attributeId || isSaving}>
              {isSaving ? labels.saving : labels.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategoriesSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)]">
      <div className="space-y-3 rounded-md border bg-white p-4">
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="h-10 animate-pulse rounded bg-muted" />
        <div className="h-10 animate-pulse rounded bg-muted" />
        <div className="h-10 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-4 rounded-md border bg-white p-4">
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="h-20 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

function flattenVisibleCategories(
  categories: CategoryNode[],
  expandedIds: Set<number>,
  depth = 0,
): VisibleCategory[] {
  return categories.flatMap((category) => [
    { category, depth },
    ...(expandedIds.has(category.id)
      ? flattenVisibleCategories(category.children, expandedIds, depth + 1)
      : []),
  ]);
}

function flattenAllCategories(categories: CategoryNode[], depth = 0): VisibleCategory[] {
  return categories.flatMap((category) => [
    { category, depth },
    ...flattenAllCategories(category.children, depth + 1),
  ]);
}

function getAttributeTypeLabel(type: number, labels: Record<string, string>) {
  switch (type) {
    case 1:
      return labels.attributeTypesText;
    case 2:
      return labels.attributeTypesInteger;
    case 3:
      return labels.attributeTypesBoolean;
    case 4:
      return labels.attributeTypesSelect;
    default:
      return String(type);
  }
}
