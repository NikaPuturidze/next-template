'use client';

import { Fragment, useEffect, useMemo, useState, type DragEvent, type SyntheticEvent } from 'react';
import {
  Badge,
  Button,
  ChevronDownIcon,
  ChevronRightIcon,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  GripVerticalIcon,
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
  Trash2Icon,
} from '@repo/ui';
import { useTranslations } from 'next-intl';
import {
  useAttributes,
  useCreateAttribute,
  useCreateAttributeOption,
  useDeleteAttributeOption,
  useReorderAttributeOptions,
  useUpdateAttributeOption,
} from '@/api/attributes';
import {
  ATTRIBUTE_TYPES,
  type AttributeOption,
  type AttributeType,
  type ProductAttribute,
} from '@/types/attribute';

type OptionDraft = {
  key: string;
  value: string;
  order: number;
};

type OptionEditorItem = {
  id: number;
  value: string;
  order: number;
};

type AttributeTypeLabels = Record<AttributeType, string>;

let optionKeySeed = 0;

export default function AttributesPage() {
  const t = useTranslations('AttributesPage');
  const attributes = useAttributes();
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [optionTarget, setOptionTarget] = useState<ProductAttribute | null>(null);
  const typeLabels = useMemo<AttributeTypeLabels>(
    () => ({
      1: t('attributeTypes.text'),
      2: t('attributeTypes.integer'),
      3: t('attributeTypes.boolean'),
      4: t('attributeTypes.select'),
    }),
    [t],
  );
  const createAttribute = useCreateAttribute(() => {
    setIsCreateDialogOpen(false);
    attributes.refetch();
  });
  const createOption = useCreateAttributeOption(() => {
    setOptionTarget(null);
    attributes.refetch();
  });

  const toggleExpanded = (attributeId: number) => {
    setExpandedIds((current) => {
      const next = new Set(current);

      if (next.has(attributeId)) {
        next.delete(attributeId);
      } else {
        next.add(attributeId);
      }

      return next;
    });
  };

  return (
    <section className="max-w-384 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-normal">{t('title')}</h2>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <Button type="button" onClick={() => setIsCreateDialogOpen(true)}>
          <PlusIcon />
          {t('addAttribute')}
        </Button>
      </div>

      {attributes.isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {t('loadError')}
        </div>
      ) : null}

      {attributes.isPending ? <AttributesSkeleton /> : null}

      {attributes.isSuccess && !attributes.data.length ? (
        <div className="rounded-md border bg-white px-4 py-5 text-sm text-muted-foreground">
          {t('empty')}
        </div>
      ) : null}

      {attributes.data?.length ? (
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>{t('attribute')}</TableHead>
                <TableHead>{t('type')}</TableHead>
                <TableHead>{t('unit')}</TableHead>
                <TableHead>{t('options')}</TableHead>
                <TableHead className="w-36 text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attributes.data.map((attribute) => {
                const isSelect = attribute.type === 4;
                const isExpanded = expandedIds.has(attribute.id);

                return (
                  <Fragment key={attribute.id}>
                    <TableRow>
                      <TableCell className="max-w-88">
                        <div className="flex min-w-0 items-center gap-2">
                          {isSelect ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              aria-label={isExpanded ? t('collapse') : t('expand')}
                              onClick={() => toggleExpanded(attribute.id)}
                            >
                              {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                            </Button>
                          ) : (
                            <span className="size-6 shrink-0" />
                          )}
                          <span className="truncate font-medium">{attribute.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{typeLabels[attribute.type]}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {attribute.unit || t('noUnit')}
                      </TableCell>
                      <TableCell>
                        {isSelect ? attribute.options.length : t('notApplicable')}
                      </TableCell>
                      <TableCell className="text-right">
                        {isSelect ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setOptionTarget(attribute)}
                          >
                            <PlusIcon />
                            {t('addOption')}
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                    {isSelect && isExpanded ? (
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableCell colSpan={5}>
                          {attribute.options.length ? (
                            <AttributeOptionsEditor
                              attribute={attribute}
                              labels={{
                                delete: t('delete'),
                                deleting: t('deleting'),
                                dragOption: t('dragOption'),
                                optionValue: t('optionValue'),
                                order: t('order'),
                                save: t('save'),
                                saving: t('saving'),
                              }}
                              onSaved={() => attributes.refetch()}
                            />
                          ) : (
                            <span className="text-sm text-muted-foreground">{t('noOptions')}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <CreateAttributeDialog
        isSaving={createAttribute.isPending}
        labels={{
          addAttribute: t('addAttribute'),
          addOption: t('addOption'),
          cancel: t('cancel'),
          name: t('name'),
          optionValue: t('optionValue'),
          options: t('options'),
          order: t('order'),
          remove: t('remove'),
          save: t('save'),
          saving: t('saving'),
          selectType: t('selectType'),
          type: t('type'),
          unit: t('unit'),
        }}
        open={isCreateDialogOpen}
        typeLabels={typeLabels}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={(payload) => createAttribute.mutate(payload)}
      />

      {optionTarget ? (
        <CreateOptionDialog
          attribute={optionTarget}
          isSaving={createOption.isPending}
          labels={{
            addOption: t('addOption'),
            cancel: t('cancel'),
            optionValue: t('optionValue'),
            order: t('order'),
            save: t('save'),
            saving: t('saving'),
          }}
          onClose={() => setOptionTarget(null)}
          onSubmit={(payload) => createOption.mutate(payload)}
        />
      ) : null}
    </section>
  );
}

function AttributeOptionsEditor({
  attribute,
  labels,
  onSaved,
}: {
  attribute: ProductAttribute;
  labels: Record<string, string>;
  onSaved: () => void;
}) {
  const sortedOptions = useMemo(() => sortOptions(attribute.options), [attribute.options]);
  const [options, setOptions] = useState<OptionEditorItem[]>(sortedOptions);
  const [draggedOptionId, setDraggedOptionId] = useState<number | null>(null);
  const originalOptionsById = useMemo(
    () => new Map(attribute.options.map((option) => [option.id, option])),
    [attribute.options],
  );
  const updateOption = useUpdateAttributeOption(onSaved);
  const deleteOption = useDeleteAttributeOption(onSaved);
  const reorderOptions = useReorderAttributeOptions(onSaved);

  useEffect(() => {
    setOptions(sortedOptions);
  }, [sortedOptions]);

  const handleDrop = (event: DragEvent<HTMLDivElement>, targetOptionId: number) => {
    event.preventDefault();

    if (!draggedOptionId || draggedOptionId === targetOptionId) {
      setDraggedOptionId(null);
      return;
    }

    const fromIndex = options.findIndex((option) => option.id === draggedOptionId);
    const toIndex = options.findIndex((option) => option.id === targetOptionId);

    if (fromIndex < 0 || toIndex < 0) {
      setDraggedOptionId(null);
      return;
    }

    const nextOptions = moveAt(options, fromIndex, toIndex).map((option, index) => ({
      ...option,
      order: index,
    }));

    setOptions(nextOptions);
    setDraggedOptionId(null);
    reorderOptions.mutate({
      attributeId: attribute.id,
      options: nextOptions.map((option) => ({
        optionId: option.id,
        order: option.order,
      })),
    });
  };

  return (
    <div className="space-y-2">
      {options.map((option, index) => {
        const originalOption = originalOptionsById.get(option.id);
        const isDirty =
          option.value !== originalOption?.value || option.order !== originalOption?.order;

        return (
          <div
            key={option.id}
            className="grid items-center gap-2 rounded-md border bg-white p-2 sm:grid-cols-[2rem_minmax(12rem,1fr)_6rem_auto_auto]"
            data-state={draggedOptionId === option.id ? 'selected' : undefined}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, option.id)}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="cursor-grab active:cursor-grabbing"
              aria-label={labels.dragOption}
              draggable
              onDragStart={() => setDraggedOptionId(option.id)}
              onDragEnd={() => setDraggedOptionId(null)}
            >
              <GripVerticalIcon />
            </Button>
            <Input
              aria-label={labels.optionValue}
              value={option.value}
              onChange={(event) =>
                setOptions((items) =>
                  updateAt(items, index, { ...option, value: event.target.value }),
                )
              }
            />
            <Button
              type="button"
              size="sm"
              disabled={!isDirty || updateOption.isPending}
              onClick={() =>
                updateOption.mutate({
                  optionId: option.id,
                  value: option.value,
                  order: option.order,
                })
              }
            >
              {updateOption.isPending ? labels.saving : labels.save}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              aria-label={labels.delete}
              disabled={deleteOption.isPending}
              onClick={() => deleteOption.mutate({ optionId: option.id })}
            >
              <Trash2Icon />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

function CreateAttributeDialog({
  isSaving,
  labels,
  onOpenChange,
  onSubmit,
  open,
  typeLabels,
}: {
  isSaving: boolean;
  labels: Record<string, string>;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    name: string;
    type: AttributeType;
    unit?: string | null;
    options?: { value: string; order: number }[] | null;
  }) => void;
  open: boolean;
  typeLabels: AttributeTypeLabels;
}) {
  const [type, setType] = useState<string>('1');
  const [options, setOptions] = useState<OptionDraft[]>([]);
  const numericType = Number(type) as AttributeType;

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSubmit({
      name: String(formData.get('name') ?? ''),
      type: numericType,
      unit: String(formData.get('unit') ?? '') || null,
      options:
        numericType === 4
          ? options
              .filter((option) => option.value.trim())
              .map(({ value, order }) => ({ value, order }))
          : [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">
        <DialogHeader>
          <DialogTitle>{labels.addAttribute}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-5">
            <div className="grid gap-2">
              <Label htmlFor="attribute-name">{labels.name}</Label>
              <Input id="attribute-name" name="name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="attribute-type">{labels.type}</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="attribute-type">
                  <SelectValue placeholder={labels.selectType} />
                </SelectTrigger>
                <SelectContent>
                  {ATTRIBUTE_TYPES.map((attributeType) => (
                    <SelectItem key={attributeType.value} value={String(attributeType.value)}>
                      {typeLabels[attributeType.value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="attribute-unit">{labels.unit}</Label>
              <Input id="attribute-unit" name="unit" />
            </div>

            {numericType === 4 ? (
              <div className="space-y-3 rounded-md border p-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-medium">{labels.options}</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setOptions((items) => [...items, createOptionDraft(items.length)])
                    }
                  >
                    <PlusIcon />
                    {labels.addOption}
                  </Button>
                </div>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={option.key} className="grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
                      <Input
                        value={option.value}
                        placeholder={labels.optionValue}
                        onChange={(event) =>
                          setOptions((items) =>
                            updateAt(items, index, { ...option, value: event.target.value }),
                          )
                        }
                      />
                      <Input
                        value={option.order}
                        type="number"
                        onChange={(event) =>
                          setOptions((items) =>
                            updateAt(items, index, {
                              ...option,
                              order: Number(event.target.value),
                            }),
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setOptions((items) => removeAt(items, index))}
                      >
                        {labels.remove}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {labels.cancel}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? labels.saving : labels.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateOptionDialog({
  attribute,
  isSaving,
  labels,
  onClose,
  onSubmit,
}: {
  attribute: ProductAttribute;
  isSaving: boolean;
  labels: Record<string, string>;
  onClose: () => void;
  onSubmit: (payload: { attributeId: number; value: string; order: number }) => void;
}) {
  const handleSubmit = (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSubmit({
      attributeId: attribute.id,
      value: String(formData.get('value') ?? ''),
      order: Number(formData.get('order') ?? 0),
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0">
        <DialogHeader>
          <DialogTitle>{labels.addOption}</DialogTitle>
          <DialogDescription>{attribute.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-5">
            <div className="grid gap-2">
              <Label htmlFor="option-value">{labels.optionValue}</Label>
              <Input id="option-value" name="value" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="option-order">{labels.order}</Label>
              <Input id="option-order" name="order" type="number" defaultValue={0} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {labels.cancel}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? labels.saving : labels.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AttributesSkeleton() {
  return (
    <div className="space-y-3 rounded-md border bg-white p-4">
      <div className="h-10 animate-pulse rounded bg-muted" />
      <div className="h-10 animate-pulse rounded bg-muted" />
      <div className="h-10 animate-pulse rounded bg-muted" />
      <div className="h-10 animate-pulse rounded bg-muted" />
    </div>
  );
}

function createOptionDraft(order: number): OptionDraft {
  optionKeySeed += 1;
  return { key: `option-${optionKeySeed}`, value: '', order };
}

function updateAt<T>(items: T[], index: number, item: T) {
  return items.map((current, currentIndex) => (currentIndex === index ? item : current));
}

function removeAt<T>(items: T[], index: number) {
  return items.filter((_, currentIndex) => currentIndex !== index);
}

function moveAt<T>(items: T[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);

  if (!item) {
    return items;
  }

  nextItems.splice(toIndex, 0, item);
  return nextItems;
}

function sortOptions(options: AttributeOption[]): OptionEditorItem[] {
  return [...options]
    .sort((left, right) => left.order - right.order || left.value.localeCompare(right.value))
    .map((option) => ({
      id: option.id,
      value: option.value,
      order: option.order,
    }));
}
