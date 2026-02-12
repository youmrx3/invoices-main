
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Send } from 'lucide-react';

interface SavedInvoice {
  id: string;
  createdAt: string;
  total: number;
  invoiceNumber: string;
  clientName: string;
  projectName: string;
}

interface InvoiceHistoryProps {
  savedInvoices: SavedInvoice[];
  onExportPDF: (invoice: SavedInvoice) => void;
  onCopyLink: (invoice: SavedInvoice) => void;
}

const InvoiceHistory: React.FC<InvoiceHistoryProps> = ({
  savedInvoices,
  onExportPDF,
  onCopyLink
}) => {
  if (savedInvoices.length === 0) {
    return null;
  }

  return (
    <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-t-lg">
        <CardTitle className="text-xl flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          Saved Invoices ({savedInvoices.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          {savedInvoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-gray-900">#{invoice.invoiceNumber}</p>
                  <span className="text-gray-500">•</span>
                  <p className="text-gray-700">{invoice.clientName}</p>
                  {invoice.projectName && (
                    <>
                      <span className="text-gray-500">•</span>
                      <p className="text-gray-600">{invoice.projectName}</p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="font-semibold text-blue-600">{invoice.total.toFixed(2)} DZD</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => onExportPDF(invoice)}
                  size="sm"
                  variant="outline"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </Button>
                <Button
                  onClick={() => onCopyLink(invoice)}
                  size="sm"
                  variant="outline"
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <Send className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceHistory;
