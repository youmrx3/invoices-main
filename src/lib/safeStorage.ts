import { z } from 'zod';

// Schema definitions for validation
const ServiceItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  quantity: z.number(),
  rate: z.number(),
});

const CalculationLineSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  value: z.number(),
  order: z.number(),
  isSubtraction: z.boolean().default(false),
});

const SavedInvoiceSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  total: z.number(),
  paidAmount: z.number().default(0),
  invoiceNumber: z.string(),
  clientName: z.string(),
  projectName: z.string(),
  designerName: z.string().default(''),
  designerEmail: z.string().default(''),
  designerPhone: z.string().default(''),
  designerAddress: z.string().default(''),
  designerWebsite: z.string().default(''),
  clientCompany: z.string().default(''),
  clientEmail: z.string().default(''),
  clientAddress: z.string().default(''),
  invoiceDate: z.string().default(''),
  dueDate: z.string().default(''),
  services: z.array(ServiceItemSchema).default([]),
  notes: z.string().default(''),
  taxRate: z.number().default(0),
  documentType: z.string().optional(),
  calculationLines: z.array(CalculationLineSchema).optional(),
  // Business fiscal information
  designerNif: z.string().default(''),
  designerNic: z.string().default(''),
  designerAit: z.string().default(''),
  designerRc: z.string().default(''),
  designerArtisan: z.string().default(''),
  designerActivity: z.string().default(''),
  designerCustomFiscalValues: z.record(z.string()).default({}),
  // Client fiscal information
  clientNif: z.string().default(''),
  clientNic: z.string().default(''),
  clientAit: z.string().default(''),
  clientRc: z.string().default(''),
  clientArtisan: z.string().default(''),
  clientActivity: z.string().default(''),
  clientCustomFiscalValues: z.record(z.string()).default({}),
  endingPriceNumber: z.string().default(''),
  endingPriceText: z.string().default(''),
  endingPriceTextFrench: z.boolean().default(true),
  endingChoiceId: z.string().default(''),
});

const ClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  company: z.string().default(''),
  phone: z.string().default(''),
  address: z.string().default(''),
  notes: z.string().default(''),
  createdAt: z.string().optional(),
  // Fiscal information
  nif: z.string().default(''), // Tax ID
  nic: z.string().default(''), // National ID
  ait: z.string().default(''), // Professional Tax
  rc: z.string().default(''),  // Commercial Register
  artisan: z.string().default(''), // Artisan Number
  activity: z.string().default(''), // Activity/Industry
});

export type SavedInvoice = z.infer<typeof SavedInvoiceSchema>;
export type Client = z.infer<typeof ClientSchema>;

/**
 * Safely parse JSON from localStorage with validation
 * Returns a fallback value if parsing or validation fails
 */
export function safeParseJSON<T>(
  jsonString: string | null,
  schema: z.ZodSchema<T>,
  fallback: T
): T {
  if (!jsonString) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(jsonString);
    const result = schema.safeParse(parsed);
    
    if (result.success) {
      return result.data;
    } else {
      console.warn('Storage validation failed:', result.error.message);
      return fallback;
    }
  } catch (error) {
    console.warn('JSON parsing failed:', error instanceof Error ? error.message : 'Unknown error');
    return fallback;
  }
}

/**
 * Safely get and parse invoices from localStorage
 */
export function getSavedInvoices(): SavedInvoice[] {
  const invoicesSchema = z.array(SavedInvoiceSchema);
  return safeParseJSON(
    localStorage.getItem('savedInvoices'),
    invoicesSchema,
    []
  );
}

/**
 * Safely get a single invoice by ID
 */
export function getSavedInvoiceById(id: string): SavedInvoice | null {
  const invoices = getSavedInvoices();
  return invoices.find(invoice => invoice.id === id) || null;
}

/**
 * Safely save invoices to localStorage
 */
export function saveInvoices(invoices: SavedInvoice[]): boolean {
  try {
    const invoicesSchema = z.array(SavedInvoiceSchema);
    const result = invoicesSchema.safeParse(invoices);
    
    if (result.success) {
      localStorage.setItem('savedInvoices', JSON.stringify(result.data));
      window.dispatchEvent(new CustomEvent('savedInvoicesUpdated'));
      return true;
    } else {
      console.error('Invoice validation failed before save:', result.error.message);
      return false;
    }
  } catch (error) {
    console.error('Failed to save invoices:', error);
    return false;
  }
}

/**
 * Safely get and parse clients from localStorage
 */
export function getSavedClients(): Client[] {
  const clientsSchema = z.array(ClientSchema);
  return safeParseJSON(
    localStorage.getItem('clients'),
    clientsSchema,
    []
  );
}

/**
 * Safely save clients to localStorage
 */
export function saveClients(clients: Client[]): boolean {
  try {
    const clientsSchema = z.array(ClientSchema);
    const result = clientsSchema.safeParse(clients);
    
    if (result.success) {
      localStorage.setItem('clients', JSON.stringify(result.data));
      return true;
    } else {
      console.error('Client validation failed before save:', result.error.message);
      return false;
    }
  } catch (error) {
    console.error('Failed to save clients:', error);
    return false;
  }
}

/**
 * Generate a cryptographically stronger ID (still client-side, but harder to guess)
 */
export function generateSecureId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
