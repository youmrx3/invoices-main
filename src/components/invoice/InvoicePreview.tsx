import React from 'react';
import { getBusinessSettings } from '@/lib/businessSettings';

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
}

interface InvoicePreviewProps {
  invoiceData: InvoiceData;
  onSaveInvoice: () => void;
  onExportPDF: () => void;
  isForPrint?: boolean;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoiceData,
  isForPrint = false
}) => {
  const settings = getBusinessSettings();
  const currency = settings.currencySymbol || 'DZD';

  const calculateSubtotal = (services: ServiceItem[]) => {
    return services.reduce((sum, service) => sum + (service.quantity * service.rate), 0);
  };

  const calculateTax = (subtotal: number, taxRate: number) => {
    return (subtotal * taxRate) / 100;
  };

  const subtotal = calculateSubtotal(invoiceData.services);
  const tax = calculateTax(subtotal, invoiceData.taxRate);
  const total = subtotal + tax;

  const enabledPaymentMethods = settings.paymentMethods.filter(m => m.enabled);
  const visibleCustomFields = settings.customFields.filter(f => f.showOnInvoice && f.value);

  return (
    <>
      <style>{`
        @media print {
          @page {
            margin: 0 !important;
            padding: 0 !important;
            size: A4;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            width: 100% !important;
            background: white !important;
          }
          body::before,
          body::after {
            content: '' !important;
            display: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
        @page :first {
          margin: 0 !important;
        }
        @page :last {
          margin: 0 !important;
        }
      `}</style>
      <div className={`bg-white ${isForPrint ? 'print-content' : 'p-6'}`}>
      {/* Top Section - Header (Left) and From Info (Right) */}
      <div className="flex justify-between items-start gap-6 mb-8 pb-6 border-b border-border">
        {/* Header - Logo and Business Name on Left */}
        <div className="flex-1">
          <div className="flex items-start gap-4">
            {settings.logoEnabled && settings.logoUrl && (
              <img src={settings.logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
            )}
            <div>
              <h2 className="text-3xl font-bold text-foreground">
                {settings.businessName || 'Invoice'}
              </h2>
              {settings.tagline && (
                <p className="text-sm text-muted-foreground mt-1">
                  {settings.tagline}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* From Info on Right */}
        <div className="flex-1 p-4 bg-muted/30 rounded-lg">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">From</h3>
          <div className="space-y-1 text-sm">
            {settings.showOwnerName && invoiceData.designerName && (
              <p className="font-semibold text-foreground">{invoiceData.designerName}</p>
            )}
            {settings.showEmail && invoiceData.designerEmail && (
              <p className="text-muted-foreground">{invoiceData.designerEmail}</p>
            )}
            {settings.showPhone && invoiceData.designerPhone && (
              <p className="text-muted-foreground">{invoiceData.designerPhone}</p>
            )}
            {settings.showWebsite && invoiceData.designerWebsite && (
              <p className="text-primary">{invoiceData.designerWebsite}</p>
            )}
            {settings.showAddress && invoiceData.designerAddress && (
              <p className="text-muted-foreground whitespace-pre-line text-xs mt-2">{invoiceData.designerAddress}</p>
            )}
            {visibleCustomFields.map(field => (
              <p key={field.id} className="text-xs text-muted-foreground">
                <span className="font-medium">{field.label}:</span> {field.value}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Client Info Section (Full Width Below) */}
      <div className="mb-6">
        <div className="p-4 bg-muted/30 rounded-lg">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">To</h3>
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-foreground">{invoiceData.clientName || 'Client Name'}</p>
            {invoiceData.clientCompany && (
              <p className="font-medium text-foreground">{invoiceData.clientCompany}</p>
            )}
            {invoiceData.clientEmail && (
              <p className="text-muted-foreground">{invoiceData.clientEmail}</p>
            )}
            {invoiceData.clientAddress && (
              <p className="text-muted-foreground whitespace-pre-line text-xs mt-2">{invoiceData.clientAddress}</p>
            )}
          </div>
          
          {/* Invoice Title and Number with Dates on Right */}
          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">INVOICE</h1>
                <p className="text-sm font-mono text-muted-foreground mt-1">#{invoiceData.invoiceNumber}</p>
              </div>
              
              {/* Dates on Right */}
              <div className="text-right text-xs space-y-2">
                <div>
                  <p className="text-muted-foreground uppercase">Date</p>
                  <p className="font-medium text-sm">{invoiceData.invoiceDate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase">Due</p>
                  <p className="font-medium text-sm">{invoiceData.dueDate || 'On Receipt'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meta Info - Project only */}
      <div className="grid grid-cols-1 gap-4 mb-6 p-3 bg-muted/50 rounded-lg">
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase">Project</p>
          <p className="font-medium text-sm truncate">{invoiceData.projectName || '-'}</p>
        </div>
      </div>

      {/* Services Table */}
      <div className="mb-6">
        <div className="grid grid-cols-12 gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-foreground/5 p-2 rounded-t-lg">
          <div className="col-span-6">Description</div>
          <div className="col-span-2 text-center">Qty</div>
          <div className="col-span-2 text-center">Rate</div>
          <div className="col-span-2 text-right">Amount</div>
        </div>
        {invoiceData.services.map((service, index) => (
          <div 
            key={service.id} 
            className={`grid grid-cols-12 gap-2 text-sm py-3 px-2 ${index % 2 === 0 ? 'bg-muted/20' : ''}`}
          >
            <div className="col-span-6">
              <p className="font-medium whitespace-pre-line text-foreground">
                {service.description || 'Service description'}
              </p>
            </div>
            <div className="col-span-2 text-center font-medium">{service.quantity}</div>
            <div className="col-span-2 text-center text-muted-foreground">{service.rate.toFixed(0)} {currency}</div>
            <div className="col-span-2 text-right font-semibold text-primary">
              {(service.quantity * service.rate).toFixed(0)} {currency}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-56 space-y-2 p-4 bg-muted/30 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{subtotal.toFixed(0)} {currency}</span>
          </div>
          {invoiceData.taxRate > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{settings.taxLabel || 'Tax'} ({invoiceData.taxRate}%)</span>
              <span className="font-medium">{tax.toFixed(0)} {currency}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-border font-bold text-lg">
            <span>Total</span>
            <span className="text-primary">{total.toFixed(0)} {currency}</span>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      {enabledPaymentMethods.length > 0 && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400 mb-2">Payment Methods</h4>
          <div className="space-y-2">
            {enabledPaymentMethods.map(method => (
              <div key={method.id} className="text-sm">
                <span className="font-medium text-green-800 dark:text-green-300">{method.name}</span>
                {method.details && (
                  <p className="text-xs text-green-600 dark:text-green-500 whitespace-pre-line mt-0.5">{method.details}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {invoiceData.notes && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900 mb-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-1">Notes</h4>
          <p className="text-sm text-amber-800 dark:text-amber-300 whitespace-pre-line">{invoiceData.notes}</p>
        </div>
      )}

      {/* Footer */}
      {settings.showFooter && settings.footerText && (
        <div className="text-center pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">{settings.footerText}</p>
        </div>
      )}
    </div>
    </>
  );
};

export default InvoicePreview;
