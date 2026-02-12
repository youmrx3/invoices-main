import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  History, 
  FileText, 
  TrendingUp, 
  Package, 
  ArrowRight,
  Lightbulb,
  Calendar,
  DollarSign
} from 'lucide-react';
import { type SavedInvoice } from '@/lib/safeStorage';

interface ServiceSuggestion {
  description: string;
  avgRate: number;
  avgQuantity: number;
  usageCount: number;
  lastUsed: string;
}

interface ClientHistoryPanelProps {
  clientName: string;
  invoiceHistory: SavedInvoice[];
  onApplyService: (description: string, rate: number, quantity: number) => void;
  onLoadInvoice: (invoice: SavedInvoice) => void;
}

const ClientHistoryPanel: React.FC<ClientHistoryPanelProps> = ({
  clientName,
  invoiceHistory,
  onApplyService,
  onLoadInvoice
}) => {
  // Extract service suggestions from history
  const serviceSuggestions = useMemo((): ServiceSuggestion[] => {
    const serviceMap = new Map<string, {
      rates: number[];
      quantities: number[];
      dates: string[];
    }>();

    invoiceHistory.forEach(invoice => {
      invoice.services.forEach(service => {
        const key = service.description.toLowerCase().trim();
        if (key) {
          const existing = serviceMap.get(key) || { rates: [], quantities: [], dates: [] };
          existing.rates.push(service.rate);
          existing.quantities.push(service.quantity);
          existing.dates.push(invoice.invoiceDate);
          serviceMap.set(key, existing);
        }
      });
    });

    return Array.from(serviceMap.entries())
      .map(([desc, data]) => ({
        description: desc.charAt(0).toUpperCase() + desc.slice(1),
        avgRate: data.rates.reduce((a, b) => a + b, 0) / data.rates.length,
        avgQuantity: data.quantities.reduce((a, b) => a + b, 0) / data.quantities.length,
        usageCount: data.rates.length,
        lastUsed: data.dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 6);
  }, [invoiceHistory]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalSpent = invoiceHistory.reduce((sum, inv) => sum + inv.total, 0);
    const avgInvoice = invoiceHistory.length > 0 ? totalSpent / invoiceHistory.length : 0;
    return { totalSpent, avgInvoice };
  }, [invoiceHistory]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (invoiceHistory.length === 0) {
    return (
      <div className="p-6 text-center bg-muted/30 rounded-xl border border-border">
        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <h4 className="font-semibold text-foreground mb-1">New Client</h4>
        <p className="text-sm text-muted-foreground">
          No previous invoices found for {clientName}. 
          <br />This is your first project together!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Client Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {stats.totalSpent.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">DZD</span>
          </p>
        </div>
        <div className="p-4 bg-muted/50 rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Avg Invoice</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {stats.avgInvoice.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">DZD</span>
          </p>
        </div>
      </div>

      {/* Service Suggestions */}
      {serviceSuggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h4 className="font-semibold text-foreground">Price Suggestions</h4>
            <Badge variant="secondary" className="text-xs">Based on history</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Click to add these services with your previous rates
          </p>
          <div className="grid gap-2">
            {serviceSuggestions.map((service, idx) => (
              <button
                key={idx}
                onClick={() => onApplyService(
                  service.description,
                  Math.round(service.avgRate),
                  Math.round(service.avgQuantity)
                )}
                className="w-full p-3 text-left bg-card hover:bg-accent/50 rounded-lg border border-border transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground truncate">
                        {service.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>Used {service.usageCount}x</span>
                      <span>•</span>
                      <span>Last: {formatDate(service.lastUsed)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-primary">{Math.round(service.avgRate)} DZD</p>
                      <p className="text-xs text-muted-foreground">avg rate</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Past Invoices */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-muted-foreground" />
          <h4 className="font-semibold text-foreground">Past Invoices</h4>
          <Badge variant="outline" className="text-xs">{invoiceHistory.length}</Badge>
        </div>
        <ScrollArea className="h-48">
          <div className="space-y-2 pr-4">
            {invoiceHistory.slice(0, 10).map((invoice) => (
              <div
                key={invoice.id}
                className="p-3 bg-card rounded-lg border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-medium text-foreground">
                    {invoice.invoiceNumber}
                  </span>
                  <span className="font-bold text-primary">
                    {invoice.total.toFixed(0)} DZD
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(invoice.invoiceDate)}
                  </span>
                  <span>{invoice.projectName || 'No project name'}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Services:</p>
                  <div className="flex flex-wrap gap-1">
                    {invoice.services.slice(0, 3).map((service, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {service.description.slice(0, 20)}{service.description.length > 20 ? '...' : ''}
                      </Badge>
                    ))}
                    {invoice.services.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{invoice.services.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-xs"
                  onClick={() => onLoadInvoice(invoice)}
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Use as Template
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ClientHistoryPanel;
