import { z } from 'zod';

// Position types
export type Alignment = 'left' | 'center' | 'right';
export type SectionPosition = 'left' | 'right';

const InvoiceElementSchema = z.object({
  id: z.string(),
  label: z.string(),
  customLabel: z.string().default(''),
  visible: z.boolean().default(true),
  position: z.enum(['left', 'center', 'right']).default('left'),
  order: z.number().default(0),
});

export type InvoiceElement = z.infer<typeof InvoiceElementSchema>;

const HeaderLayoutSchema = z.object({
  // Logo
  logoPosition: z.enum(['left', 'center', 'right']).default('left'),
  logoVerticalAlign: z.enum(['top', 'center', 'bottom']).default('center'),
  showLogo: z.boolean().default(true),
  
  // Business Name & Tagline (left section)
  businessNameAlign: z.enum(['left', 'center', 'right']).default('left'),
  taglineAlign: z.enum(['left', 'center', 'right']).default('left'),
  showBusinessName: z.boolean().default(true),
  showTagline: z.boolean().default(true),
  
  // Document Title & Number (right section)
  titlePosition: z.enum(['left', 'center', 'right']).default('right'),
  titleVerticalAlign: z.enum(['top', 'center', 'bottom']).default('top'),
  showDocumentTitle: z.boolean().default(true),
  showDocumentNumber: z.boolean().default(true),
  
  // Overall header layout
  headerAlignment: z.enum(['flex-start', 'center', 'flex-end']).default('flex-start'),
});

const PartiesLayoutSchema = z.object({
  fromPosition: z.enum(['left', 'right']).default('left'),
  fromLabel: z.string().default(''),
  toLabel: z.string().default(''),
  showFrom: z.boolean().default(true),
  showTo: z.boolean().default(true),
  textAlignment: z.enum(['left', 'center', 'right']).default('left'),
});

const SectionAlignmentSchema = z.object({
  alignment: z.enum(['left', 'center', 'right']).default('left'),
});

const MetaFieldSchema = z.object({
  id: z.string(),
  key: z.enum(['project', 'invoiceDate', 'dueDate']),
  label: z.string().default(''),
  visible: z.boolean().default(true),
  order: z.number().default(0),
  alignment: z.enum(['left', 'center', 'right']).default('center'),
});

export type MetaField = z.infer<typeof MetaFieldSchema>;

const SectionsOrderSchema = z.object({
  id: z.string(),
  key: z.enum(['services', 'totals', 'payment', 'notes', 'footer']),
  label: z.string().default(''),
  visible: z.boolean().default(true),
  order: z.number().default(0),
  alignment: z.enum(['left', 'center', 'right']).default('left'),
});

export type SectionOrder = z.infer<typeof SectionsOrderSchema>;

const InvoiceLayoutSchema = z.object({
  header: HeaderLayoutSchema.default({}),
  parties: PartiesLayoutSchema.default({}),
  metaFields: z.array(MetaFieldSchema).default([
    { id: '1', key: 'project', label: '', visible: true, order: 0, alignment: 'center' },
    { id: '2', key: 'invoiceDate', label: '', visible: true, order: 1, alignment: 'center' },
    { id: '3', key: 'dueDate', label: '', visible: true, order: 2, alignment: 'center' },
  ]),
  sections: z.array(SectionsOrderSchema).default([
    { id: '1', key: 'services', label: '', visible: true, order: 0, alignment: 'left' },
    { id: '2', key: 'totals', label: '', visible: true, order: 1, alignment: 'right' },
    { id: '3', key: 'payment', label: '', visible: true, order: 2, alignment: 'left' },
    { id: '4', key: 'notes', label: '', visible: true, order: 3, alignment: 'left' },
    { id: '5', key: 'footer', label: '', visible: true, order: 4, alignment: 'center' },
  ]),
  // Custom labels for table columns
  tableLabels: z.object({
    description: z.string().default(''),
    quantity: z.string().default(''),
    rate: z.string().default(''),
    amount: z.string().default(''),
  }).default({}),
  // Custom labels for totals
  totalsLabels: z.object({
    subtotal: z.string().default(''),
    tax: z.string().default(''),
    total: z.string().default(''),
  }).default({}),
});

export type InvoiceLayout = z.infer<typeof InvoiceLayoutSchema>;
export type HeaderLayout = z.infer<typeof HeaderLayoutSchema>;
export type PartiesLayout = z.infer<typeof PartiesLayoutSchema>;

const STORAGE_KEY = 'invoiceLayout';

export function getInvoiceLayout(): InvoiceLayout {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return InvoiceLayoutSchema.parse({});
    return InvoiceLayoutSchema.parse(JSON.parse(stored));
  } catch {
    return InvoiceLayoutSchema.parse({});
  }
}

export function saveInvoiceLayout(layout: InvoiceLayout): boolean {
  try {
    const validated = InvoiceLayoutSchema.parse(layout);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
    return true;
  } catch (error) {
    console.error('Failed to save invoice layout:', error);
    return false;
  }
}

// Default labels per language
export function getDefaultLabel(key: string, lang: 'fr' | 'en'): string {
  const labels: Record<string, Record<string, string>> = {
    from: { fr: 'De', en: 'From' },
    to: { fr: 'À', en: 'To' },
    project: { fr: 'Projet', en: 'Project' },
    invoiceDate: { fr: 'Date', en: 'Date' },
    dueDate: { fr: 'Échéance', en: 'Due Date' },
    description: { fr: 'Description', en: 'Description' },
    quantity: { fr: 'Qté', en: 'Qty' },
    rate: { fr: 'Prix unitaire', en: 'Rate' },
    amount: { fr: 'Montant', en: 'Amount' },
    subtotal: { fr: 'Sous-total', en: 'Subtotal' },
    tax: { fr: 'TVA', en: 'Tax' },
    total: { fr: 'Total', en: 'Total' },
    services: { fr: 'Prestations', en: 'Services' },
    totals: { fr: 'Totaux', en: 'Totals' },
    payment: { fr: 'Paiement', en: 'Payment' },
    notes: { fr: 'Notes', en: 'Notes' },
    footer: { fr: 'Pied de page', en: 'Footer' },
  };
  return labels[key]?.[lang] || key;
}
