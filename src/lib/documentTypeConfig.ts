import { z } from 'zod';
import { getDocumentTypes } from './documentTypes';

// Government charge schema
const GovernmentChargeSchema = z.object({
  id: z.string(),
  name: z.string(), // e.g., "Stamp Tax", "Government Fee"
  amount: z.number().positive(),
  percentage: z.boolean().default(false), // true if percentage, false if fixed amount
  isEnabled: z.boolean().default(true),
});

// Fiscal information fields to show
const FiscalFieldSchema = z.enum([
  'nif',     // Tax ID
  'nic',     // National ID
  'ait',     // Professional Tax
  'rc',      // Commercial Register
  'artisan', // Artisan Number
  'activity', // Activity/Industry
]);

const CustomFiscalFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  enabled: z.boolean().default(true),
});

const EndingChoiceSchema = z.object({
  id: z.string(),
  label: z.string(),
});

// Document type configuration
const DocumentTypeConfigSchema = z.object({
  documentTypeId: z.string(),
  
  // Business fiscal info to show
  showBusinessFiscalInfo: z.boolean().default(false),
  businessFiscalFields: z.array(z.string()).default([]),
  businessCustomFiscalFields: z.array(CustomFiscalFieldSchema).default([]),
  
  // Client fiscal info to show
  showClientFiscalInfo: z.boolean().default(false),
  clientFiscalFields: z.array(z.string()).default([]),
  clientCustomFiscalFields: z.array(CustomFiscalFieldSchema).default([]),
  
  // Government charges (taxes, fees, etc.)
  governmentCharges: z.array(GovernmentChargeSchema).default([]),
  
  // Additional settings
  requiresClientFiscalInfo: z.boolean().default(false),
  requiresBusinessFiscalInfo: z.boolean().default(false),
  
  // Display preferences
  showTaxCalculation: z.boolean().default(true),
  showDueDate: z.boolean().default(true),
  showNotes: z.boolean().default(true),

  // Paper ending block (optional per document type)
  showEndingBlock: z.boolean().default(false),
  endingLine1Text: z.string().default(''),
  endingLine2Text: z.string().default(''),
  endingChoices: z.array(EndingChoiceSchema).default([]),
  signatureImageUrl: z.string().default(''),
});

export type GovernmentCharge = z.infer<typeof GovernmentChargeSchema>;
export type FiscalField = z.infer<typeof FiscalFieldSchema>;
export type CustomFiscalField = z.infer<typeof CustomFiscalFieldSchema>;
export type DocumentTypeConfig = z.infer<typeof DocumentTypeConfigSchema>;

const STORAGE_KEY = 'documentTypeConfigs';

// Default configurations for system document types
const defaultConfigs: DocumentTypeConfig[] = [
  {
    documentTypeId: 'invoice',
    showBusinessFiscalInfo: true,
    businessFiscalFields: ['nif', 'nic', 'rc'],
    businessCustomFiscalFields: [],
    showClientFiscalInfo: true,
    clientFiscalFields: ['nif', 'nic'],
    clientCustomFiscalFields: [],
    governmentCharges: [],
    requiresClientFiscalInfo: false,
    requiresBusinessFiscalInfo: false,
    showTaxCalculation: true,
    showDueDate: true,
    showNotes: true,
    showEndingBlock: false,
    endingLine1Text: '',
    endingLine2Text: '',
    endingChoices: [],
    signatureImageUrl: '',
  },
  {
    documentTypeId: 'quote',
    showBusinessFiscalInfo: true,
    businessFiscalFields: ['nif', 'nic'],
    businessCustomFiscalFields: [],
    showClientFiscalInfo: false,
    clientFiscalFields: [],
    clientCustomFiscalFields: [],
    governmentCharges: [],
    requiresClientFiscalInfo: false,
    requiresBusinessFiscalInfo: false,
    showTaxCalculation: true,
    showDueDate: false,
    showNotes: true,
    showEndingBlock: false,
    endingLine1Text: '',
    endingLine2Text: '',
    endingChoices: [],
    signatureImageUrl: '',
  },
  {
    documentTypeId: 'delivery_note',
    showBusinessFiscalInfo: true,
    businessFiscalFields: ['nif', 'nic', 'rc'],
    businessCustomFiscalFields: [],
    showClientFiscalInfo: true,
    clientFiscalFields: ['nif', 'nic'],
    clientCustomFiscalFields: [],
    governmentCharges: [],
    requiresClientFiscalInfo: false,
    requiresBusinessFiscalInfo: false,
    showTaxCalculation: false,
    showDueDate: false,
    showNotes: true,
    showEndingBlock: false,
    endingLine1Text: '',
    endingLine2Text: '',
    endingChoices: [],
    signatureImageUrl: '',
  },
  {
    documentTypeId: 'proforma',
    showBusinessFiscalInfo: true,
    businessFiscalFields: ['nif', 'nic'],
    businessCustomFiscalFields: [],
    showClientFiscalInfo: false,
    clientFiscalFields: [],
    clientCustomFiscalFields: [],
    governmentCharges: [],
    requiresClientFiscalInfo: false,
    requiresBusinessFiscalInfo: false,
    showTaxCalculation: true,
    showDueDate: false,
    showNotes: true,
    showEndingBlock: false,
    endingLine1Text: '',
    endingLine2Text: '',
    endingChoices: [],
    signatureImageUrl: '',
  },
  {
    documentTypeId: 'credit_note',
    showBusinessFiscalInfo: true,
    businessFiscalFields: ['nif', 'nic', 'rc'],
    businessCustomFiscalFields: [],
    showClientFiscalInfo: true,
    clientFiscalFields: ['nif', 'nic'],
    clientCustomFiscalFields: [],
    governmentCharges: [],
    requiresClientFiscalInfo: false,
    requiresBusinessFiscalInfo: false,
    showTaxCalculation: true,
    showDueDate: true,
    showNotes: true,
    showEndingBlock: false,
    endingLine1Text: '',
    endingLine2Text: '',
    endingChoices: [],
    signatureImageUrl: '',
  },
];

export function getDocumentTypeConfigs(): DocumentTypeConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    const schema = z.array(DocumentTypeConfigSchema);
    const result = schema.safeParse(parsed);
    const baseConfigs = result.success ? result.data : [];

    const mergedById = new Map<string, DocumentTypeConfig>();
    baseConfigs.forEach(config => mergedById.set(config.documentTypeId, config));
    defaultConfigs.forEach(config => {
      if (!mergedById.has(config.documentTypeId)) {
        mergedById.set(config.documentTypeId, config);
      }
    });

    const types = getDocumentTypes();
    types.forEach(type => {
      if (!mergedById.has(type.id)) {
        mergedById.set(type.id, {
          documentTypeId: type.id,
          showBusinessFiscalInfo: false,
          businessFiscalFields: [],
          businessCustomFiscalFields: [],
          showClientFiscalInfo: false,
          clientFiscalFields: [],
          clientCustomFiscalFields: [],
          governmentCharges: [],
          requiresClientFiscalInfo: false,
          requiresBusinessFiscalInfo: false,
          showTaxCalculation: true,
          showDueDate: true,
          showNotes: true,
          showEndingBlock: false,
          endingLine1Text: '',
          endingLine2Text: '',
          endingChoices: [],
          signatureImageUrl: '',
        });
      }
    });

    return Array.from(mergedById.values());
  } catch {
    const types = getDocumentTypes();
    const fallbackById = new Map<string, DocumentTypeConfig>();
    defaultConfigs.forEach(config => fallbackById.set(config.documentTypeId, config));
    types.forEach(type => {
      if (!fallbackById.has(type.id)) {
        fallbackById.set(type.id, {
          documentTypeId: type.id,
          showBusinessFiscalInfo: false,
          businessFiscalFields: [],
          businessCustomFiscalFields: [],
          showClientFiscalInfo: false,
          clientFiscalFields: [],
          clientCustomFiscalFields: [],
          governmentCharges: [],
          requiresClientFiscalInfo: false,
          requiresBusinessFiscalInfo: false,
          showTaxCalculation: true,
          showDueDate: true,
          showNotes: true,
          showEndingBlock: false,
          endingLine1Text: '',
          endingLine2Text: '',
          endingChoices: [],
          signatureImageUrl: '',
        });
      }
    });
    return Array.from(fallbackById.values());
  }
}

export function getDocumentTypeConfig(documentTypeId: string): DocumentTypeConfig {
  const configs = getDocumentTypeConfigs();
  const config = configs.find(c => c.documentTypeId === documentTypeId);
  if (config) return config;
  
  // Return default config if not found
  return {
    documentTypeId,
    showBusinessFiscalInfo: false,
    businessFiscalFields: [],
    businessCustomFiscalFields: [],
    showClientFiscalInfo: false,
    clientFiscalFields: [],
    clientCustomFiscalFields: [],
    governmentCharges: [],
    requiresClientFiscalInfo: false,
    requiresBusinessFiscalInfo: false,
    showTaxCalculation: true,
    showDueDate: true,
    showNotes: true,
    showEndingBlock: false,
    endingLine1Text: '',
    endingLine2Text: '',
    endingChoices: [],
    signatureImageUrl: '',
  };
}

export function saveDocumentTypeConfigs(configs: DocumentTypeConfig[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    return true;
  } catch {
    return false;
  }
}

export function updateDocumentTypeConfig(config: DocumentTypeConfig): boolean {
  const configs = getDocumentTypeConfigs();
  const index = configs.findIndex(c => c.documentTypeId === config.documentTypeId);
  
  if (index >= 0) {
    configs[index] = config;
  } else {
    configs.push(config);
  }
  
  return saveDocumentTypeConfigs(configs);
}

export function addGovernmentCharge(
  documentTypeId: string,
  charge: Omit<GovernmentCharge, 'id'>
): boolean {
  const config = getDocumentTypeConfig(documentTypeId);
  const newCharge: GovernmentCharge = {
    ...charge,
    id: crypto.getRandomValues(new Uint8Array(8)).reduce((acc, b) => acc + b.toString(16).padStart(2, '0'), ''),
  };
  
  config.governmentCharges.push(newCharge);
  return updateDocumentTypeConfig(config);
}

export function removeGovernmentCharge(documentTypeId: string, chargeId: string): boolean {
  const config = getDocumentTypeConfig(documentTypeId);
  config.governmentCharges = config.governmentCharges.filter(c => c.id !== chargeId);
  return updateDocumentTypeConfig(config);
}

export function updateGovernmentCharge(
  documentTypeId: string,
  chargeId: string,
  updates: Partial<GovernmentCharge>
): boolean {
  const config = getDocumentTypeConfig(documentTypeId);
  const charge = config.governmentCharges.find(c => c.id === chargeId);
  
  if (!charge) return false;
  
  Object.assign(charge, updates);
  return updateDocumentTypeConfig(config);
}

// Calculate total government charges for an invoice
export function calculateGovernmentCharges(
  documentTypeId: string,
  subtotal: number
): { total: number; breakdown: { name: string; amount: number }[] } {
  const config = getDocumentTypeConfig(documentTypeId);
  const breakdown: { name: string; amount: number }[] = [];
  let total = 0;

  config.governmentCharges.forEach(charge => {
    if (!charge.isEnabled) return;
    
    const amount = charge.percentage ? (subtotal * charge.amount) / 100 : charge.amount;
    breakdown.push({ name: charge.name, amount });
    total += amount;
  });

  return { total, breakdown };
}

// Fiscal field labels
export const fiscalFieldLabels: Record<FiscalField, { fr: string; en: string }> = {
  nif: { fr: 'NIF', en: 'Tax ID' },
  nic: { fr: 'NIC', en: 'National ID' },
  ait: { fr: 'Impôt sur l\'activité professionnelle', en: 'Professional Activity Tax' },
  rc: { fr: 'Numéro RC', en: 'Commercial Register No.' },
  artisan: { fr: 'Numéro d\'artisan', en: 'Artisan Number' },
  activity: { fr: 'Activité', en: 'Activity' },
};
