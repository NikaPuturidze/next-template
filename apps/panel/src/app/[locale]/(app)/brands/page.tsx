'use client';

import Image from 'next/image';
import { useEffect, useState, type JSX, type ReactNode, type SyntheticEvent } from 'react';
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Label,
} from '@repo/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/ui/table';
import { useLocale, useTranslations } from 'next-intl';
import { useBrands, useUpdateBrandContacts } from '@/api/brands';
import type {
  AddressContact,
  BrandContacts,
  BrandOverview,
  EmailContact,
  PhoneContact,
} from '@/types/brand';

type EditablePhoneContact = PhoneContact & { _key: string };
type EditableEmailContact = EmailContact & { _key: string };
type EditableAddressContact = AddressContact & { _key: string };

let contactKeySeed = 0;

export default function BrandsPage(): JSX.Element {
  const t = useTranslations('BrandsPage');
  const locale = useLocale();
  const brands = useBrands();
  const [contactsBrand, setContactsBrand] = useState<BrandOverview | null>(null);
  const updateContacts = useUpdateBrandContacts(contactsBrand?.id ?? null, () => brands.refetch());

  return (
    <section className="max-w-384 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>

      {brands.isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {t('loadError')}
        </div>
      ) : null}

      {brands.isPending ? <BrandsSkeleton /> : null}

      {brands.isSuccess && !brands.data.length ? (
        <div className="rounded-md border bg-white px-4 py-5 text-sm text-muted-foreground">
          {t('empty')}
        </div>
      ) : null}

      {brands.data?.length ? (
        <div className="rounded-md border bg-white">
          <Table className="min-w-190">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-16">{t('logo')}</TableHead>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('legalName')}</TableHead>
                <TableHead>{t('created')}</TableHead>
                <TableHead className="w-24 text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.data.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell>
                    <BrandAvatar brand={brand} />
                  </TableCell>
                  <TableCell className="max-w-88">
                    <span className="block truncate font-medium">{brand.name}</span>
                  </TableCell>
                  <TableCell className="max-w-88 text-muted-foreground">
                    <span className="block truncate">{brand.legalName || '-'}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatCreatedAt(brand.created, locale)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ActionsMenu
                      labels={{ contacts: t('contacts') }}
                      onContacts={() => setContactsBrand(brand)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      {contactsBrand ? (
        <ContactsModal
          brand={contactsBrand}
          isSaving={updateContacts.isPending}
          labels={{
            active: t('active'),
            addAddress: t('addAddress'),
            addEmail: t('addEmail'),
            addPhone: t('addPhone'),
            addressLine1: t('addressLine1'),
            addressLine2: t('addressLine2'),
            addresses: t('addresses'),
            city: t('city'),
            contacts: t('contacts'),
            emailAddress: t('emailAddress'),
            emailAddresses: t('emailAddresses'),
            label: t('label'),
            phoneNumber: t('phoneNumber'),
            phoneNumbers: t('phoneNumbers'),
            postalCode: t('postalCode'),
            primary: t('primary'),
            remove: t('remove'),
            saveChanges: t('saveChanges'),
            saveError: t('saveError'),
            saved: t('saved'),
            saving: t('saving'),
          }}
          saveState={
            updateContacts.isError ? 'error' : updateContacts.isSuccess ? 'success' : 'idle'
          }
          onClose={() => setContactsBrand(null)}
          onSubmit={(contacts) => updateContacts.mutate(contacts)}
        />
      ) : null}
    </section>
  );
}

function ActionsMenu({
  labels,
  onContacts,
}: {
  labels: { contacts: string };
  onContacts: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Settings">
          <span aria-hidden="true" className="text-base leading-none">
            &#9881;
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onContacts}>{labels.contacts}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ContactsModal({
  brand,
  isSaving,
  labels,
  onClose,
  onSubmit,
  saveState,
}: {
  brand: BrandOverview;
  isSaving: boolean;
  labels: Record<string, string>;
  onClose: () => void;
  onSubmit: (contacts: BrandContacts) => void;
  saveState: 'error' | 'idle' | 'success';
}) {
  const [phoneNumbers, setPhoneNumbers] = useState<EditablePhoneContact[]>([]);
  const [emailAddresses, setEmailAddresses] = useState<EditableEmailContact[]>([]);
  const [addresses, setAddresses] = useState<EditableAddressContact[]>([]);

  useEffect(() => {
    setPhoneNumbers(brand.contacts.phoneNumbers.map(withEditableKey));
    setEmailAddresses(brand.contacts.emailAddresses.map(withEditableKey));
    setAddresses(brand.contacts.addresses.map(withEditableKey));
  }, [brand]);

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    event.preventDefault();
    onSubmit({
      phoneNumbers: phoneNumbers.filter((phone) => phone.phoneNumber.trim()).map(stripEditableKey),
      emailAddresses: emailAddresses.filter((email) => email.email.trim()).map(stripEditableKey),
      addresses: addresses
        .filter((address) => address.city.trim() || address.addressLine1.trim())
        .map(stripEditableKey),
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl gap-0 p-0">
        <DialogHeader>
          <DialogTitle className="truncate">{labels.contacts}</DialogTitle>
          <DialogDescription className="truncate">{brand.name}</DialogDescription>
        </DialogHeader>
        <form className="flex max-h-[calc(90vh-73px)] flex-col" onSubmit={handleSubmit}>
          <div className="space-y-6 overflow-y-auto p-5">
            <ContactSection
              title={labels.phoneNumbers}
              addLabel={labels.addPhone}
              onAdd={() =>
                setPhoneNumbers((items) => [
                  ...items,
                  withEditableKey({
                    phoneNumber: '',
                    label: '',
                    isPrimary: items.length === 0,
                    isActive: true,
                  }),
                ])
              }
            >
              {phoneNumbers.map((phone, index) => (
                <div
                  key={phone._key}
                  className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_0.7fr_auto]"
                >
                  <Input
                    value={phone.phoneNumber}
                    placeholder={labels.phoneNumber}
                    onChange={(event) =>
                      setPhoneNumbers((items) =>
                        updateAt(items, index, { ...phone, phoneNumber: event.target.value }),
                      )
                    }
                  />
                  <Input
                    value={phone.label ?? ''}
                    placeholder={labels.label}
                    onChange={(event) =>
                      setPhoneNumbers((items) =>
                        updateAt(items, index, { ...phone, label: event.target.value }),
                      )
                    }
                  />
                  <ContactActions
                    labels={labels}
                    item={phone}
                    onChange={(next) => setPhoneNumbers((items) => updateAt(items, index, next))}
                    onRemove={() => setPhoneNumbers((items) => removeAt(items, index))}
                  />
                </div>
              ))}
            </ContactSection>

            <ContactSection
              title={labels.emailAddresses}
              addLabel={labels.addEmail}
              onAdd={() =>
                setEmailAddresses((items) => [
                  ...items,
                  withEditableKey({
                    email: '',
                    label: '',
                    isPrimary: items.length === 0,
                    isActive: true,
                  }),
                ])
              }
            >
              {emailAddresses.map((email, index) => (
                <div
                  key={email._key}
                  className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_0.7fr_auto]"
                >
                  <Input
                    value={email.email}
                    placeholder={labels.emailAddress}
                    onChange={(event) =>
                      setEmailAddresses((items) =>
                        updateAt(items, index, { ...email, email: event.target.value }),
                      )
                    }
                  />
                  <Input
                    value={email.label ?? ''}
                    placeholder={labels.label}
                    onChange={(event) =>
                      setEmailAddresses((items) =>
                        updateAt(items, index, { ...email, label: event.target.value }),
                      )
                    }
                  />
                  <ContactActions
                    labels={labels}
                    item={email}
                    onChange={(next) => setEmailAddresses((items) => updateAt(items, index, next))}
                    onRemove={() => setEmailAddresses((items) => removeAt(items, index))}
                  />
                </div>
              ))}
            </ContactSection>

            <ContactSection
              title={labels.addresses}
              addLabel={labels.addAddress}
              onAdd={() =>
                setAddresses((items) => [
                  ...items,
                  withEditableKey({
                    city: '',
                    addressLine1: '',
                    addressLine2: '',
                    postalCode: '',
                    latitude: null,
                    longitude: null,
                    isPrimary: items.length === 0,
                    isActive: true,
                  }),
                ])
              }
            >
              {addresses.map((address, index) => (
                <div key={address._key} className="grid gap-3 rounded-md border p-3 md:grid-cols-2">
                  <Input
                    value={address.city}
                    placeholder={labels.city}
                    onChange={(event) =>
                      setAddresses((items) =>
                        updateAt(items, index, { ...address, city: event.target.value }),
                      )
                    }
                  />
                  <Input
                    value={address.addressLine1}
                    placeholder={labels.addressLine1}
                    onChange={(event) =>
                      setAddresses((items) =>
                        updateAt(items, index, { ...address, addressLine1: event.target.value }),
                      )
                    }
                  />
                  <Input
                    value={address.addressLine2 ?? ''}
                    placeholder={labels.addressLine2}
                    onChange={(event) =>
                      setAddresses((items) =>
                        updateAt(items, index, { ...address, addressLine2: event.target.value }),
                      )
                    }
                  />
                  <Input
                    value={address.postalCode ?? ''}
                    placeholder={labels.postalCode}
                    onChange={(event) =>
                      setAddresses((items) =>
                        updateAt(items, index, { ...address, postalCode: event.target.value }),
                      )
                    }
                  />
                  <div className="md:col-span-2">
                    <ContactActions
                      labels={labels}
                      item={address}
                      onChange={(next) => setAddresses((items) => updateAt(items, index, next))}
                      onRemove={() => setAddresses((items) => removeAt(items, index))}
                    />
                  </div>
                </div>
              ))}
            </ContactSection>
          </div>

          <DialogFooter>
            {saveState === 'error' ? (
              <span className="text-sm text-destructive">{labels.saveError}</span>
            ) : null}
            {saveState === 'success' ? (
              <span className="text-sm text-muted-foreground">{labels.saved}</span>
            ) : null}
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? labels.saving : labels.saveChanges}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ContactSection({
  addLabel,
  children,
  onAdd,
  title,
}: {
  addLabel: string;
  children: ReactNode;
  onAdd: () => void;
  title: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-medium">{title}</h4>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          {addLabel}
        </Button>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function ContactActions<T extends { isPrimary: boolean; isActive: boolean }>({
  item,
  labels,
  onChange,
  onRemove,
}: {
  item: T;
  labels: Record<string, string>;
  onChange: (item: T) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={item.isPrimary}
          onChange={(event) => onChange({ ...item, isPrimary: event.target.checked })}
        />
        {labels.primary}
      </Label>
      <Label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={item.isActive}
          onChange={(event) => onChange({ ...item, isActive: event.target.checked })}
        />
        {labels.active}
      </Label>
      <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
        {labels.remove}
      </Button>
    </div>
  );
}

function BrandAvatar({ brand }: { brand: BrandOverview }) {
  const firstLetter = brand.name.trim().charAt(0).toUpperCase() || '?';

  if (brand.logoImageUrl) {
    return (
      <span className="relative block h-9 w-9 overflow-hidden rounded-full border bg-muted">
        <Image src={brand.logoImageUrl} alt="" fill sizes="36px" className="object-cover" />
      </span>
    );
  }

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-muted text-sm font-semibold">
      {firstLetter}
    </span>
  );
}

function BrandsSkeleton() {
  return <div className="h-72 animate-pulse rounded-md border bg-muted" />;
}

function updateAt<T>(items: T[], index: number, item: T) {
  return items.map((current, currentIndex) => (currentIndex === index ? item : current));
}

function removeAt<T>(items: T[], index: number) {
  return items.filter((_, currentIndex) => currentIndex !== index);
}

function withEditableKey<T extends object>(item: T): T & { _key: string } {
  contactKeySeed += 1;
  return { ...item, _key: `contact-${contactKeySeed}` };
}

function stripEditableKey<T extends { _key: string }>(item: T): Omit<T, '_key'> {
  const { _key, ...rest } = item;
  return rest;
}

function formatCreatedAt(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));
}
