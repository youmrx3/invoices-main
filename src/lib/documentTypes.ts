import { z } from 'zod';

export const DocumentTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameFr: z.string(),
  nameEn: z.string(),
  prefix: z.string(),
  isDefault: z.boolean().default(false),
  isSystem: z.boolean().default(false), // System types can't be deleted
  color: z.string().default('#3b82f6'),
});

export type DocumentType = z.infer<typeof DocumentTypeSchema>;

const STORAGE_KEY = 'documentTypes';

const defaultDocumentTypes: DocumentType[] = [
  {
    id: 'invoice',
    name: 'Facture',
    nameFr: 'Facture',
    nameEn: 'Invoice',
    prefix: 'FAC',
    isDefault: true,
    isSystem: true,
    color: '#3b82f6',
  },
  {
    id: 'quote',
    name: 'Devis',
    nameFr: 'Devis',
    nameEn: 'Quote',
    prefix: 'DEV',
    isDefault: false,
    isSystem: true,
    color: '#8b5cf6',
  },
  {
    id: 'delivery_note',
    name: 'Bon de livraison',
    nameFr: 'Bon de livraison',
    nameEn: 'Delivery Note',
    prefix: 'BL',
    isDefault: false,
    isSystem: true,
    color: '#10b981',
  },
  {
    id: 'proforma',
    name: 'Proforma',
    nameFr: 'Proforma',
    nameEn: 'Proforma',
    prefix: 'PRO',
    isDefault: false,
    isSystem: true,
    color: '#06b6d4',
  },
  {
    id: 'credit_note',
    name: 'Avoir',
    nameFr: 'Avoir',
    nameEn: 'Credit Note',
    prefix: 'AVO',
    isDefault: false,
    isSystem: true,
    color: '#ef4444',
  },
];

export function getDocumentTypes(): DocumentType[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultDocumentTypes;
    }
    const parsed = JSON.parse(stored);
    const schema = z.array(DocumentTypeSchema);
    const result = schema.safeParse(parsed);
    if (result.success) {
      // Merge with defaults to ensure system types are always present
      const storedIds = result.data.map(t => t.id);
      const missingDefaults = defaultDocumentTypes.filter(d => !storedIds.includes(d.id));
      return [...result.data, ...missingDefaults];
    }
    return defaultDocumentTypes;
  } catch {
    return defaultDocumentTypes;
  }
}

export function saveDocumentTypes(types: DocumentType[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
    return true;
  } catch {
    return false;
  }
}

export function addDocumentType(type: Omit<DocumentType, 'id' | 'isSystem'>): DocumentType {
  const newType: DocumentType = {
    ...type,
    id: crypto.getRandomValues(new Uint8Array(8)).reduce((acc, b) => acc + b.toString(16).padStart(2, '0'), ''),
    isSystem: false,
  };
  
  const types = getDocumentTypes();
  saveDocumentTypes([...types, newType]);
  
  return newType;
}

export function updateDocumentType(id: string, updates: Partial<DocumentType>): boolean {
  const types = getDocumentTypes();
  const index = types.findIndex(t => t.id === id);
  
  if (index === -1) return false;
  
  types[index] = { ...types[index], ...updates };
  return saveDocumentTypes(types);
}

export function deleteDocumentType(id: string): boolean {
  const types = getDocumentTypes();
  const type = types.find(t => t.id === id);
  
  if (!type || type.isSystem) return false;
  
  return saveDocumentTypes(types.filter(t => t.id !== id));
}

export function setDefaultDocumentType(id: string): boolean {
  const types = getDocumentTypes();
  const updated = types.map(t => ({ ...t, isDefault: t.id === id }));
  return saveDocumentTypes(updated);
}

export function generateDocumentNumber(type: DocumentType): string {
  const randomPart = crypto.getRandomValues(new Uint8Array(4))
    .reduce((acc, b) => acc + b.toString(16).padStart(2, '0'), '')
    .toUpperCase()
    .substring(0, 6);
  return `${type.prefix}-${randomPart}`;
}
