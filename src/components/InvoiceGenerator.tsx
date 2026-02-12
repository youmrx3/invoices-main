import React, { useState, useEffect, useCallback } from 'react';
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
import { type CalculationLine, calculateWithCustomLines } from '@/lib/calculationLines';
import { t, getLanguage, type Language } from '@/lib/i18n';
import { getInvoiceLayout, getDefaultLabel, type InvoiceLayout } from '@/lib/invoiceLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientAddress: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  projectName: string;
  services: ServiceItem[];
  notes: string;
  taxRate: number;
  documentType?: string;
  calculationLines?: CalculationLine[];
}

interface SavedInvoice extends InvoiceData {
  id: string;
  createdAt: string;
  total: number;
}

const InvoiceGenerator = () => {
  const { toast } = useToast();
  const [language, setLanguageState] = useState<Language>(getLanguage());
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(getBusinessSettings);
  const [documentType, setDocumentType] = useState<DocumentType | null>(null);
  const [calculationLines, setCalculationLines] = useState<CalculationLine[]>([]);
  const [invoiceLayout, setInvoiceLayout] = useState<InvoiceLayout>(getInvoiceLayout);
  
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(() => {
    const settings = getBusinessSettings();
    const types = getDocumentTypes();
    const defaultType = types.find(t => t.isDefault) || types[0];
    
    return {
      designerName: settings.ownerName || '',
      designerEmail: settings.email || '',
      designerPhone: settings.phone || '',
      designerAddress: settings.address || '',
      designerWebsite: settings.website || '',
      clientName: '',
      clientCompany: '',
      clientEmail: '',
      clientAddress: '',
      invoiceNumber: defaultType ? generateDocumentNumber(defaultType) : `INV-${generateSecureId().substring(0, 8).toUpperCase()}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      projectName: '',
      services: [{ id: '1', description: '', quantity: 1, rate: 0 }],
      notes: '',
      taxRate: settings.defaultTaxRate || 0,
      documentType: defaultType?.id,
      calculationLines: [],
    };
  });

  const [savedInvoices, setSavedInvoices] = useState<SavedInvoice[]>(() => {
    return getSavedInvoices() as SavedInvoice[];
  });
  
  const [selectedClient, setSelectedClient] = useState<(Client & { invoiceHistory?: StoredInvoice[] }) | null>(null);
  const [activeTab, setActiveTab] = useState('create');
  const [sectionsOpen, setSectionsOpen] = useState({
    client: true,
    details: true,
    services: true,
    calculations: true,
    notes: false,
  });

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
      taxRate: newSettings.defaultTaxRate || prev.taxRate,
    }));
  };

  const handleDocumentTypeChange = (type: DocumentType) => {
    setDocumentType(type);
    setInvoiceData(prev => ({
      ...prev,
      invoiceNumber: generateDocumentNumber(type),
      documentType: type.id,
    }));
  };

  const updateInvoiceData = (field: keyof InvoiceData, value: string | number | ServiceItem[] | CalculationLine[]) => {
    setInvoiceData(prev => ({ ...prev, [field]: value }));
  };

  const handleClientSelect = (client: Client & { invoiceHistory?: StoredInvoice[] }) => {
    setSelectedClient(client);
    setInvoiceData(prev => ({
      ...prev,
      clientName: client.name,
      clientEmail: client.email,
      clientCompany: client.company || '',
      clientAddress: client.address || prev.clientAddress
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
    
    setInvoiceData({
      designerName: invoice.designerName || businessSettings.ownerName || '',
      designerEmail: invoice.designerEmail || businessSettings.email || '',
      designerPhone: invoice.designerPhone || businessSettings.phone || '',
      designerAddress: invoice.designerAddress || businessSettings.address || '',
      designerWebsite: invoice.designerWebsite || businessSettings.website || '',
      clientName: invoice.clientName || '',
      clientCompany: invoice.clientCompany || '',
      clientEmail: invoice.clientEmail || '',
      clientAddress: invoice.clientAddress || '',
      invoiceNumber: type ? generateDocumentNumber(type) : `INV-${generateSecureId().substring(0, 8).toUpperCase()}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      projectName: invoice.projectName || '',
      notes: invoice.notes || '',
      taxRate: invoice.taxRate || businessSettings.defaultTaxRate || 0,
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

  const saveInvoiceHandler = () => {
    const calculations = getCalculations();
    
    const newInvoice: SavedInvoice = {
      ...invoiceData,
      id: generateSecureId(),
      createdAt: new Date().toISOString(),
      total: calculations.balanceDue,
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
    const settings = businessSettings;
    const calculations = getCalculations();
    const layout = invoiceLayout;
    
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
              ${dataToUse.taxRate > 0 ? `
                <div class="totals-row">
                  <span>${lblTax} (${dataToUse.taxRate}%)</span>
                  <span style="font-weight: 500;">${calculations.tax.toFixed(2)} ${currency}</span>
                </div>
              ` : ''}
              <div class="totals-row total">
                <span>${calculations.lines.some(l => l.label.includes('Acompte') || l.label.includes('Deposit')) ? (language === 'fr' ? 'Reste à payer' : 'Balance Due') : lblTotal}</span>
                <span>${calculations.balanceDue.toFixed(2)} ${currency}</span>
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
              .footer { margin-top: auto; text-align: center; padding-top: 12px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 10px; }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              ${headerHtml}
              <div class="parties">${partiesHtml}</div>
              ${metaHtml}
              ${sectionsHtml}
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
    setSelectedClient(null);
    setInvoiceData(prev => ({
      ...prev,
      clientName: '',
      clientCompany: '',
      clientEmail: '',
      clientAddress: ''
    }));
    setSectionsOpen(prev => ({ ...prev, client: true }));
  };

  const resetInvoice = () => {
    const settings = getBusinessSettings();
    const types = getDocumentTypes();
    const type = types.find(t => t.isDefault) || types[0];
    
    setInvoiceData({
      designerName: settings.ownerName || '',
      designerEmail: settings.email || '',
      designerPhone: settings.phone || '',
      designerAddress: settings.address || '',
      designerWebsite: settings.website || '',
      clientName: '',
      clientCompany: '',
      clientEmail: '',
      clientAddress: '',
      invoiceNumber: type ? generateDocumentNumber(type) : `INV-${generateSecureId().substring(0, 8).toUpperCase()}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      projectName: '',
      services: [{ id: generateSecureId(), description: '', quantity: 1, rate: 0 }],
      notes: '',
      taxRate: settings.defaultTaxRate || 0,
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
  const currency = businessSettings.currencySymbol || 'DZD';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {businessSettings.logoUrl && businessSettings.logoEnabled ? (
                <img src={businessSettings.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {businessSettings.businessName || t('createDocument')}
                </h1>
                {businessSettings.tagline && (
                  <p className="text-xs text-muted-foreground">{businessSettings.tagline}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/clients">
                <Button variant="outline" size="sm" className="gap-2">
                  <Users className="w-4 h-4" />
                  {t('clients')}
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={resetInvoice} className="gap-2">
                <Plus className="w-4 h-4" />
                {t('newInvoice')}
              </Button>
              <InvoiceLayoutDialog onLayoutChange={setInvoiceLayout} />
              <LanguageSelector onLanguageChange={(lang) => setLanguageState(lang)} />
              <BusinessSettingsDialog onSettingsChange={handleSettingsChange} />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-md grid-cols-3">
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
                      <DocumentTypeSelector 
                        selectedType={documentType} 
                        onTypeChange={handleDocumentTypeChange}
                      />
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
                          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
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
                              {calculations.balanceDue.toFixed(0)} {currency}
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
                          
                          <Separator className="my-2" />
                          
                          <div className="flex justify-between text-lg font-bold">
                            <span className="text-orange-600 dark:text-orange-400">
                              {calculations.lines.some(l => l.label.includes('Acompte') || l.label.includes('Deposit')) 
                                ? t('balanceDue') 
                                : t('total')}
                            </span>
                            <span className="text-orange-600 dark:text-orange-400">
                              {calculations.balanceDue.toFixed(2)} {currency}
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
                    invoiceHistory={selectedClient.invoiceHistory as any}
                    onApplyService={handleApplyService}
                    onLoadInvoice={handleLoadInvoice as any}
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
                    invoiceHistory={selectedClient.invoiceHistory as any}
                    onApplyService={handleApplyService}
                    onLoadInvoice={handleLoadInvoice as any}
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
        </Tabs>
      </main>
    </div>
  );
};

export default InvoiceGenerator;
