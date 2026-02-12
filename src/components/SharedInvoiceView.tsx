
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getSavedInvoiceById, SavedInvoice } from '@/lib/safeStorage';

interface ServiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

const SharedInvoiceView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoice');

  // Use the safe storage utility to get the invoice
  const invoice: SavedInvoice | null = invoiceId ? getSavedInvoiceById(invoiceId) : null;

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Invoice Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">The requested invoice could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculateSubtotal = (services: ServiceItem[]) => {
    return services.reduce((sum, service) => sum + (service.quantity * service.rate), 0);
  };

  const calculateTax = (subtotal: number, taxRate: number) => {
    return (subtotal * taxRate) / 100;
  };

  // Cast services to the proper type (safe storage validates the data)
  const invoiceServices = (invoice.services || []) as ServiceItem[];
  const subtotal = calculateSubtotal(invoiceServices);
  const tax = calculateTax(subtotal, invoice.taxRate);
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card className="border-0 shadow-2xl bg-white">
          <CardContent className="p-0">
            <div className="bg-white p-8">
              {/* Enhanced Invoice Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">INVOICE</h1>
                  <p className="text-gray-600 font-mono text-sm">#{invoice.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">youber</h2>
                  </div>
                  <p className="text-gray-600 text-sm">Graphic Designer</p>
                  {invoice.designerName && (
                    <p className="text-gray-800 font-semibold mt-1">{invoice.designerName}</p>
                  )}
                </div>
              </div>

              {/* Designer & Client Info */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 pb-1 border-b-2 border-blue-500">From:</h3>
                  <div className="text-sm text-gray-600 space-y-1.5">
                    <p className="font-semibold text-gray-900">{invoice.designerName}</p>
                    <p>{invoice.designerEmail}</p>
                    <p>{invoice.designerPhone}</p>
                    {invoice.designerWebsite && <p className="text-blue-600">{invoice.designerWebsite}</p>}
                    <div className="whitespace-pre-line pt-1">{invoice.designerAddress}</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 pb-1 border-b-2 border-indigo-500">To:</h3>
                  <div className="text-sm text-gray-600 space-y-1.5">
                    <p className="font-semibold text-gray-900">{invoice.clientName}</p>
                    {invoice.clientCompany && <p className="font-medium text-gray-800">{invoice.clientCompany}</p>}
                    <p>{invoice.clientEmail}</p>
                    <div className="whitespace-pre-line pt-1">{invoice.clientAddress}</div>
                  </div>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Project:</p>
                  <p className="font-semibold text-lg text-gray-900">{invoice.projectName}</p>
                </div>
                <div className="text-right">
                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="text-gray-600">Date: </span>
                      <span className="font-medium">{invoice.invoiceDate}</span>
                    </div>
                    {invoice.dueDate && (
                      <div className="text-sm">
                        <span className="text-gray-600">Due: </span>
                        <span className="font-medium text-red-600">{invoice.dueDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="mb-6" />

              {/* Services Table */}
              <div className="mb-8">
                <div className="grid grid-cols-12 gap-4 font-bold text-sm text-white bg-gradient-to-r from-gray-800 to-gray-600 p-3 rounded-lg mb-4">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2 text-center">Qty/Hours</div>
                  <div className="col-span-2 text-center">Rate (DZD)</div>
                  <div className="col-span-2 text-right">Amount (DZD)</div>
                </div>
                {invoiceServices.map((service, index) => (
                  <div key={service.id} className={`grid grid-cols-12 gap-4 text-sm py-4 px-2 rounded-lg ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <div className="col-span-6">
                      <div className="whitespace-pre-line font-medium">{service.description}</div>
                    </div>
                    <div className="col-span-2 text-center font-medium">{service.quantity}</div>
                    <div className="col-span-2 text-center">{service.rate.toFixed(2)} DZD</div>
                    <div className="col-span-2 text-right font-bold text-blue-600">
                      {(service.quantity * service.rate).toFixed(2)} DZD
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-8">
                <div className="w-80 space-y-3 bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{subtotal.toFixed(2)} DZD</span>
                  </div>
                  {invoice.taxRate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax ({invoice.taxRate}%):</span>
                      <span className="font-medium">{tax.toFixed(2)} DZD</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-xl">
                    <span>Total:</span>
                    <span className="text-blue-600">{total.toFixed(2)} DZD</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="border-t pt-6 bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-900 mb-2">Notes:</h4>
                  <div className="text-sm text-gray-700 whitespace-pre-line">{invoice.notes}</div>
                </div>
              )}

              {/* Enhanced Footer */}
              <div className="text-center text-sm text-gray-500 mt-8 pt-6 border-t">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  <span className="font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">youber</span>
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                </div>
                <p>Thank you for your business!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SharedInvoiceView;
