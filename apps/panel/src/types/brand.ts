export type BrandOverview = {
  id: number;
  name: string;
  legalName?: string | null;
  status: number | string;
  created: string;
  logoImageId?: string | null;
  logoImageUrl?: string | null;
  contacts: BrandContacts;
};

export type BrandContacts = {
  phoneNumbers: PhoneContact[];
  emailAddresses: EmailContact[];
  addresses: AddressContact[];
};

export type PhoneContact = {
  id?: number;
  phoneNumber: string;
  label?: string | null;
  isPrimary: boolean;
  isActive: boolean;
};

export type EmailContact = {
  id?: number;
  email: string;
  label?: string | null;
  isPrimary: boolean;
  isActive: boolean;
};

export type AddressContact = {
  id?: number;
  city: string;
  addressLine1: string;
  addressLine2?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isPrimary: boolean;
  isActive: boolean;
};
