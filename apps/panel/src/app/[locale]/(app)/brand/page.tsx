'use client';

import { useEffect, useState, type ChangeEvent, type JSX, type ReactNode, type SyntheticEvent } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@repo/ui';
import { useApiMutation } from '@repo/shared';
import { useLocale, useTranslations } from 'next-intl';

import {
  type AddressContact,
  type BrandContacts,
  type BrandOverview,
  type EmailContact,
  type PhoneContact,
} from '@/types/brand';
import { useMyBrand } from '@/api/brands';

type UpdateBrandDetailsVariables = {
  name: string;
  legalName?: string | null;
};

export default function BrandPage(): JSX.Element {
  const t = useTranslations('BrandPage');
  const locale = useLocale();
  const brand = useMyBrand();
  const uploadLogo = useApiMutation<BrandOverview, FormData, unknown, unknown>({
    method: 'put',
    url: () => `/brands/${brand.data?.id}/logo`,
    onSuccess: () => brand.refetch(),
  });
  const updateDetails = useApiMutation<
    BrandOverview,
    UpdateBrandDetailsVariables,
    unknown,
    unknown
  >({
    method: 'put',
    url: () => `/brands/${brand.data?.id}`,
    onSuccess: () => brand.refetch(),
  });
  const updateContacts = useApiMutation<BrandContacts, BrandContacts, unknown, unknown>({
    method: 'put',
    url: () => `/brands/${brand.data?.id}/contacts`,
    onSuccess: () => brand.refetch(),
  });

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !brand.data?.id) {
      return;
    }

    const formData = new FormData();
    formData.append('logo', file);
    uploadLogo.mutate(formData);
  };

  const handleDetailsSubmit = (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    event.preventDefault();

    if (!brand.data?.id) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    updateDetails.mutate({
      name: String(formData.get('name') ?? ''),
      legalName: String(formData.get('legalName') ?? '') || null,
    });
  };

  return (
    <section className="max-w-[96rem] space-y-6">
      {brand.isPending ? <BrandPageSkeleton /> : null}

      {brand.isError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-5 text-sm text-destructive">{t('loadError')}</CardContent>
        </Card>
      ) : null}

      {brand.isSuccess && !brand.data ? (
        <Card>
          <CardContent className="py-5 text-sm text-muted-foreground">{t('noBrandAccess')}</CardContent>
        </Card>
      ) : null}

      {brand.data ? (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(620px,1.35fr)]">
          <div className="space-y-6">
            <BrandHero
              brand={brand.data}
              formattedCreatedAt={formatCreatedAt(brand.data.created, locale)}
              isUploadingLogo={uploadLogo.isPending}
              labels={{
                changeLogo: t('changeLogo'),
                description: t('description'),
                registered: t('registered'),
                title: t('title'),
                upload: t('upload'),
                uploading: t('uploading'),
              }}
              onLogoChange={handleLogoChange}
            />
            <BrandDetailsCard
              brand={brand.data}
              isSaving={updateDetails.isPending}
              labels={{
                brandDetails: t('brandDetails'),
                brandName: t('brandName'),
                cancel: t('cancel'),
                legalName: t('legalName'),
                saveChanges: t('saveChanges'),
                saveError: t('saveError'),
                saved: t('saved'),
                saving: t('saving'),
              }}
              saveState={
                updateDetails.isError ? 'error' : updateDetails.isSuccess ? 'success' : 'idle'
              }
              onSubmit={handleDetailsSubmit}
            />
          </div>
          <BrandContactsCard
            contacts={brand.data.contacts}
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
              contactsDescription: t('contactsDescription'),
              contactsSaveError: t('contactsSaveError'),
              contactsSaved: t('contactsSaved'),
              cancel: t('cancel'),
              emailAddress: t('emailAddress'),
              emailAddresses: t('emailAddresses'),
              label: t('label'),
              phoneNumber: t('phoneNumber'),
              phoneNumbers: t('phoneNumbers'),
              postalCode: t('postalCode'),
              primary: t('primary'),
              remove: t('remove'),
              saveChanges: t('saveChanges'),
              saving: t('saving'),
            }}
            saveState={
              updateContacts.isError ? 'error' : updateContacts.isSuccess ? 'success' : 'idle'
            }
            onSubmit={(contacts) => updateContacts.mutate(contacts)}
          />
        </div>
      ) : null}
    </section>
  );
}

function BrandContactsCard({
  contacts,
  isSaving,
  labels,
  onSubmit,
  saveState,
}: {
  contacts: BrandContacts;
  isSaving: boolean;
  labels: {
    active: string;
    addAddress: string;
    addEmail: string;
    addPhone: string;
    addressLine1: string;
    addressLine2: string;
    addresses: string;
    city: string;
    contacts: string;
    contactsDescription: string;
    contactsSaveError: string;
    contactsSaved: string;
    cancel: string;
    emailAddress: string;
    emailAddresses: string;
    label: string;
    phoneNumber: string;
    phoneNumbers: string;
    postalCode: string;
    primary: string;
    remove: string;
    saveChanges: string;
    saving: string;
  };
  onSubmit: (contacts: BrandContacts) => void;
  saveState: 'error' | 'idle' | 'success';
}) {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneContact[]>([]);
  const [emailAddresses, setEmailAddresses] = useState<EmailContact[]>([]);
  const [addresses, setAddresses] = useState<AddressContact[]>([]);
  const hasChanges = JSON.stringify({ phoneNumbers, emailAddresses, addresses }) !== JSON.stringify({
    phoneNumbers: contacts.phoneNumbers,
    emailAddresses: contacts.emailAddresses,
    addresses: contacts.addresses,
  });

  const resetContacts = () => {
    setPhoneNumbers(contacts.phoneNumbers.length ? contacts.phoneNumbers : []);
    setEmailAddresses(contacts.emailAddresses.length ? contacts.emailAddresses : []);
    setAddresses(contacts.addresses.length ? contacts.addresses : []);
  };

  useEffect(() => {
    resetContacts();
  }, [contacts]);

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    event.preventDefault();
    onSubmit({
      phoneNumbers: phoneNumbers.filter((phone) => phone.phoneNumber.trim()),
      emailAddresses: emailAddresses.filter((email) => email.email.trim()),
      addresses: addresses.filter((address) => address.city.trim() || address.addressLine1.trim()),
    });
  };

  return (
    <Card className="bg-white shadow-xs">
      <CardHeader>
        <CardTitle className="text-base">{labels.contacts}</CardTitle>
        <p className="text-sm text-muted-foreground">{labels.contactsDescription}</p>
      </CardHeader>
      <CardContent>
        <form className="space-y-7" onReset={resetContacts} onSubmit={handleSubmit}>
          <ContactSection
            addLabel={labels.addPhone}
            title={labels.phoneNumbers}
            onAdd={() =>
              setPhoneNumbers((items) => [
                ...items,
                { phoneNumber: '', label: '', isPrimary: items.length === 0, isActive: true },
              ])
            }
          >
            {phoneNumbers.map((phone, index) => (
              <div key={index} className="grid gap-3 rounded-md border bg-[#fbfcfe] p-3 sm:grid-cols-[1fr_1fr_auto]">
                <Field label={labels.phoneNumber}>
                  <Input
                    value={phone.phoneNumber}
                    onChange={(event) =>
                      setPhoneNumbers((items) =>
                        updateAt(items, index, { phoneNumber: event.target.value }),
                      )
                    }
                  />
                </Field>
                <Field label={labels.label}>
                  <Input
                    value={phone.label ?? ''}
                    onChange={(event) =>
                      setPhoneNumbers((items) => updateAt(items, index, { label: event.target.value }))
                    }
                  />
                </Field>
                <RowActions
                  active={phone.isActive}
                  labels={labels}
                  primary={phone.isPrimary}
                  onActiveChange={(checked) =>
                    setPhoneNumbers((items) => updateAt(items, index, { isActive: checked }))
                  }
                  onPrimaryChange={(checked) =>
                    setPhoneNumbers((items) =>
                      checked
                        ? items.map((item, itemIndex) => ({ ...item, isPrimary: itemIndex === index }))
                        : updateAt(items, index, { isPrimary: false }),
                    )
                  }
                  onRemove={() => setPhoneNumbers((items) => removeAt(items, index))}
                />
              </div>
            ))}
          </ContactSection>

          <ContactSection
            addLabel={labels.addEmail}
            title={labels.emailAddresses}
            onAdd={() =>
              setEmailAddresses((items) => [
                ...items,
                { email: '', label: '', isPrimary: items.length === 0, isActive: true },
              ])
            }
          >
            {emailAddresses.map((email, index) => (
              <div key={index} className="grid gap-3 rounded-md border bg-[#fbfcfe] p-3 sm:grid-cols-[1fr_1fr_auto]">
                <Field label={labels.emailAddress}>
                  <Input
                    type="email"
                    value={email.email}
                    onChange={(event) =>
                      setEmailAddresses((items) => updateAt(items, index, { email: event.target.value }))
                    }
                  />
                </Field>
                <Field label={labels.label}>
                  <Input
                    value={email.label ?? ''}
                    onChange={(event) =>
                      setEmailAddresses((items) => updateAt(items, index, { label: event.target.value }))
                    }
                  />
                </Field>
                <RowActions
                  active={email.isActive}
                  labels={labels}
                  primary={email.isPrimary}
                  onActiveChange={(checked) =>
                    setEmailAddresses((items) => updateAt(items, index, { isActive: checked }))
                  }
                  onPrimaryChange={(checked) =>
                    setEmailAddresses((items) =>
                      checked
                        ? items.map((item, itemIndex) => ({ ...item, isPrimary: itemIndex === index }))
                        : updateAt(items, index, { isPrimary: false }),
                    )
                  }
                  onRemove={() => setEmailAddresses((items) => removeAt(items, index))}
                />
              </div>
            ))}
          </ContactSection>

          <ContactSection
            addLabel={labels.addAddress}
            title={labels.addresses}
            onAdd={() =>
              setAddresses((items) => [
                ...items,
                {
                  city: '',
                  addressLine1: '',
                  addressLine2: '',
                  postalCode: '',
                  latitude: null,
                  longitude: null,
                  isPrimary: items.length === 0,
                  isActive: true,
                },
              ])
            }
          >
            {addresses.map((address, index) => (
              <div key={index} className="grid gap-3 rounded-md border bg-[#fbfcfe] p-3 sm:grid-cols-2">
                <Field label={labels.city}>
                  <Input
                    value={address.city}
                    onChange={(event) =>
                      setAddresses((items) => updateAt(items, index, { city: event.target.value }))
                    }
                  />
                </Field>
                <Field label={labels.postalCode}>
                  <Input
                    value={address.postalCode ?? ''}
                    onChange={(event) =>
                      setAddresses((items) => updateAt(items, index, { postalCode: event.target.value }))
                    }
                  />
                </Field>
                <Field label={labels.addressLine1}>
                  <Input
                    value={address.addressLine1}
                    onChange={(event) =>
                      setAddresses((items) =>
                        updateAt(items, index, { addressLine1: event.target.value }),
                      )
                    }
                  />
                </Field>
                <Field label={labels.addressLine2}>
                  <Input
                    value={address.addressLine2 ?? ''}
                    onChange={(event) =>
                      setAddresses((items) =>
                        updateAt(items, index, { addressLine2: event.target.value }),
                      )
                    }
                  />
                </Field>
                <div className="sm:col-span-2">
                  <RowActions
                    active={address.isActive}
                    labels={labels}
                    primary={address.isPrimary}
                    onActiveChange={(checked) =>
                      setAddresses((items) => updateAt(items, index, { isActive: checked }))
                    }
                    onPrimaryChange={(checked) =>
                      setAddresses((items) =>
                        checked
                          ? items.map((item, itemIndex) => ({ ...item, isPrimary: itemIndex === index }))
                          : updateAt(items, index, { isPrimary: false }),
                      )
                    }
                    onRemove={() => setAddresses((items) => removeAt(items, index))}
                  />
                </div>
              </div>
            ))}
          </ContactSection>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {saveState === 'success'
                ? labels.contactsSaved
                : saveState === 'error'
                  ? labels.contactsSaveError
                  : null}
            </p>
            <div className="flex gap-2">
              {hasChanges ? (
                <Button type="reset" variant="outline" disabled={isSaving}>
                  {labels.cancel}
                </Button>
              ) : null}
              <Button type="submit" disabled={isSaving}>
                {isSaving ? labels.saving : labels.saveChanges}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
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
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          {addLabel}
        </Button>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function RowActions({
  active,
  labels,
  onActiveChange,
  onPrimaryChange,
  onRemove,
  primary,
}: {
  active: boolean;
  labels: {
    active: string;
    primary: string;
    remove: string;
  };
  onActiveChange: (checked: boolean) => void;
  onPrimaryChange: (checked: boolean) => void;
  onRemove: () => void;
  primary: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 self-end">
      <label className="flex h-9 items-center gap-2 text-sm">
        <input checked={primary} type="checkbox" onChange={(event) => onPrimaryChange(event.target.checked)} />
        {labels.primary}
      </label>
      <label className="flex h-9 items-center gap-2 text-sm">
        <input checked={active} type="checkbox" onChange={(event) => onActiveChange(event.target.checked)} />
        {labels.active}
      </label>
      <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
        {labels.remove}
      </Button>
    </div>
  );
}

function BrandHero({
  brand,
  formattedCreatedAt,
  isUploadingLogo,
  labels,
  onLogoChange,
}: {
  brand: BrandOverview;
  formattedCreatedAt: string;
  isUploadingLogo: boolean;
  labels: {
    changeLogo: string;
    description: string;
    registered: string;
    title: string;
    upload: string;
    uploading: string;
  };
  onLogoChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <Card className="bg-white shadow-xs">
      <CardContent className="flex flex-col gap-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <LogoUploadControl
            brandName={brand.name}
            imageUrl={brand.logoImageUrl}
            isUploading={isUploadingLogo}
            labels={labels}
            onLogoChange={onLogoChange}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{labels.title}</p>
            <h2 className="mt-1 truncate text-2xl font-semibold">{brand.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{labels.description}</p>
          </div>
        </div>
        <div className="w-full rounded-md border bg-[#fbfcfe] px-4 py-3 sm:w-56">
          <p className="text-xs font-medium uppercase text-muted-foreground">{labels.registered}</p>
          <p className="mt-1 text-lg font-semibold">{formattedCreatedAt}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function BrandDetailsCard({
  brand,
  isSaving,
  labels,
  onSubmit,
  saveState,
}: {
  brand: BrandOverview;
  isSaving: boolean;
  labels: {
    brandDetails: string;
    brandName: string;
    cancel: string;
    legalName: string;
    saveChanges: string;
    saveError: string;
    saved: string;
    saving: string;
  };
  onSubmit: (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => void;
  saveState: 'error' | 'idle' | 'success';
}) {
  const [hasChanges, setHasChanges] = useState(false);

  return (
    <Card className="bg-white shadow-xs">
      <CardHeader>
        <CardTitle className="text-base">{labels.brandDetails}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          key={`${brand.id}-${brand.name}-${brand.legalName ?? ''}`}
          className="space-y-5"
          onChange={() => setHasChanges(true)}
          onReset={() => setHasChanges(false)}
          onSubmit={onSubmit}
        >
          <div className="grid gap-2">
            <Label htmlFor="brand-name">{labels.brandName}</Label>
            <Input id="brand-name" name="name" defaultValue={brand.name} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="legal-name">{labels.legalName}</Label>
            <Input id="legal-name" name="legalName" defaultValue={brand.legalName ?? ''} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {saveState === 'success'
                ? labels.saved
                : saveState === 'error'
                  ? labels.saveError
                  : null}
            </p>
            <div className="flex gap-2">
              {hasChanges ? (
                <Button type="reset" variant="outline" disabled={isSaving}>
                  {labels.cancel}
                </Button>
              ) : null}
              <Button type="submit" disabled={isSaving}>
                {isSaving ? labels.saving : labels.saveChanges}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function LogoUploadControl({
  brandName,
  imageUrl,
  isUploading,
  labels,
  onLogoChange,
}: {
  brandName: string;
  imageUrl?: string | null;
  isUploading: boolean;
  labels: {
    changeLogo: string;
    upload: string;
    uploading: string;
  };
  onLogoChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label
      aria-label={labels.changeLogo}
      className="group relative flex size-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#eef3f7] shadow-sm"
      title={labels.changeLogo}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="size-full object-cover" />
      ) : (
        <span className="text-3xl font-semibold text-[#24415f]">
          {getBrandInitial(brandName)}
        </span>
      )}
      <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
        {isUploading ? labels.uploading : labels.upload}
      </span>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        disabled={isUploading}
        onChange={onLogoChange}
      />
    </label>
  );
}

function BrandPageSkeleton() {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(620px,1.35fr)]">
      <div className="space-y-6">
        <Card className="bg-white shadow-xs">
          <CardContent className="flex flex-col gap-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="size-20 animate-pulse rounded-full bg-muted" />
              <div className="flex flex-col justify-center gap-3">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-7 w-56 animate-pulse rounded bg-muted" />
                <div className="h-4 w-72 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="h-16 w-full animate-pulse rounded-md bg-muted sm:w-56" />
          </CardContent>
        </Card>
        <Card className="bg-white shadow-xs">
          <CardHeader>
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-9 animate-pulse rounded bg-muted" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-9 animate-pulse rounded bg-muted" />
            </div>
            <div className="flex justify-end">
              <div className="h-9 w-28 animate-pulse rounded bg-muted" />
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="bg-white shadow-xs">
        <CardHeader className="space-y-3">
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-7">
          {[0, 1, 2].map((section) => (
            <div key={section} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                <div className="h-8 w-24 animate-pulse rounded bg-muted" />
              </div>
              <div className="rounded-md border bg-[#fbfcfe] p-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <div className="h-9 animate-pulse rounded bg-muted" />
                  <div className="h-9 animate-pulse rounded bg-muted" />
                  <div className="h-9 w-32 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            <div className="h-9 w-28 animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getBrandInitial(name: string) {
  return name.trim()[0]?.toUpperCase() ?? '';
}

function updateAt<T>(items: T[], index: number, patch: Partial<T>) {
  return items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
}

function removeAt<T>(items: T[], index: number) {
  return items.filter((_, itemIndex) => itemIndex !== index);
}

function formatCreatedAt(created: string, locale: string) {
  const date = new Date(created);

  if (Number.isNaN(date.getTime())) {
    return created;
  }

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).format(date);
}
