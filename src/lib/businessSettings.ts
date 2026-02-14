import { z } from 'zod';

// Custom field schema
const CustomFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  showOnInvoice: z.boolean().default(true),
  type: z.enum(['text', 'email', 'phone', 'url']).default('text'),
});

// Payment method schema
const PaymentMethodSchema = z.object({
  id: z.string(),
  name: z.string(),
  details: z.string(),
  enabled: z.boolean().default(true),
});

// Fiscal information schema
const FiscalInfoSchema = z.object({
  nif: z.string().default(''), // Tax ID
  nic: z.string().default(''), // National ID
  ait: z.string().default(''), // Professional Tax
  rc: z.string().default(''),  // Commercial Register
  artisan: z.string().default(''), // Artisan Number
  activity: z.string().default(''), // Activity/Industry
});

const FiscalCustomInfoSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string().default(''),
});

// Business settings schema
const BusinessSettingsSchema = z.object({
  // Logo
  logoUrl: z.string().default(''),
  logoEnabled: z.boolean().default(true),
  
  // Business identity
  businessName: z.string().default(''),
  tagline: z.string().default(''),
  
  // Standard fields with visibility
  ownerName: z.string().default(''),
  showOwnerName: z.boolean().default(true),
  
  email: z.string().default(''),
  showEmail: z.boolean().default(true),
  
  phone: z.string().default(''),
  showPhone: z.boolean().default(true),
  
  website: z.string().default(''),
  showWebsite: z.boolean().default(true),
  
  address: z.string().default(''),
  showAddress: z.boolean().default(true),
  
  // Fiscal information
  fiscalInfo: FiscalInfoSchema.default({}),
  clientFiscalInfo: FiscalInfoSchema.default({}),
  businessCustomFiscalInfo: z.array(FiscalCustomInfoSchema).default([]),
  clientCustomFiscalInfo: z.array(FiscalCustomInfoSchema).default([]),
  
  // Tax settings
  defaultTaxRate: z.number().default(0),
  taxLabel: z.string().default('Tax'),
  
  // Currency
  currency: z.string().default('DZD'),
  currencySymbol: z.string().default('DZD'),
  
  // Custom fields
  customFields: z.array(CustomFieldSchema).default([]),
  
  // Payment methods
  paymentMethods: z.array(PaymentMethodSchema).default([]),
  
  // Invoice footer
  footerText: z.string().default('Thank you for your business!'),
  showFooter: z.boolean().default(true),
});

// Client custom field schema
const ClientCustomFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  showOnInvoice: z.boolean().default(true),
});

export type CustomField = z.infer<typeof CustomFieldSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type FiscalInfo = z.infer<typeof FiscalInfoSchema>;
export type FiscalCustomInfo = z.infer<typeof FiscalCustomInfoSchema>;
export type BusinessSettings = z.infer<typeof BusinessSettingsSchema>;
export type ClientCustomField = z.infer<typeof ClientCustomFieldSchema>;

const STORAGE_KEY = 'businessSettings';

export function getBusinessSettings(): BusinessSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return BusinessSettingsSchema.parse({});
    }
    const parsed = JSON.parse(stored);
    return BusinessSettingsSchema.parse(parsed);
  } catch (error) {
    console.warn('Failed to load business settings:', error);
    return BusinessSettingsSchema.parse({});
  }
}

export function saveBusinessSettings(settings: BusinessSettings): boolean {
  try {
    const validated = BusinessSettingsSchema.parse(settings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
    return true;
  } catch (error) {
    console.error('Failed to save business settings:', error);
    return false;
  }
}

export function generateFieldId(): string {
  return crypto.getRandomValues(new Uint8Array(8))
    .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');
}
