import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Settings, FileText, Users, Calculator, Receipt, Trash2, History, ChevronRight, Plus, Copy, Download, Edit2, Sparkles, ArrowRight, Layout } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SmartClientSearch from './invoice/SmartClientSearch';
import ClientHistoryPanel from './invoice/ClientHistoryPanel';
import BusinessSettingsDialog from './invoice/BusinessSettingsDialog';
import DocumentTypeSelector from './invoice/DocumentTypeSelector';
import CalculationLinesEditor from './invoice/CalculationLinesEditor';
import InvoiceLayoutDialog from './invoice/InvoiceLayoutDialog';
import LanguageSelector from './LanguageSelector';
import { getSavedInvoices, saveInvoices, generateSecureId, SavedInvoice as StoredInvoice, Client } from '@/lib/safeStorage';
import { getBusinessSettings, type BusinessSettings } from '@/lib/businessSettings';
import { getDocumentTypes, generateDocumentNumber, type DocumentType } from '@/lib/documentTypes';
import { getDocumentTypeConfig, calculateGovernmentCharges } from '@/lib/documentTypeConfig';
import { type CalculationLine, calculateWithCustomLines } from '@/lib/calculationLines';
import { t, getLanguage, type Language } from '@/lib/i18n';
import { getInvoiceLayout, getDefaultLabel, type InvoiceLayout } from '@/lib/invoiceLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';

interface ServiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

interface InvoiceData {
  designerName: string;
  designerEmail: string;
  designerPhone: string;
  designerAddress: string;
  designerWebsite: string;
  designerNif: string;
  designerNic: string;
  designerAit: string;
  designerRc: string;
  designerArtisan: string;
  designerActivity: string;
  designerCustomFiscalValues: Record<string, string>;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientAddress: string;
  clientNif: string;
  clientNic: string;
  clientAit: string;
  clientRc: string;
  clientArtisan: string;
  clientActivity: string;
  clientCustomFiscalValues: Record<string, string>;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  projectName: string;
  services: ServiceItem[];
  notes: string;
  taxRate: number;
  endingPriceNumber: string;
  endingPriceText: string;
  endingPriceTextFrench: boolean;
  endingChoiceId: string;
  documentType?: string;
  calculationLines?: CalculationLine[];
}

interface SavedInvoice extends InvoiceData {
  id: string;
  createdAt: string;
  total: number;
}

const convertBelowThousandEn = (num: number): string => {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  if (num === 0) return '';
  if (num < 10) return ones[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) {
    const ten = Math.floor(num / 10);
    const unit = num % 10;
    return unit ? `${tens[ten]}-${ones[unit]}` : tens[ten];
  }

  const hundred = Math.floor(num / 100);
  const rest = num % 100;
  const hundredText = `${ones[hundred]} hundred`;
  return rest ? `${hundredText} ${convertBelowThousandEn(rest)}` : hundredText;
};

const numberToWordsEn = (num: number): string => {
  if (!Number.isFinite(num)) return '';
  if (num === 0) return 'zero';

  const scales = [
    { value: 1_000_000_000, label: 'billion' },
    { value: 1_000_000, label: 'million' },
    { value: 1_000, label: 'thousand' },
  ];

  let remainder = Math.floor(Math.abs(num));
  const parts: string[] = [];

  scales.forEach(scale => {
    if (remainder >= scale.value) {
      const chunk = Math.floor(remainder / scale.value);
      remainder %= scale.value;
      parts.push(`${convertBelowThousandEn(chunk)} ${scale.label}`);
    }
  });

  if (remainder > 0) parts.push(convertBelowThousandEn(remainder));
  return parts.join(' ').trim();
};

const convertBelowThousandFr = (num: number): string => {
  const ones = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];

  if (num === 0) return '';
  if (num < 10) return ones[num];
  if (num < 20) return teens[num - 10];
  if (num < 70) {
    const ten = Math.floor(num / 10);
    const unit = num % 10;
    const base = tens[ten];
    if (unit === 1) return `${base} et un`;
    return unit ? `${base}-${ones[unit]}` : base;
  }
  if (num < 80) {
    if (num === 71) return 'soixante et onze';
    return `soixante-${convertBelowThousandFr(num - 60)}`;
  }
  if (num < 100) {
    if (num === 80) return 'quatre-vingts';
    return `quatre-vingt-${convertBelowThousandFr(num - 80)}`;
  }

  const hundred = Math.floor(num / 100);
  const rest = num % 100;
  const hundredWord = hundred === 1 ? 'cent' : `${ones[hundred]} cent`;
  return rest ? `${hundredWord} ${convertBelowThousandFr(rest)}` : hundredWord;
};

const numberToWordsFr = (num: number): string => {
  if (!Number.isFinite(num)) return '';
  if (num === 0) return 'zéro';

  let remainder = Math.floor(Math.abs(num));
  const parts: string[] = [];

  const billions = Math.floor(remainder / 1_000_000_000);
  if (billions > 0) {
    parts.push(`${convertBelowThousandFr(billions)} ${billions > 1 ? 'milliards' : 'milliard'}`);
    remainder %= 1_000_000_000;
  }

  const millions = Math.floor(remainder / 1_000_000);
  if (millions > 0) {
    parts.push(`${convertBelowThousandFr(millions)} ${millions > 1 ? 'millions' : 'million'}`);
    remainder %= 1_000_000;
  }

  const thousands = Math.floor(remainder / 1_000);
  if (thousands > 0) {
    parts.push(thousands === 1 ? 'mille' : `${convertBelowThousandFr(thousands)} mille`);
    remainder %= 1_000;
  }

  if (remainder > 0) parts.push(convertBelowThousandFr(remainder));
  return parts.join(' ').trim();
};

const InvoiceGenerator = () => {
  const { toast } = useToast();
  const [language, setLanguageState] = useState<Language>(getLanguage());
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(getBusinessSettings);
  const [documentType, setDocumentType] = useState<DocumentType | null>(null);
  const [calculationLines, setCalculationLines] = useState<CalculationLine[]>([]);
  const [invoiceLayout, setInvoiceLayout] = useState<InvoiceLayout>(getInvoiceLayout);

  const buildCustomFiscalValueMap = (customFiscalInfo: { id: string; value: string }[] = []) =>
    Object.fromEntries(customFiscalInfo.map(field => [field.id, field.value || '']));
  
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(() => {
    const settings = getBusinessSettings();
    const types = getDocumentTypes();
    const defaultType = types.find(t => t.isDefault) || types[0];
    const defaultConfig = defaultType ? getDocumentTypeConfig(defaultType.id) : null;
    
    return {
      designerName: settings.ownerName || '',
      designerEmail: settings.email || '',
      designerPhone: settings.phone || '',
      designerAddress: settings.address || '',
      designerWebsite: settings.website || '',
      designerNif: settings.fiscalInfo?.nif || '',
      designerNic: settings.fiscalInfo?.nic || '',
      designerAit: settings.fiscalInfo?.ait || '',
      designerRc: settings.fiscalInfo?.rc || '',
      designerArtisan: settings.fiscalInfo?.artisan || '',
      designerActivity: settings.fiscalInfo?.activity || '',
      designerCustomFiscalValues: buildCustomFiscalValueMap(settings.businessCustomFiscalInfo),
      clientName: '',
      clientCompany: '',
      clientEmail: '',
      clientAddress: '',
      clientNif: settings.clientFiscalInfo?.nif || '',
      clientNic: settings.clientFiscalInfo?.nic || '',
      clientAit: settings.clientFiscalInfo?.ait || '',
      clientRc: settings.clientFiscalInfo?.rc || '',
      clientArtisan: settings.clientFiscalInfo?.artisan || '',
      clientActivity: settings.clientFiscalInfo?.activity || '',
      clientCustomFiscalValues: buildCustomFiscalValueMap(settings.clientCustomFiscalInfo),
      invoiceNumber: defaultType ? generateDocumentNumber(defaultType) : `INV-${generateSecureId().substring(0, 8).toUpperCase()}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      projectName: '',
      services: [{ id: '1', description: '', quantity: 1, rate: 0 }],
      notes: '',
      taxRate: settings.defaultTaxRate || 0,
      endingPriceNumber: '',
      endingPriceText: '',
      endingPriceTextFrench: true,
      endingChoiceId: defaultConfig?.endingChoices?.[0]?.id || '',
      documentType: defaultType?.id,
      calculationLines: [],
    };
  });

  const [savedInvoices, setSavedInvoices] = useState<SavedInvoice[]>(() => {
    return getSavedInvoices() as SavedInvoice[];
  });
  
  const [selectedClient, setSelectedClient] = useState<(Client & { invoiceHistory?: StoredInvoice[] }) | null>(null);
  const [activeTab, setActiveTab] = useState('create');
  const [papersTypeFilter, setPapersTypeFilter] = useState<string>('all');
  const [sectionsOpen, setSectionsOpen] = useState({
    client: true,
    details: true,
    services: true,
    calculations: true,
    notes: false,
  });
  // Derive document type config
  const documentTypeConfig = invoiceData.documentType ? getDocumentTypeConfig(invoiceData.documentType) : null;

  // Listen for language changes
  useEffect(() => {
    const handleLangChange = (e: CustomEvent<Language>) => {
      setLanguageState(e.detail);
    };
    window.addEventListener('languageChange', handleLangChange as EventListener);
    return () => window.removeEventListener('languageChange', handleLangChange as EventListener);
  }, []);

  const handleSettingsChange = (newSettings: BusinessSettings) => {
    setBusinessSettings(newSettings);
    setInvoiceData(prev => ({
      ...prev,
      designerName: newSettings.ownerName || prev.designerName,
      designerEmail: newSettings.email || prev.designerEmail,
      designerPhone: newSettings.phone || prev.designerPhone,
      designerAddress: newSettings.address || prev.designerAddress,
      designerWebsite: newSettings.website || prev.designerWebsite,
      designerNif: newSettings.fiscalInfo?.nif || prev.designerNif,
      designerNic: newSettings.fiscalInfo?.nic || prev.designerNic,
      designerAit: newSettings.fiscalInfo?.ait || prev.designerAit,
      designerRc: newSettings.fiscalInfo?.rc || prev.designerRc,
      designerArtisan: newSettings.fiscalInfo?.artisan || prev.designerArtisan,
      designerActivity: newSettings.fiscalInfo?.activity || prev.designerActivity,
      designerCustomFiscalValues: {
        ...buildCustomFiscalValueMap(newSettings.businessCustomFiscalInfo),
        ...(prev.designerCustomFiscalValues || {}),
      },
      clientNif: newSettings.clientFiscalInfo?.nif || prev.clientNif,
      clientNic: newSettings.clientFiscalInfo?.nic || prev.clientNic,
      clientAit: newSettings.clientFiscalInfo?.ait || prev.clientAit,
      clientRc: newSettings.clientFiscalInfo?.rc || prev.clientRc,
      clientArtisan: newSettings.clientFiscalInfo?.artisan || prev.clientArtisan,
      clientActivity: newSettings.clientFiscalInfo?.activity || prev.clientActivity,
      clientCustomFiscalValues: {
        ...buildCustomFiscalValueMap(newSettings.clientCustomFiscalInfo),
        ...(prev.clientCustomFiscalValues || {}),
      },
      taxRate: newSettings.defaultTaxRate || prev.taxRate,
    }));
  };

  const handleDocumentTypeChange = (type: DocumentType) => {
    const config = getDocumentTypeConfig(type.id);

    setDocumentType(type);
    setInvoiceData(prev => ({
      ...prev,
      invoiceNumber: generateDocumentNumber(type),
      documentType: type.id,
      endingChoiceId: config.endingChoices.some(choice => choice.id === prev.endingChoiceId)
        ? prev.endingChoiceId
        : (config.endingChoices[0]?.id || ''),
    }));
  };

  const updateInvoiceData = (field: keyof InvoiceData, value: string | number | boolean | ServiceItem[] | CalculationLine[] | Record<string, string>) => {
    setInvoiceData(prev => ({ ...prev, [field]: value }));
  };

  const updateCustomFiscalValue = (scope: 'business' | 'client', key: string, value: string) => {
    if (scope === 'business') {
      setInvoiceData(prev => ({
        ...prev,
        designerCustomFiscalValues: {
          ...(prev.designerCustomFiscalValues || {}),
          [key]: value,
        },
      }));
      return;
    }

    setInvoiceData(prev => ({
      ...prev,
      clientCustomFiscalValues: {
        ...(prev.clientCustomFiscalValues || {}),
        [key]: value,
      },
    }));
  };

  const handleClientSelect = (client: Client & { invoiceHistory?: StoredInvoice[] }) => {
    setSelectedClient(client);
    setInvoiceData(prev => ({
      ...prev,
      clientName: client.name,
      clientEmail: client.email,
      clientCompany: client.company || '',
      clientAddress: client.address || prev.clientAddress,
      clientNif: client.nif || prev.clientNif,
      clientNic: client.nic || prev.clientNic,
      clientAit: client.ait || prev.clientAit,
      clientRc: client.rc || prev.clientRc,
      clientArtisan: client.artisan || prev.clientArtisan,
      clientActivity: client.activity || prev.clientActivity,
    }));
    setSectionsOpen(prev => ({ ...prev, client: false }));
    
    toast({
      title: t('selectClient'),
      description: `${client.name} - ${client.invoiceHistory?.length || 0} ${t('invoices').toLowerCase()}`,
    });
  };

  const handleApplyService = (description: string, rate: number, quantity: number) => {
    const newService: ServiceItem = {
      id: generateSecureId(),
      description,
      quantity,
      rate
    };
    
    const emptyServiceIndex = invoiceData.services.findIndex(
      s => !s.description && s.rate === 0
    );
    
    if (emptyServiceIndex !== -1) {
      setInvoiceData(prev => ({
        ...prev,
        services: prev.services.map((s, i) => 
          i === emptyServiceIndex ? newService : s
        )
      }));
    } else {
      setInvoiceData(prev => ({
        ...prev,
        services: [...prev.services, newService]
      }));
    }
    
    toast({
      title: t('addService'),
      description: `"${description}" - ${rate} ${businessSettings.currencySymbol}`,
    });
  };

  const handleLoadInvoice = (invoice: StoredInvoice) => {
    const types = getDocumentTypes();
    const type = types.find(t => t.id === invoice.documentType) || types.find(t => t.isDefault) || types[0];
    const typeConfig = type ? getDocumentTypeConfig(type.id) : null;
    
    setInvoiceData({
      designerName: invoice.designerName || businessSettings.ownerName || '',
      designerEmail: invoice.designerEmail || businessSettings.email || '',
      designerPhone: invoice.designerPhone || businessSettings.phone || '',
      designerAddress: invoice.designerAddress || businessSettings.address || '',
      designerWebsite: invoice.designerWebsite || businessSettings.website || '',
      designerNif: invoice.designerNif || businessSettings.fiscalInfo?.nif || '',
      designerNic: invoice.designerNic || businessSettings.fiscalInfo?.nic || '',
      designerAit: invoice.designerAit || businessSettings.fiscalInfo?.ait || '',
      designerRc: invoice.designerRc || businessSettings.fiscalInfo?.rc || '',
      designerArtisan: invoice.designerArtisan || businessSettings.fiscalInfo?.artisan || '',
      designerActivity: invoice.designerActivity || businessSettings.fiscalInfo?.activity || '',
      designerCustomFiscalValues: invoice.designerCustomFiscalValues || buildCustomFiscalValueMap(businessSettings.businessCustomFiscalInfo),
      clientName: invoice.clientName || '',
      clientCompany: invoice.clientCompany || '',
      clientEmail: invoice.clientEmail || '',
      clientAddress: invoice.clientAddress || '',
      clientNif: invoice.clientNif || businessSettings.clientFiscalInfo?.nif || '',
      clientNic: invoice.clientNic || businessSettings.clientFiscalInfo?.nic || '',
      clientAit: invoice.clientAit || businessSettings.clientFiscalInfo?.ait || '',
      clientRc: invoice.clientRc || businessSettings.clientFiscalInfo?.rc || '',
      clientArtisan: invoice.clientArtisan || businessSettings.clientFiscalInfo?.artisan || '',
      clientActivity: invoice.clientActivity || businessSettings.clientFiscalInfo?.activity || '',
      clientCustomFiscalValues: invoice.clientCustomFiscalValues || buildCustomFiscalValueMap(businessSettings.clientCustomFiscalInfo),
      invoiceNumber: type ? generateDocumentNumber(type) : `INV-${generateSecureId().substring(0, 8).toUpperCase()}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      projectName: invoice.projectName || '',
      notes: invoice.notes || '',
      taxRate: invoice.taxRate || businessSettings.defaultTaxRate || 0,
      endingPriceNumber: invoice.endingPriceNumber || '',
      endingPriceText: invoice.endingPriceText || '',
      endingPriceTextFrench: typeof invoice.endingPriceTextFrench === 'boolean' ? invoice.endingPriceTextFrench : true,
      endingChoiceId: invoice.endingChoiceId || (typeConfig?.endingChoices?.[0]?.id || ''),
      documentType: type?.id,
      calculationLines: [],
      services: invoice.services.map(s => ({
        id: generateSecureId(),
        description: s.description || '',
        quantity: s.quantity || 1,
        rate: s.rate || 0
      }))
    });
    
    if (type) setDocumentType(type);
    setActiveTab('create');
    
    toast({
      title: t('templateApplied'),
      description: t('useAsTemplate'),
    });
  };

  const addService = () => {
    const newService: ServiceItem = {
      id: generateSecureId(),
      description: '',
      quantity: 1,
      rate: 0
    };
    setInvoiceData(prev => ({
      ...prev,
      services: [...prev.services, newService]
    }));
  };

  const updateService = (id: string, field: keyof ServiceItem, value: string | number) => {
    setInvoiceData(prev => ({
      ...prev,
      services: prev.services.map(service =>
        service.id === id ? { ...service, [field]: value } : service
      )
    }));
  };

  const removeService = (id: string) => {
    setInvoiceData(prev => ({
      ...prev,
      services: prev.services.filter(service => service.id !== id)
    }));
  };

  const calculateSubtotal = (services = invoiceData.services) => {
    return services.reduce((sum, service) => sum + (service.quantity * service.rate), 0);
  };

  const getCalculations = () => {
    const subtotal = calculateSubtotal();
    return calculateWithCustomLines(
      subtotal,
      invoiceData.taxRate,
      businessSettings.taxLabel || t('tax'),
      calculationLines
    );
  };

  const fiscalBuiltInIds = ['nif', 'nic', 'ait', 'rc', 'artisan', 'activity'];
  const fiscalBuiltInLabels: Record<string, string> = {
    nif: 'NIF',
    nic: 'NIC',
    ait: 'AIT',
    rc: 'RC',
    artisan: language === 'fr' ? 'Artisan' : 'Artisan',
    activity: language === 'fr' ? 'Activité' : 'Activity',
  };

  const mergeCustomFiscalFields = (
    configFields: { id: string; label: string; enabled: boolean }[] = [],
    globalFields: { id: string; label: string }[] = []
  ) => {
    const merged = new Map<string, { id: string; label: string; enabled: boolean }>();

    globalFields.forEach((field) => {
      merged.set(field.id, { id: field.id, label: field.label, enabled: true });
    });

    configFields.forEach((field) => {
      merged.set(field.id, field);
    });

    return Array.from(merged.values()).filter(field => field.enabled);
  };

  const globalBusinessCustomFields = (businessSettings.businessCustomFiscalInfo || [])
    .filter(field => field.label.trim().length > 0)
    .map(field => ({ id: field.id, label: field.label }));

  const globalClientCustomFields = (businessSettings.clientCustomFiscalInfo || [])
    .filter(field => field.label.trim().length > 0)
    .map(field => ({ id: field.id, label: field.label }));

  const getBusinessFiscalEntries = (data: InvoiceData) => {
    if (!documentTypeConfig?.showBusinessFiscalInfo) return [];

    const builtInValues: Record<string, string> = {
      nif: data.designerNif,
      nic: data.designerNic,
      ait: data.designerAit,
      rc: data.designerRc,
      artisan: data.designerArtisan,
      activity: data.designerActivity,
    };

    const builtInEntries = fiscalBuiltInIds
      .filter(id => documentTypeConfig.businessFiscalFields.includes(id))
      .map(id => ({ key: fiscalBuiltInLabels[id], value: builtInValues[id] || '' }));

    const customEntries = mergeCustomFiscalFields(
      documentTypeConfig.businessCustomFiscalFields || [],
      globalBusinessCustomFields
    )
      .map(field => ({
        key: field.label,
        value: (data.designerCustomFiscalValues || {})[field.id] || '',
      }));

    return [...builtInEntries, ...customEntries].filter(entry => entry.value && entry.value.trim().length > 0);
  };

  const getClientFiscalEntries = (data: InvoiceData) => {
    if (!documentTypeConfig?.showClientFiscalInfo) return [];

    const builtInValues: Record<string, string> = {
      nif: data.clientNif,
      nic: data.clientNic,
      ait: data.clientAit,
      rc: data.clientRc,
      artisan: data.clientArtisan,
      activity: data.clientActivity,
    };

    const builtInEntries = fiscalBuiltInIds
      .filter(id => documentTypeConfig.clientFiscalFields.includes(id))
      .map(id => ({ key: fiscalBuiltInLabels[id], value: builtInValues[id] || '' }));

    const customEntries = mergeCustomFiscalFields(
      documentTypeConfig.clientCustomFiscalFields || [],
      globalClientCustomFields
    )
      .map(field => ({
        key: field.label,
        value: (data.clientCustomFiscalValues || {})[field.id] || '',
      }));

    return [...builtInEntries, ...customEntries].filter(entry => entry.value && entry.value.trim().length > 0);
  };

  const getMissingRequiredFiscalFields = (data: InvoiceData): string[] => {
    if (!documentTypeConfig) return [];

    const missing: string[] = [];
    const businessFieldMap: Record<string, string> = {
      nif: data.designerNif,
      nic: data.designerNic,
      ait: data.designerAit,
      rc: data.designerRc,
      artisan: data.designerArtisan,
      activity: data.designerActivity,
    };
    const clientFieldMap: Record<string, string> = {
      nif: data.clientNif,
      nic: data.clientNic,
      ait: data.clientAit,
      rc: data.clientRc,
      artisan: data.clientArtisan,
      activity: data.clientActivity,
    };

    if (documentTypeConfig.requiresBusinessFiscalInfo) {
      documentTypeConfig.businessFiscalFields.forEach((fieldKey) => {
        const value = businessFieldMap[fieldKey];
        if (!value || value.trim().length === 0) {
          missing.push(`Business ${fieldKey.toUpperCase()}`);
        }
      });

      (documentTypeConfig.businessCustomFiscalFields || [])
        .filter(field => field.enabled)
        .forEach((field) => {
          const value = (data.designerCustomFiscalValues || {})[field.id] || '';
          if (!value || value.trim().length === 0) {
            missing.push(`Business ${field.label}`);
          }
        });
    }

    if (documentTypeConfig.requiresClientFiscalInfo) {
      documentTypeConfig.clientFiscalFields.forEach((fieldKey) => {
        const value = clientFieldMap[fieldKey];
        if (!value || value.trim().length === 0) {
          missing.push(`Client ${fieldKey.toUpperCase()}`);
        }
      });

      (documentTypeConfig.clientCustomFiscalFields || [])
        .filter(field => field.enabled)
        .forEach((field) => {
          const value = (data.clientCustomFiscalValues || {})[field.id] || '';
          if (!value || value.trim().length === 0) {
            missing.push(`Client ${field.label}`);
          }
        });
    }

    return missing;
  };

  const saveInvoiceHandler = () => {
    const missingFiscal = getMissingRequiredFiscalFields(invoiceData);
    if (missingFiscal.length > 0) {
      toast({
        title: language === 'fr' ? 'Informations fiscales requises manquantes' : 'Missing required fiscal information',
        description: missingFiscal.join(', '),
        variant: 'destructive',
      });
      return;
    }

    const calculations = getCalculations();
    const govCharges = invoiceData.documentType
      ? calculateGovernmentCharges(invoiceData.documentType, calculations.subtotal)
      : { total: 0, breakdown: [] as { name: string; amount: number }[] };
    
    const newInvoice: SavedInvoice = {
      ...invoiceData,
      id: generateSecureId(),
      createdAt: new Date().toISOString(),
      total: calculations.balanceDue + govCharges.total,
      calculationLines,
    };
    
    const updatedInvoices = [newInvoice, ...savedInvoices];
    setSavedInvoices(updatedInvoices);
    saveInvoices(updatedInvoices as StoredInvoice[]);
    
    const newNumber = documentType 
      ? generateDocumentNumber(documentType) 
      : `INV-${generateSecureId().substring(0, 8).toUpperCase()}`;
    
    setInvoiceData(prev => ({
      ...prev,
      invoiceNumber: newNumber
    }));

    toast({
      title: t('documentSaved'),
      description: documentType ? `${documentType.nameFr} #${invoiceData.invoiceNumber}` : t('invoiceSaved'),
    });
  };

  const exportToPDF = (invoice?: SavedInvoice) => {
    const dataToUse = invoice || invoiceData;
    const missingFiscal = getMissingRequiredFiscalFields(dataToUse as InvoiceData);
    if (missingFiscal.length > 0) {
      toast({
        title: language === 'fr' ? 'Informations fiscales requises manquantes' : 'Missing required fiscal information',
        description: missingFiscal.join(', '),
        variant: 'destructive',
      });
      return;
    }

    const settings = businessSettings;
    const layout = invoiceLayout;
    const subtotal = dataToUse.services.reduce((sum, service) => sum + (service.quantity * service.rate), 0);
    const activeCalculationLines = dataToUse.calculationLines || calculationLines;
    const calculations = calculateWithCustomLines(
      subtotal,
      dataToUse.taxRate,
      settings.taxLabel || t('tax'),
      activeCalculationLines
    );
    const configForExport = dataToUse.documentType ? getDocumentTypeConfig(dataToUse.documentType) : null;
    const govCharges = dataToUse.documentType
      ? calculateGovernmentCharges(dataToUse.documentType, calculations.subtotal)
      : { total: 0, breakdown: [] as { name: string; amount: number }[] };
    const finalTotal = calculations.balanceDue + govCharges.total;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const currency = settings.currencySymbol || 'DZD';
      const docTypeName = documentType ? (language === 'fr' ? documentType.nameFr : documentType.nameEn) : t('invoice');
      const fromLabel = layout.parties.fromLabel || getDefaultLabel('from', language);
      const toLabel = layout.parties.toLabel || getDefaultLabel('to', language);

      const paymentMethodsHtml = settings.paymentMethods
        .filter(m => m.enabled)
        .map(m => `
          <div style="margin-bottom: 10px;">
            <strong style="color: #047857;">${m.name}</strong>
            <div style="white-space: pre-line; margin-top: 2px; font-size: 11px; color: #065f46;">${m.details}</div>
          </div>
        `).join('');

      const customFieldsHtml = settings.customFields
        .filter(f => f.showOnInvoice && f.value)
        .map(f => `<p style="margin: 2px 0; font-size: 11px;"><strong>${f.label}:</strong> ${f.value}</p>`)
        .join('');

      const calculationLinesHtml = calculations.lines.map(line => `
        <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px;">
          <span style="color: ${line.isSubtraction ? '#dc2626' : '#059669'};">${line.label}</span>
          <span style="font-weight: 500; color: ${line.isSubtraction ? '#dc2626' : '#059669'};">
            ${line.isSubtraction ? '-' : '+'}${line.value.toFixed(2)} ${currency}
          </span>
        </div>
      `).join('');

      const exportBusinessCustomFields = mergeCustomFiscalFields(
        configForExport?.businessCustomFiscalFields || [],
        globalBusinessCustomFields
      );

      const exportClientCustomFields = mergeCustomFiscalFields(
        configForExport?.clientCustomFiscalFields || [],
        globalClientCustomFields
      );

      const businessFiscalEntries = configForExport?.showBusinessFiscalInfo
        ? [
            ...[
              { id: 'nif', value: dataToUse.designerNif },
              { id: 'nic', value: dataToUse.designerNic },
              { id: 'ait', value: dataToUse.designerAit },
              { id: 'rc', value: dataToUse.designerRc },
              { id: 'artisan', value: dataToUse.designerArtisan },
              { id: 'activity', value: dataToUse.designerActivity },
            ]
              .filter(entry => configForExport.businessFiscalFields.includes(entry.id))
              .map(entry => ({ key: fiscalBuiltInLabels[entry.id], value: entry.value })),
            ...exportBusinessCustomFields
              .map(field => ({
                key: field.label,
                value: (dataToUse.designerCustomFiscalValues || {})[field.id] || '',
              })),
          ].filter(entry => entry.value && entry.value.trim().length > 0)
        : [];

      const clientFiscalEntries = configForExport?.showClientFiscalInfo
        ? [
            ...[
              { id: 'nif', value: dataToUse.clientNif },
              { id: 'nic', value: dataToUse.clientNic },
              { id: 'ait', value: dataToUse.clientAit },
              { id: 'rc', value: dataToUse.clientRc },
              { id: 'artisan', value: dataToUse.clientArtisan },
              { id: 'activity', value: dataToUse.clientActivity },
            ]
              .filter(entry => configForExport.clientFiscalFields.includes(entry.id))
              .map(entry => ({ key: fiscalBuiltInLabels[entry.id], value: entry.value })),
            ...exportClientCustomFields
              .map(field => ({
                key: field.label,
                value: (dataToUse.clientCustomFiscalValues || {})[field.id] || '',
              })),
          ].filter(entry => entry.value && entry.value.trim().length > 0)
        : [];

      const govChargesHtml = govCharges.breakdown.map(charge => `
        <div class="totals-row">
          <span>${charge.name}</span>
          <span style="font-weight: 500;">${charge.amount.toFixed(2)} ${currency}</span>
        </div>
      `).join('');

      const endingChoiceLabel = configForExport?.endingChoices.find(choice => choice.id === dataToUse.endingChoiceId)?.label || '';
      const endingWordsComputed = numberToWordsFr(finalTotal);
      const endingBlockHtml = configForExport?.showEndingBlock
        ? `
          <div class="ending-block">
            <div class="ending-left">
              <div class="ending-row">
                <span class="ending-text">${configForExport.endingLine1Text || ''}</span>
              </div>
              ${endingWordsComputed ? `
                <div class="ending-row">
                  <span class="ending-text" style="font-style: italic; color: #374151;">${endingWordsComputed}</span>
                </div>
              ` : ''}
              <div class="ending-row">
                <span class="ending-text">${configForExport.endingLine2Text || ''}</span>
                <span class="ending-value">${endingChoiceLabel}</span>
              </div>
            </div>
            <div class="ending-right">
              ${configForExport.signatureImageUrl ? `<img src="${configForExport.signatureImageUrl}" alt="Signature" class="ending-signature" />` : ''}
            </div>
          </div>
        `
        : '';

      const headerHtml = `
        <div class="header" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 3px solid ${documentType?.color || '#3b82f6'};">
          <!-- Left: Logo and Business Info -->
          <div style="flex: 1;">
            <div class="brand" style="display: flex; align-items: center; gap: 12px;">
              ${layout.header.showLogo && settings.logoEnabled && settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" class="logo" style="max-height: 50px; max-width: 150px; object-fit: contain;" />` : ''}
              <div class="brand-text" style="flex: 1;">
                ${layout.header.showBusinessName ? `<h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0;">${settings.businessName || docTypeName}</h1>` : ''}
                ${layout.header.showTagline && settings.tagline ? `<p style="font-size: 12px; color: #6b7280; margin: 2px 0 0 0;">${settings.tagline}</p>` : ''}
              </div>
            </div>
          </div>

          <!-- Right: From/De Info -->
          ${layout.parties.showFrom ? `
            <div style="flex: 1; padding: 12px; background: #f9fafb; border-radius: 8px; border-left: 4px solid ${documentType?.color || '#3b82f6'};">
              <h3 style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 8px; font-weight: 600;">${fromLabel}</h3>
              <div style="font-size: 11px; color: #4b5563; line-height: 1.5;">
                ${settings.showOwnerName && dataToUse.designerName ? `<p style="margin: 2px 0; font-weight: 600; font-size: 13px; color: #111827;">${dataToUse.designerName}</p>` : ''}
                ${settings.showEmail && dataToUse.designerEmail ? `<p style="margin: 2px 0;">${dataToUse.designerEmail}</p>` : ''}
                ${settings.showPhone && dataToUse.designerPhone ? `<p style="margin: 2px 0;">${dataToUse.designerPhone}</p>` : ''}
                ${settings.showWebsite && dataToUse.designerWebsite ? `<p style="margin: 2px 0; color: #0284c7;">${dataToUse.designerWebsite}</p>` : ''}
                ${settings.showAddress && dataToUse.designerAddress ? `<p style="margin: 4px 0 2px 0; white-space: pre-line; font-size: 10px;">${dataToUse.designerAddress}</p>` : ''}
                ${businessFiscalEntries.map(entry => `<p style="margin: 2px 0; font-size: 11px;"><strong>${entry.key}:</strong> ${entry.value}</p>`).join('')}
                ${customFieldsHtml}
              </div>
            </div>
          ` : ''}
        </div>
      `;

      const toBlock = layout.parties.showTo ? `
        <div class="party">
          <h3>${toLabel}</h3>
          <div class="party-name">${dataToUse.clientName || '-'}</div>
          <div class="party-details">
            ${dataToUse.clientCompany ? `<p><strong>${dataToUse.clientCompany}</strong></p>` : ''}
            ${dataToUse.clientEmail ? `<p>${dataToUse.clientEmail}</p>` : ''}
            ${dataToUse.clientAddress ? `<p style="white-space: pre-line; margin-top: 4px;">${dataToUse.clientAddress}</p>` : ''}
            ${clientFiscalEntries.map(entry => `<p><strong>${entry.key}:</strong> ${entry.value}</p>`).join('')}
          </div>
          ${layout.header.showDocumentTitle ? `
            <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #d1d5db; display: grid; grid-template-columns: 1fr 1fr; grid-gap: 16px; align-items: start;">
              <div>
                <div style="font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 4px;">${docTypeName}</div>
                ${layout.header.showDocumentNumber ? `<span style="font-family: monospace; font-size: 12px; color: #6b7280;">#${dataToUse.invoiceNumber}</span>` : ''}
              </div>
              <div style="text-align: right;">
                ${layout.metaFields.filter(f => f.visible && f.key === 'invoiceDate').length > 0 ? `
                  <div style="margin-bottom: 8px;">
                    <div style="font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">${layout.metaFields.find(f => f.key === 'invoiceDate')?.label || getDefaultLabel('invoiceDate', language)}</div>
                    <div style="font-weight: 700; color: #111827; font-size: 13px;">${dataToUse.invoiceDate}</div>
                  </div>
                ` : ''}
                ${layout.metaFields.filter(f => f.visible && f.key === 'dueDate').length > 0 ? `
                  <div>
                    <div style="font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">${layout.metaFields.find(f => f.key === 'dueDate')?.label || getDefaultLabel('dueDate', language)}</div>
                    <div style="font-weight: 700; color: #111827; font-size: 13px;">${dataToUse.dueDate || (language === 'fr' ? 'À réception' : 'On Receipt')}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
        </div>
      ` : '';
      const partiesHtml = toBlock;

      // Build meta fields (only project, dates are in fromBlock)
      const sortedMeta = [...layout.metaFields]
        .sort((a, b) => a.order - b.order)
        .filter(f => f.visible && f.key === 'project'); // Only show project in meta section
      const metaValues: Record<string, string> = {
        project: dataToUse.projectName || '-',
      };
      const metaHtml = sortedMeta.length > 0 ? `
        <div class="meta" style="grid-template-columns: repeat(${sortedMeta.length}, 1fr);">
          ${sortedMeta.map(f => `
            <div class="meta-item">
              <div class="meta-label">${f.label || getDefaultLabel(f.key, language)}</div>
              <div class="meta-value">${metaValues[f.key] || '-'}</div>
            </div>
          `).join('')}
        </div>
      ` : '';

      // Custom table labels
      const tblDesc = layout.tableLabels.description || getDefaultLabel('description', language);
      const tblQty = layout.tableLabels.quantity || getDefaultLabel('quantity', language);
      const tblRate = layout.tableLabels.rate || getDefaultLabel('rate', language);
      const tblAmt = layout.tableLabels.amount || getDefaultLabel('amount', language);
      const lblSubtotal = layout.totalsLabels.subtotal || getDefaultLabel('subtotal', language);
      const lblTax = layout.totalsLabels.tax || (settings.taxLabel || getDefaultLabel('tax', language));
      const lblTotal = layout.totalsLabels.total || getDefaultLabel('total', language);

      // Build sections in order
      const sortedSections = [...layout.sections].sort((a, b) => a.order - b.order);
      const sectionHtmlMap: Record<string, string> = {
        services: `
          <table class="services-table">
            <thead><tr>
              <th style="width: 50%;">${tblDesc}</th>
              <th style="width: 12%;">${tblQty}</th>
              <th style="width: 18%;">${tblRate}</th>
              <th style="width: 20%;">${tblAmt}</th>
            </tr></thead>
            <tbody>
              ${dataToUse.services.map(service => `
                <tr>
                  <td><div style="white-space: pre-line;">${service.description || '-'}</div></td>
                  <td style="text-align: center;">${service.quantity}</td>
                  <td style="text-align: center;">${service.rate.toFixed(2)} ${currency}</td>
                  <td>${(service.quantity * service.rate).toFixed(2)} ${currency}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `,
        totals: `
          <div class="totals-section">
            <div class="totals-box">
              <div class="totals-row">
                <span>${lblSubtotal}</span>
                <span style="font-weight: 500;">${calculations.subtotal.toFixed(2)} ${currency}</span>
              </div>
              ${calculationLinesHtml}
              ${govChargesHtml}
              ${dataToUse.taxRate > 0 ? `
                <div class="totals-row">
                  <span>${lblTax} (${dataToUse.taxRate}%)</span>
                  <span style="font-weight: 500;">${calculations.tax.toFixed(2)} ${currency}</span>
                </div>
              ` : ''}
              <div class="totals-row total">
                <span>${calculations.lines.some(l => l.label.includes('Acompte') || l.label.includes('Deposit')) ? (language === 'fr' ? 'Reste à payer' : 'Balance Due') : lblTotal}</span>
                <span>${finalTotal.toFixed(2)} ${currency}</span>
              </div>
            </div>
          </div>
        `,
        payment: paymentMethodsHtml ? `
          <div class="payment">
            <h4>${layout.sections.find(s => s.key === 'payment')?.label || getDefaultLabel('payment', language)}</h4>
            ${paymentMethodsHtml}
          </div>
        ` : '',
        notes: dataToUse.notes ? `
          <div class="notes">
            <h4>${layout.sections.find(s => s.key === 'notes')?.label || getDefaultLabel('notes', language)}</h4>
            <p>${dataToUse.notes}</p>
          </div>
        ` : '',
        footer: settings.showFooter && settings.footerText ? `
          <div class="footer">
            <p>${settings.footerText}</p>
          </div>
        ` : '',
      };

      const sectionsHtml = sortedSections
        .filter(s => s.visible)
        .map(s => sectionHtmlMap[s.key] || '')
        .join('');

      const printableInvoice = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${docTypeName} ${dataToUse.invoiceNumber}</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              html, body {
                margin: 0;
                padding: 0;
                height: 100%;
                width: 100%;
              }
              @page { 
                size: A4;
                margin: 10mm;
              }
              @page :first {
                margin: 10mm;
              }
              @page :last {
                margin: 10mm;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.4; color: #1f2937; background: white; font-size: 12px;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                width: 100%;
                margin: 0;
                padding: 0;
              }
              /* Hide browser print headers and footers */
              @media print {
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 100%;
                  height: auto;
                }
                head {
                  display: none !important;
                }
              }
              .invoice-container { padding: 8mm; display: flex; flex-direction: column; min-height: 277mm; }
              .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 3px solid ${documentType?.color || '#3b82f6'}; }
              .brand { display: flex; align-items: center; gap: 12px; }
              .logo { max-height: 50px; max-width: 150px; object-fit: contain; }
              .brand-text h1 { font-size: 22px; font-weight: 700; color: #111827; margin: 0; }
              .brand-text p { font-size: 12px; color: #6b7280; margin: 2px 0 0 0; }
              .invoice-info { text-align: right; }
              .invoice-info h2 { font-size: 26px; font-weight: 700; color: ${documentType?.color || '#3b82f6'}; margin-bottom: 4px; text-transform: uppercase; }
              .invoice-info .number { font-family: monospace; font-size: 13px; color: #6b7280; background: #f3f4f6; padding: 4px 10px; border-radius: 4px; }
              .parties { margin-bottom: 20px; }
              .party { padding: 14px; background: #f9fafb; border-radius: 8px; border-left: 4px solid ${documentType?.color || '#3b82f6'}; }
              .party h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 8px; font-weight: 600; }
              .party-name { font-size: 15px; font-weight: 600; color: #111827; margin-bottom: 4px; }
              .party-details { font-size: 11px; color: #4b5563; line-height: 1.5; }
              .party-details p { margin: 2px 0; }
              .meta { display: grid; gap: 12px; margin-bottom: 20px; }
              .meta-item { text-align: center; padding: 10px; background: #f3f4f6; border-radius: 6px; }
              .meta-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 2px; }
              .meta-value { font-size: 12px; font-weight: 600; color: #111827; }
              .services-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
              .services-table th { background: ${documentType?.color || '#3b82f6'}; color: white; padding: 10px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
              .services-table th:last-child { text-align: right; }
              .services-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top; font-size: 11px; }
              .services-table tr:nth-child(even) td { background: #fafafa; }
              .services-table td:last-child { text-align: right; font-weight: 600; color: ${documentType?.color || '#3b82f6'}; }
              .totals-section { display: flex; justify-content: flex-end; margin-bottom: 16px; }
              .totals-box { width: 240px; background: #f9fafb; border-radius: 8px; padding: 14px; border: 2px solid ${documentType?.color || '#3b82f6'}; }
              .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; border-bottom: 1px solid #e5e7eb; }
              .totals-row:last-child { border-bottom: none; }
              .totals-row.total { padding-top: 10px; margin-top: 6px; border-top: 2px solid ${documentType?.color || '#3b82f6'}; font-size: 16px; font-weight: 700; color: ${documentType?.color || '#3b82f6'}; }
              .notes { padding: 12px; background: #fef3c7; border-radius: 6px; margin-bottom: 12px; border-left: 4px solid #f59e0b; }
              .notes h4 { font-size: 10px; font-weight: 600; margin-bottom: 4px; color: #92400e; text-transform: uppercase; }
              .notes p { font-size: 11px; color: #78350f; white-space: pre-line; }
              .payment { padding: 12px; background: #ecfdf5; border-radius: 6px; margin-bottom: 12px; border-left: 4px solid #10b981; }
              .payment h4 { font-size: 10px; font-weight: 600; margin-bottom: 8px; color: #065f46; text-transform: uppercase; }
              .ending-block { margin-top: 16px; display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; border-top: 1px dashed #d1d5db; padding-top: 14px; }
              .ending-left { flex: 1; display: flex; flex-direction: column; gap: 8px; }
              .ending-row { display: flex; align-items: center; gap: 10px; }
              .ending-text { font-size: 11px; color: #374151; }
              .ending-value { font-size: 11px; color: #111827; font-weight: 600; }
              .ending-right { min-width: 160px; text-align: right; }
              .ending-signature { max-height: 90px; max-width: 160px; object-fit: contain; }
              .footer { margin-top: auto; text-align: center; padding-top: 12px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 10px; }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              ${headerHtml}
              <div class="parties">${partiesHtml}</div>
              ${metaHtml}
              ${sectionsHtml}
              ${endingBlockHtml}
            </div>
          </body>
        </html>
      `;
      
      printWindow.document.write(printableInvoice);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        
        toast({
          title: t('pdfReady'),
          description: `${docTypeName} #${dataToUse.invoiceNumber}`,
        });
      }, 600);
    }
  };

  const copyInvoiceLink = (invoice: SavedInvoice) => {
    const link = `${window.location.origin}/invoice?invoice=${invoice.id}`;
    navigator.clipboard.writeText(link);
    toast({
      title: t('linkCopied'),
      description: invoice.invoiceNumber,
    });
  };

  const deleteInvoice = (invoiceId: string) => {
    const updatedInvoices = savedInvoices.filter(invoice => invoice.id !== invoiceId);
    setSavedInvoices(updatedInvoices);
    saveInvoices(updatedInvoices as StoredInvoice[]);
    
    toast({
      title: t('delete'),
      description: t('documentSaved'),
    });
  };

  const clearClient = () => {
    const settings = getBusinessSettings();
    setSelectedClient(null);
    setInvoiceData(prev => ({
      ...prev,
      clientName: '',
      clientCompany: '',
      clientEmail: '',
      clientAddress: '',
      clientNif: settings.clientFiscalInfo?.nif || '',
      clientNic: settings.clientFiscalInfo?.nic || '',
      clientAit: settings.clientFiscalInfo?.ait || '',
      clientRc: settings.clientFiscalInfo?.rc || '',
      clientArtisan: settings.clientFiscalInfo?.artisan || '',
      clientActivity: settings.clientFiscalInfo?.activity || '',
      clientCustomFiscalValues: buildCustomFiscalValueMap(settings.clientCustomFiscalInfo),
    }));
    setSectionsOpen(prev => ({ ...prev, client: true }));
  };

  const resetInvoice = () => {
    const settings = getBusinessSettings();
    const types = getDocumentTypes();
    const type = types.find(t => t.isDefault) || types[0];
    const typeConfig = type ? getDocumentTypeConfig(type.id) : null;
    
    setInvoiceData({
      designerName: settings.ownerName || '',
      designerEmail: settings.email || '',
      designerPhone: settings.phone || '',
      designerAddress: settings.address || '',
      designerWebsite: settings.website || '',
      designerNif: settings.fiscalInfo?.nif || '',
      designerNic: settings.fiscalInfo?.nic || '',
      designerAit: settings.fiscalInfo?.ait || '',
      designerRc: settings.fiscalInfo?.rc || '',
      designerArtisan: settings.fiscalInfo?.artisan || '',
      designerActivity: settings.fiscalInfo?.activity || '',
      designerCustomFiscalValues: buildCustomFiscalValueMap(settings.businessCustomFiscalInfo),
      clientName: '',
      clientCompany: '',
      clientEmail: '',
      clientAddress: '',
      clientNif: settings.clientFiscalInfo?.nif || '',
      clientNic: settings.clientFiscalInfo?.nic || '',
      clientAit: settings.clientFiscalInfo?.ait || '',
      clientRc: settings.clientFiscalInfo?.rc || '',
      clientArtisan: settings.clientFiscalInfo?.artisan || '',
      clientActivity: settings.clientFiscalInfo?.activity || '',
      clientCustomFiscalValues: buildCustomFiscalValueMap(settings.clientCustomFiscalInfo),
      invoiceNumber: type ? generateDocumentNumber(type) : `INV-${generateSecureId().substring(0, 8).toUpperCase()}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      projectName: '',
      services: [{ id: generateSecureId(), description: '', quantity: 1, rate: 0 }],
      notes: '',
      taxRate: settings.defaultTaxRate || 0,
      endingPriceNumber: '',
      endingPriceText: '',
      endingPriceTextFrench: true,
      endingChoiceId: typeConfig?.endingChoices?.[0]?.id || '',
      documentType: type?.id,
      calculationLines: [],
    });
    setSelectedClient(null);
    setCalculationLines([]);
    setSectionsOpen({ client: true, details: true, services: true, calculations: true, notes: false });
    if (type) setDocumentType(type);
    
    toast({
      title: t('newInvoice'),
      description: type ? `${type.nameFr} ${t('createDocument')}` : '',
    });
  };

  const calculations = getCalculations();
  const govCharges = invoiceData.documentType
    ? calculateGovernmentCharges(invoiceData.documentType, calculations.subtotal)
    : { total: 0, breakdown: [] as { name: string; amount: number }[] };
  const finalTotal = calculations.balanceDue + govCharges.total;
  const currency = businessSettings.currencySymbol || 'DZD';
  const endingPriceWords = numberToWordsFr(finalTotal);
  const availablePaperTypes = useMemo(() => getDocumentTypes(), []);
  const papersByTypeList = useMemo(() => {
    const selectedType = papersTypeFilter === 'all' ? null : papersTypeFilter;
    const filtered = selectedType
      ? savedInvoices.filter((invoice) => (invoice.documentType || 'invoice') === selectedType)
      : savedInvoices;

    return [...filtered].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [papersTypeFilter, savedInvoices]);

  return (
    <div className="space-y-6">
      <Card className="app-surface">
        <CardContent className="p-4 lg:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {businessSettings.logoUrl && businessSettings.logoEnabled ? (
                <img src={businessSettings.logoUrl} alt="Logo" className="h-10 w-10 rounded-lg object-cover border" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-primary" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-base lg:text-lg font-semibold truncate">{businessSettings.businessName || t('createDocument')}</h2>
                {businessSettings.tagline && <p className="text-xs text-muted-foreground truncate">{businessSettings.tagline}</p>}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetInvoice} className="gap-2">
                <Plus className="w-4 h-4" />
                {t('newInvoice')}
              </Button>
              <InvoiceLayoutDialog onLayoutChange={setInvoiceLayout} />
              <LanguageSelector onLanguageChange={(lang) => setLanguageState(lang)} />
              <BusinessSettingsDialog onSettingsChange={handleSettingsChange} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-2xl grid-cols-4">
              <TabsTrigger value="create" className="gap-2">
                <FileText className="w-4 h-4" />
                {t('createDocument')}
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="w-4 h-4" />
                {t('history')}
              </TabsTrigger>
              <TabsTrigger value="invoices" className="gap-2">
                <Receipt className="w-4 h-4" />
                {t('allInvoices')} ({savedInvoices.length})
              </TabsTrigger>
              <TabsTrigger value="papersByType" className="gap-2">
                <Layout className="w-4 h-4" />
                {language === 'fr' ? 'Papiers par type' : 'Papers by Type'}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Create Invoice Tab */}
          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              {/* Left - Form */}
              <div className="xl:col-span-3 space-y-4">
                
                {/* Document Type & Number */}
                <Card className="border-l-4" style={{ borderLeftColor: documentType?.color || 'hsl(var(--primary))' }}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="w-4 h-4" style={{ color: documentType?.color }} />
                        {t('invoiceDetails')}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <DocumentTypeSelector 
                          selectedType={documentType} 
                          onTypeChange={handleDocumentTypeChange}
                        />
                        <Link to={`/settings?type=${invoiceData.documentType || ''}`}>
                          <Button variant="outline" size="sm" className="h-9">
                            {language === 'fr' ? 'Fiscalité papier' : 'Paper Fiscal'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t('documentNumber')}</Label>
                        <Input
                          value={invoiceData.invoiceNumber}
                          onChange={(e) => updateInvoiceData('invoiceNumber', e.target.value)}
                          className="h-9 font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t('project')}</Label>
                        <Input
                          value={invoiceData.projectName}
                          onChange={(e) => updateInvoiceData('projectName', e.target.value)}
                          placeholder={t('projectName')}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t('invoiceDate')}</Label>
                        <Input
                          type="date"
                          value={invoiceData.invoiceDate}
                          onChange={(e) => updateInvoiceData('invoiceDate', e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t('dueDate')}</Label>
                        <Input
                          type="date"
                          value={invoiceData.dueDate}
                          onChange={(e) => updateInvoiceData('dueDate', e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>

                    {documentTypeConfig?.showBusinessFiscalInfo && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="mb-3 flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-primary">
                            {language === 'fr' ? 'Informations fiscales (émetteur)' : 'Business Fiscal Information'}
                          </h4>
                          {documentTypeConfig.requiresBusinessFiscalInfo && (
                            <Badge variant="destructive" className="text-[10px] h-5">Required</Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {documentTypeConfig.businessFiscalFields.includes('nif') && (
                            <div className="space-y-1.5">
                              <Label className="text-xs">NIF</Label>
                              <Input
                                value={invoiceData.designerNif}
                                onChange={(e) => updateInvoiceData('designerNif', e.target.value)}
                                placeholder="NIF"
                                className="h-9"
                              />
                            </div>
                          )}
                          {documentTypeConfig.businessFiscalFields.includes('nic') && (
                            <div className="space-y-1.5">
                              <Label className="text-xs">NIC</Label>
                              <Input
                                value={invoiceData.designerNic}
                                onChange={(e) => updateInvoiceData('designerNic', e.target.value)}
                                placeholder="NIC"
                                className="h-9"
                              />
                            </div>
                          )}
                          {documentTypeConfig.businessFiscalFields.includes('ait') && (
                            <div className="space-y-1.5">
                              <Label className="text-xs">AIT</Label>
                              <Input
                                value={invoiceData.designerAit}
                                onChange={(e) => updateInvoiceData('designerAit', e.target.value)}
                                placeholder="AIT"
                                className="h-9"
                              />
                            </div>
                          )}
                          {documentTypeConfig.businessFiscalFields.includes('rc') && (
                            <div className="space-y-1.5">
                              <Label className="text-xs">RC</Label>
                              <Input
                                value={invoiceData.designerRc}
                                onChange={(e) => updateInvoiceData('designerRc', e.target.value)}
                                placeholder="RC"
                                className="h-9"
                              />
                            </div>
                          )}
                          {documentTypeConfig.businessFiscalFields.includes('artisan') && (
                            <div className="space-y-1.5">
                              <Label className="text-xs">Artisan</Label>
                              <Input
                                value={invoiceData.designerArtisan}
                                onChange={(e) => updateInvoiceData('designerArtisan', e.target.value)}
                                placeholder="Artisan"
                                className="h-9"
                              />
                            </div>
                          )}
                          {documentTypeConfig.businessFiscalFields.includes('activity') && (
                            <div className="space-y-1.5">
                              <Label className="text-xs">Activity</Label>
                              <Input
                                value={invoiceData.designerActivity}
                                onChange={(e) => updateInvoiceData('designerActivity', e.target.value)}
                                placeholder="Activity"
                                className="h-9"
                              />
                            </div>
                          )}

                          {mergeCustomFiscalFields(
                            documentTypeConfig.businessCustomFiscalFields || [],
                            globalBusinessCustomFields
                          )
                            .map((field) => (
                              <div key={field.id} className="space-y-1.5">
                                <Label className="text-xs">{field.label}</Label>
                                <Input
                                  value={(invoiceData.designerCustomFiscalValues || {})[field.id] || ''}
                                  onChange={(e) => updateCustomFiscalValue('business', field.id, e.target.value)}
                                  placeholder={field.label}
                                  className="h-9"
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Client Selection */}
                <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20">
                  <Collapsible open={sectionsOpen.client} onOpenChange={(open) => setSectionsOpen(prev => ({ ...prev, client: open }))}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-base text-blue-600 dark:text-blue-400">
                            <Users className="w-4 h-4" />
                            {t('client')}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {selectedClient && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                {selectedClient.name}
                              </Badge>
                            )}
                            <ChevronRight className={`w-4 h-4 transition-transform ${sectionsOpen.client ? 'rotate-90' : ''}`} />
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-4">
                        <SmartClientSearch 
                          onSelectClient={handleClientSelect}
                          selectedClientId={selectedClient?.id}
                        />
                        
                        {selectedClient && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                    {selectedClient.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{selectedClient.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {selectedClient.invoiceHistory?.length || 0} {t('invoices').toLowerCase()}
                                  </p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" onClick={clearClient}>
                                {t('edit')}
                              </Button>
                            </div>

                            {getClientFiscalEntries(invoiceData).length > 0 && (
                              <div className="pt-2 border-t border-blue-200 dark:border-blue-800 grid grid-cols-2 gap-2">
                                {getClientFiscalEntries(invoiceData).map((entry) => (
                                  <div key={entry.key} className="text-xs rounded-md border border-blue-200 dark:border-blue-800 bg-white/70 dark:bg-blue-950/20 px-2 py-1">
                                    <span className="font-medium">{entry.key}:</span> {entry.value}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {!selectedClient && (
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs">{t('clientName')}</Label>
                              <Input
                                value={invoiceData.clientName}
                                onChange={(e) => updateInvoiceData('clientName', e.target.value)}
                                placeholder={t('clientName')}
                                className="h-9"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">{t('clientCompany')}</Label>
                              <Input
                                value={invoiceData.clientCompany}
                                onChange={(e) => updateInvoiceData('clientCompany', e.target.value)}
                                placeholder={t('clientCompany')}
                                className="h-9"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">{t('email')}</Label>
                              <Input
                                type="email"
                                value={invoiceData.clientEmail}
                                onChange={(e) => updateInvoiceData('clientEmail', e.target.value)}
                                placeholder={t('email')}
                                className="h-9"
                              />
                            </div>
                            <div className="col-span-2 space-y-1.5">
                              <Label className="text-xs">{t('address')}</Label>
                              <Textarea
                                value={invoiceData.clientAddress}
                                onChange={(e) => updateInvoiceData('clientAddress', e.target.value)}
                                placeholder={t('address')}
                                rows={2}
                                className="resize-none"
                              />
                            </div>

                          </div>
                        )}

                        {/* Fiscal Information for Client (always editable) */}
                        {documentTypeConfig && documentTypeConfig.showClientFiscalInfo && (
                          <div className="pt-4 border-t">
                            <div className="mb-3 flex items-center gap-2">
                              <h4 className="text-xs font-semibold text-blue-600">Client Fiscal Information</h4>
                              {documentTypeConfig.requiresClientFiscalInfo && (
                                <Badge variant="destructive" className="text-[10px] h-5">Required</Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {documentTypeConfig.clientFiscalFields.includes('nif') && (
                                <div className="space-y-1.5">
                                  <Label className="text-xs">NIF</Label>
                                  <Input
                                    value={invoiceData.clientNif}
                                    onChange={(e) => updateInvoiceData('clientNif', e.target.value)}
                                    placeholder="NIF"
                                    className="h-9"
                                  />
                                </div>
                              )}
                              {documentTypeConfig.clientFiscalFields.includes('nic') && (
                                <div className="space-y-1.5">
                                  <Label className="text-xs">NIC</Label>
                                  <Input
                                    value={invoiceData.clientNic}
                                    onChange={(e) => updateInvoiceData('clientNic', e.target.value)}
                                    placeholder="NIC"
                                    className="h-9"
                                  />
                                </div>
                              )}
                              {documentTypeConfig.clientFiscalFields.includes('ait') && (
                                <div className="space-y-1.5">
                                  <Label className="text-xs">AIT</Label>
                                  <Input
                                    value={invoiceData.clientAit}
                                    onChange={(e) => updateInvoiceData('clientAit', e.target.value)}
                                    placeholder="AIT"
                                    className="h-9"
                                  />
                                </div>
                              )}
                              {documentTypeConfig.clientFiscalFields.includes('rc') && (
                                <div className="space-y-1.5">
                                  <Label className="text-xs">RC</Label>
                                  <Input
                                    value={invoiceData.clientRc}
                                    onChange={(e) => updateInvoiceData('clientRc', e.target.value)}
                                    placeholder="RC"
                                    className="h-9"
                                  />
                                </div>
                              )}
                              {documentTypeConfig.clientFiscalFields.includes('artisan') && (
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Artisan Number</Label>
                                  <Input
                                    value={invoiceData.clientArtisan}
                                    onChange={(e) => updateInvoiceData('clientArtisan', e.target.value)}
                                    placeholder="Artisan"
                                    className="h-9"
                                  />
                                </div>
                              )}
                              {documentTypeConfig.clientFiscalFields.includes('activity') && (
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Activity</Label>
                                  <Input
                                    value={invoiceData.clientActivity}
                                    onChange={(e) => updateInvoiceData('clientActivity', e.target.value)}
                                    placeholder="Activity"
                                    className="h-9"
                                  />
                                </div>
                              )}

                              {mergeCustomFiscalFields(
                                documentTypeConfig.clientCustomFiscalFields || [],
                                globalClientCustomFields
                              )
                                .map((field) => (
                                  <div key={field.id} className="space-y-1.5">
                                    <Label className="text-xs">{field.label}</Label>
                                    <Input
                                      value={(invoiceData.clientCustomFiscalValues || {})[field.id] || ''}
                                      onChange={(e) => updateCustomFiscalValue('client', field.id, e.target.value)}
                                      placeholder={field.label}
                                      className="h-9"
                                    />
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {documentTypeConfig && !documentTypeConfig.showClientFiscalInfo && (
                          <div className="pt-4 border-t">
                            <div className="rounded-md border border-amber-300/70 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-3">
                              <span>
                                {language === 'fr'
                                  ? 'Les informations fiscales client sont désactivées pour ce type de document.'
                                  : 'Client fiscal information is disabled for this document type.'}
                              </span>
                              <Link to={`/settings?type=${invoiceData.documentType || ''}`}>
                                <Button size="sm" variant="outline" className="h-7 text-xs">
                                  {language === 'fr' ? 'Activer' : 'Enable'}
                                </Button>
                              </Link>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>

                {/* Services */}
                <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-950/20">
                  <Collapsible open={sectionsOpen.services} onOpenChange={(open) => setSectionsOpen(prev => ({ ...prev, services: open }))}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-base text-green-600 dark:text-green-400">
                            <Calculator className="w-4 h-4" />
                            {t('services')}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                              {invoiceData.services.length} {t('services').toLowerCase()}
                            </Badge>
                            <ChevronRight className={`w-4 h-4 transition-transform ${sectionsOpen.services ? 'rotate-90' : ''}`} />
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-3">
                        {/* Table header */}
                        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
                          <div className="col-span-6">{t('description')}</div>
                          <div className="col-span-2 text-center">{t('quantity')}</div>
                          <div className="col-span-2 text-center">{t('rate')}</div>
                          <div className="col-span-2 text-right">{t('amount')}</div>
                        </div>
                        
                        {/* Services */}
                        {invoiceData.services.map((service, index) => (
                          <div 
                            key={service.id} 
                            className={`grid grid-cols-12 gap-2 items-start p-2 rounded-lg ${
                              index % 2 === 0 ? 'bg-green-50/50 dark:bg-green-950/20' : ''
                            }`}
                          >
                            <div className="col-span-6">
                              <Textarea
                                value={service.description}
                                onChange={(e) => updateService(service.id, 'description', e.target.value)}
                                placeholder={t('description')}
                                rows={1}
                                className="resize-none min-h-[36px]"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                value={service.quantity}
                                onChange={(e) => updateService(service.id, 'quantity', parseInt(e.target.value) || 0)}
                                className="h-9 text-center"
                                min={1}
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                value={service.rate}
                                onChange={(e) => updateService(service.id, 'rate', parseFloat(e.target.value) || 0)}
                                className="h-9 text-center"
                                min={0}
                              />
                            </div>
                            <div className="col-span-2 flex items-center justify-end gap-1">
                              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                {(service.quantity * service.rate).toFixed(0)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => removeService(service.id)}
                                disabled={invoiceData.services.length === 1}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addService}
                          className="w-full border-dashed border-green-300 text-green-600 hover:bg-green-50 dark:border-green-700 dark:hover:bg-green-950/30"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {t('addService')}
                        </Button>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>

                {/* Calculations */}
                <Card className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-950/20">
                  <Collapsible open={sectionsOpen.calculations} onOpenChange={(open) => setSectionsOpen(prev => ({ ...prev, calculations: open }))}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-base text-orange-600 dark:text-orange-400">
                            <Calculator className="w-4 h-4" />
                            {t('total')}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 font-mono">
                              {finalTotal.toFixed(0)} {currency}
                            </Badge>
                            <ChevronRight className={`w-4 h-4 transition-transform ${sectionsOpen.calculations ? 'rotate-90' : ''}`} />
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-4">
                        {/* Tax Rate */}
                        <div className="flex items-center gap-4">
                          <Label className="text-sm whitespace-nowrap">{businessSettings.taxLabel || t('tax')}</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={invoiceData.taxRate}
                              onChange={(e) => updateInvoiceData('taxRate', parseFloat(e.target.value) || 0)}
                              className="w-20 h-9"
                              min={0}
                              max={100}
                            />
                            <span className="text-muted-foreground">%</span>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        {/* Custom calculation lines */}
                        <CalculationLinesEditor
                          lines={calculationLines}
                          onChange={setCalculationLines}
                          currency={currency}
                        />
                        
                        <Separator />
                        
                        {/* Totals Summary */}
                        <div className="space-y-2 p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t('subtotal')}</span>
                            <span className="font-medium">{calculations.subtotal.toFixed(2)} {currency}</span>
                          </div>
                          
                          {calculations.lines.map((line, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className={line.isSubtraction ? 'text-red-600' : 'text-green-600'}>
                                {line.label}
                              </span>
                              <span className={`font-medium ${line.isSubtraction ? 'text-red-600' : 'text-green-600'}`}>
                                {line.isSubtraction ? '-' : '+'}{line.value.toFixed(2)} {currency}
                              </span>
                            </div>
                          ))}
                          
                          {invoiceData.taxRate > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {businessSettings.taxLabel || t('tax')} ({invoiceData.taxRate}%)
                              </span>
                              <span className="font-medium">{calculations.tax.toFixed(2)} {currency}</span>
                            </div>
                          )}

                          {govCharges.breakdown.map((charge, idx) => (
                            <div key={`${charge.name}-${idx}`} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{charge.name}</span>
                              <span className="font-medium">{charge.amount.toFixed(2)} {currency}</span>
                            </div>
                          ))}
                          
                          <Separator className="my-2" />
                          
                          <div className="flex justify-between text-lg font-bold">
                            <span className="text-orange-600 dark:text-orange-400">
                              {calculations.lines.some(l => l.label.includes('Acompte') || l.label.includes('Deposit')) 
                                ? t('balanceDue') 
                                : t('total')}
                            </span>
                            <span className="text-orange-600 dark:text-orange-400">
                              {finalTotal.toFixed(2)} {currency}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>

                {/* Notes */}
                <Card className="border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-950/20">
                  <Collapsible open={sectionsOpen.notes} onOpenChange={(open) => setSectionsOpen(prev => ({ ...prev, notes: open }))}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-base text-amber-600 dark:text-amber-400">
                            <FileText className="w-4 h-4" />
                            {t('notes')}
                          </CardTitle>
                          <ChevronRight className={`w-4 h-4 transition-transform ${sectionsOpen.notes ? 'rotate-90' : ''}`} />
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <Textarea
                          value={invoiceData.notes}
                          onChange={(e) => updateInvoiceData('notes', e.target.value)}
                          placeholder={t('notesPlaceholder')}
                          rows={3}
                          className="resize-none"
                        />
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>

                {documentTypeConfig?.showEndingBlock && (
                  <Card className="border-l-4 border-l-slate-500 bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-950/20">
                    <CardHeader className="py-3">
                      <CardTitle className="text-base">
                        {language === 'fr' ? 'Bloc de fin du document' : 'Paper Ending Block'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          {documentTypeConfig.endingLine1Text || (language === 'fr' ? 'Texte ligne 1' : 'Line 1 text')}
                        </Label>
                        <Input
                          value={endingPriceWords}
                          readOnly
                          placeholder={language === 'fr' ? 'Prix en lettres (français)' : 'Price in French words'}
                          className="h-9"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                        <div className="space-y-1.5">
                          <Label className="text-xs">
                            {documentTypeConfig.endingLine2Text || (language === 'fr' ? 'Texte ligne 2' : 'Line 2 text')}
                          </Label>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">{language === 'fr' ? 'Mode de paiement' : 'Payment type'}</Label>
                          <Select
                            value={invoiceData.endingChoiceId || ''}
                            onValueChange={(value) => updateInvoiceData('endingChoiceId', value)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder={language === 'fr' ? 'Choisir une option' : 'Choose an option'} />
                            </SelectTrigger>
                            <SelectContent>
                              {(documentTypeConfig.endingChoices || []).map(choice => (
                                <SelectItem key={choice.id} value={choice.id}>{choice.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button onClick={saveInvoiceHandler} className="flex-1 gap-2" size="lg">
                    <Receipt className="w-4 h-4" />
                    {t('saveInvoice')}
                  </Button>
                  <Button onClick={() => exportToPDF()} variant="outline" size="lg" className="gap-2">
                    <Download className="w-4 h-4" />
                    {t('exportPDF')}
                  </Button>
                </div>
              </div>

              {/* Right - History Panel */}
              <div className="xl:col-span-2">
                {selectedClient?.invoiceHistory && selectedClient.invoiceHistory.length > 0 ? (
                  <ClientHistoryPanel
                    clientName={selectedClient.name}
                    invoiceHistory={selectedClient.invoiceHistory as StoredInvoice[]}
                    onApplyService={handleApplyService}
                    onLoadInvoice={handleLoadInvoice}
                  />
                ) : (
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Sparkles className="w-4 h-4 text-primary" />
                        {t('priceSuggestions')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">{t('selectClient')}</p>
                        <p className="text-xs mt-1">{t('basedOnHistory')}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  {t('clientHistory')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedClient?.invoiceHistory && selectedClient.invoiceHistory.length > 0 ? (
                  <ClientHistoryPanel
                    clientName={selectedClient.name}
                    invoiceHistory={selectedClient.invoiceHistory as StoredInvoice[]}
                    onApplyService={handleApplyService}
                    onLoadInvoice={handleLoadInvoice}
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-medium mb-2">{t('selectClient')}</h3>
                    <p className="text-sm">{t('basedOnHistory')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Invoices Tab */}
          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  {t('allInvoices')} ({savedInvoices.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {savedInvoices.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Receipt className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-medium mb-2">{t('noResults')}</h3>
                    <p className="text-sm">{t('createDocument')}</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-3">
                      {savedInvoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono font-medium">{invoice.invoiceNumber}</span>
                                <Badge variant="outline" className="text-xs">
                                  {invoice.total.toFixed(0)} {currency}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium">{invoice.clientName}</span>
                                {invoice.projectName && ` • ${invoice.projectName}`}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(invoice.createdAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleLoadInvoice(invoice as StoredInvoice)}
                                title={t('useAsTemplate')}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyInvoiceLink(invoice)}
                                title={t('copyLink')}
                              >
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => exportToPDF(invoice)}
                                title={t('exportPDF')}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => deleteInvoice(invoice.id)}
                                title={t('delete')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Papers by Type Tab */}
          <TabsContent value="papersByType">
            <Card>
              <CardHeader className="space-y-3">
                <CardTitle className="flex items-center gap-2">
                  <Layout className="w-5 h-5 text-primary" />
                  {language === 'fr' ? 'Papiers par type' : 'All Papers by Type'}
                </CardTitle>
                <div className="max-w-sm">
                  <Label className="text-xs">{language === 'fr' ? 'Type de papier' : 'Paper type'}</Label>
                  <Select value={papersTypeFilter} onValueChange={setPapersTypeFilter}>
                    <SelectTrigger className="h-9 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === 'fr' ? 'Tous les types' : 'All types'}</SelectItem>
                      {availablePaperTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {language === 'fr' ? type.nameFr : type.nameEn || type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {papersByTypeList.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-sm">
                    {language === 'fr' ? 'Aucun papier pour ce type.' : 'No papers for this type.'}
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    {papersByTypeList.map((paper, index) => (
                      <div
                        key={paper.id}
                        className="grid grid-cols-1 md:grid-cols-5 gap-2 px-3 py-2 border-b last:border-b-0 text-sm"
                      >
                        <span className="font-medium">#{index + 1}</span>
                        <span className="font-medium">{paper.clientName || '-'}</span>
                        <span>{paper.invoiceNumber}</span>
                        <span>{paper.total.toFixed(2)} {currency}</span>
                        <span className="text-muted-foreground">
                          {new Date(paper.createdAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default InvoiceGenerator;
