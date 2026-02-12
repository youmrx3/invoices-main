import React from 'react';
import { getBusinessSettings } from '@/lib/businessSettings';
import { getInvoiceLayout, getDefaultLabel } from '@/lib/invoiceLayout';

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

interface PrintableInvoiceProps {
  invoiceData: InvoiceData;
}

const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ invoiceData }) => {
  const settings = getBusinessSettings();
  const layout = getInvoiceLayout();
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

  // Helper to get alignment CSS class
  const getAlignClass = (alignment: string) => {
    switch(alignment) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  // Helper to get vertical alignment CSS class
  const getVerticalAlignClass = (alignment: string) => {
    switch(alignment) {
      case 'center': return 'items-center';
      case 'bottom': return 'items-end';
      default: return 'items-start';
    }
  };

  // Helper to get header alignment
  const getHeaderVerticalAlign = (alignment: string) => {
    switch(alignment) {
      case 'center': return 'items-center';
      case 'flex-end': return 'items-end';
      default: return 'items-start';
    }
  };

  const sortedMeta = [...layout.metaFields].sort((a, b) => a.order - b.order);
  const sortedSections = [...layout.sections].sort((a, b) => a.order - b.order);

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
      <div className="w-full max-w-4xl mx-auto bg-white p-8 print:p-8 print:max-w-none" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Section - Header (Left) and From Info (Right) */}
      <div className="flex justify-between items-start gap-8 mb-8 pb-6 border-b border-gray-200">
        {/* Header - Logo and Business Name on Left */}
        <div className="flex-1">
          <div className={`flex ${getAlignClass(layout.header.businessNameAlign)} items-start gap-4`}>
            {layout.header.showLogo && settings.logoEnabled && settings.logoUrl && (
              <img src={settings.logoUrl} alt="Logo" className="h-16 w-auto object-contain" />
            )}
            <div className={`flex flex-col ${getAlignClass(layout.header.businessNameAlign)}`}>
              {layout.header.showBusinessName && (
                <h2 className={`text-3xl font-bold text-gray-900 ${getAlignClass(layout.header.businessNameAlign)}`}>
                  {settings.businessName || 'Invoice'}
                </h2>
              )}
              {layout.header.showTagline && settings.tagline && (
                <p className={`text-sm text-gray-600 mt-1 ${getAlignClass(layout.header.taglineAlign)}`}>
                  {settings.tagline}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* From Info on Right */}
        {layout.parties.showFrom && (
          <div className={`flex-1 p-5 bg-gray-50 rounded-xl ${getAlignClass(layout.parties.textAlignment)}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider text-gray-500 mb-3`}>
              {layout.parties.fromLabel || 'From'}
            </h3>
            <div className={`space-y-1.5 text-sm`}>
              {settings.showOwnerName && invoiceData.designerName && (
                <p className="font-bold text-gray-900 text-base">{invoiceData.designerName}</p>
              )}
              {settings.showEmail && invoiceData.designerEmail && (
                <p className="text-gray-700">{invoiceData.designerEmail}</p>
              )}
              {settings.showPhone && invoiceData.designerPhone && (
                <p className="text-gray-700">{invoiceData.designerPhone}</p>
              )}
              {settings.showWebsite && invoiceData.designerWebsite && (
                <p className="text-blue-600">{invoiceData.designerWebsite}</p>
              )}
              {settings.showAddress && invoiceData.designerAddress && (
                <p className="text-gray-600 whitespace-pre-line text-xs mt-2">{invoiceData.designerAddress}</p>
              )}
              {visibleCustomFields.map(field => (
                <p key={field.id} className="text-gray-600 text-xs">
                  <span className="font-medium">{field.label}:</span> {field.value}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Client Info Section (Full Width Below) */}
      <div className="mb-6">
        {layout.parties.showTo && (
          <div className={`p-5 bg-gray-50 rounded-xl ${getAlignClass(layout.parties.textAlignment)}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider text-gray-500 mb-3`}>
              {layout.parties.toLabel || 'To'}
            </h3>
            <div className={`space-y-1.5 text-sm`}>
              <p className="font-bold text-gray-900 text-base">{invoiceData.clientName}</p>
              {invoiceData.clientCompany && (
                <p className="font-semibold text-gray-800">{invoiceData.clientCompany}</p>
              )}
              {invoiceData.clientEmail && (
                <p className="text-gray-700">{invoiceData.clientEmail}</p>
              )}
              {invoiceData.clientAddress && (
                <p className="text-gray-600 whitespace-pre-line mt-2">{invoiceData.clientAddress}</p>
              )}
            </div>
            
            {/* Invoice Title and Number with Dates on Right */}
            {layout.header.showDocumentTitle && (
              <div className={`mt-6 pt-4 border-t border-gray-200`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className={`text-3xl font-bold text-gray-900`}>
                      INVOICE
                    </h1>
                    {layout.header.showDocumentNumber && (
                      <p className={`text-sm font-mono text-gray-600 mt-1`}>
                        #{invoiceData.invoiceNumber}
                      </p>
                    )}
                  </div>
                  
                  {/* Dates on Right */}
                  <div className={`text-right space-y-2`}>
                    {sortedMeta.filter(f => f.visible && f.key === 'invoiceDate').map(field => {
                      const fieldLabel = field.label || getDefaultLabel(field.key, 'en');
                      return (
                        <div key={field.id} className="text-xs">
                          <p className="font-semibold uppercase tracking-wider text-gray-500 mb-1">
                            {fieldLabel}
                          </p>
                          <p className="font-bold text-gray-900 text-sm">
                            {invoiceData.invoiceDate}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Meta Info - Project only */}
      <div className="grid grid-cols-1 gap-6 mb-8 p-4 bg-gray-100 rounded-xl">
        {sortedMeta.filter(f => f.visible && f.key === 'project').map(field => {
          const fieldLabel = field.label || getDefaultLabel(field.key, 'en');
          return (
            <div key={field.id} className={getAlignClass(field.alignment)}>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                {fieldLabel}
              </p>
              <p className="font-bold text-gray-900">
                {field.key === 'project' && (invoiceData.projectName || '-')}
              </p>
            </div>
          );
        })}
      </div>

      {/* Services Table */}
      {sortedSections.find(s => s.key === 'services' && s.visible) && (
        <div className="mb-8">
          <div className="bg-gray-800 text-white rounded-t-xl">
            <div className="grid grid-cols-12 gap-4 text-xs font-bold uppercase tracking-wider p-4">
              <div className="col-span-6">Description</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-center">Rate</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>
          </div>
          
          <div className="border-l border-r border-gray-200">
            {invoiceData.services.map((service, index) => (
              <div 
                key={service.id} 
                className={`grid grid-cols-12 gap-4 text-sm py-4 px-4 border-b border-gray-100 ${
                  index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                }`}
              >
                <div className="col-span-6">
                  <p className="font-medium text-gray-800 whitespace-pre-line">
                    {service.description}
                  </p>
                </div>
                <div className="col-span-2 text-center font-bold text-gray-700">
                  {service.quantity}
                </div>
                <div className="col-span-2 text-center text-gray-600">
                  {service.rate.toFixed(2)} {currency}
                </div>
                <div className="col-span-2 text-right font-bold text-blue-600 text-base">
                  {(service.quantity * service.rate).toFixed(2)} {currency}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Totals */}
      {sortedSections.find(s => s.key === 'totals' && s.visible) && (
        <div className={`flex ${(() => {
          const alignment = sortedSections.find(s => s.key === 'totals')?.alignment || 'right';
          return alignment === 'center' ? 'justify-center' : alignment === 'left' ? 'justify-start' : 'justify-end';
        })()} mb-8`}>
          <div className="w-80 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 font-medium">Subtotal:</span>
                <span className="font-bold text-gray-900">{subtotal.toFixed(2)} {currency}</span>
              </div>
              {invoiceData.taxRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 font-medium">{settings.taxLabel || 'Tax'} ({invoiceData.taxRate}%):</span>
                  <span className="font-bold text-gray-900">{tax.toFixed(2)} {currency}</span>
                </div>
              )}
              <div className="border-t-2 border-blue-300 pt-3">
                <div className="flex justify-between font-bold text-xl">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-blue-600">
                    {total.toFixed(2)} {currency}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods */}
      {sortedSections.find(s => s.key === 'payment' && s.visible) && enabledPaymentMethods.length > 0 && (
        <div className={`bg-green-50 border border-green-200 rounded-xl p-6 mb-6 ${getAlignClass(sortedSections.find(s => s.key === 'payment')?.alignment || 'left')}`}>
          <h4 className="text-sm font-bold text-green-800 mb-3">Payment Methods</h4>
          <div className="grid grid-cols-2 gap-4">
            {enabledPaymentMethods.map(method => (
              <div key={method.id} className="text-sm">
                <span className="font-semibold text-green-700">{method.name}</span>
                {method.details && (
                  <p className="text-green-600 whitespace-pre-line mt-1 text-xs">{method.details}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {sortedSections.find(s => s.key === 'notes' && s.visible) && invoiceData.notes && (
        <div className={`bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 ${getAlignClass(sortedSections.find(s => s.key === 'notes')?.alignment || 'left')}`}>
          <h4 className="text-sm font-bold text-amber-800 mb-2">Notes & Terms</h4>
          <p className="text-sm text-amber-700 whitespace-pre-line">{invoiceData.notes}</p>
        </div>
      )}

      {/* Footer */}
      {sortedSections.find(s => s.key === 'footer' && s.visible) && settings.showFooter && settings.footerText && (
        <div className={`pt-6 border-t-2 border-gray-200 ${getAlignClass(sortedSections.find(s => s.key === 'footer')?.alignment || 'center')}`}>
          <p className="text-sm text-gray-600">{settings.footerText}</p>
        </div>
      )}
      </div>
    </>
  );
};

export default PrintableInvoice;
