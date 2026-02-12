import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, User, Building, Mail, Clock, DollarSign } from 'lucide-react';
import { getSavedClients, getSavedInvoices, type Client, type SavedInvoice } from '@/lib/safeStorage';

interface SmartClientSearchProps {
  onSelectClient: (client: Client & { invoiceHistory?: SavedInvoice[] }) => void;
  selectedClientId?: string;
}

const SmartClientSearch: React.FC<SmartClientSearchProps> = ({ 
  onSelectClient,
  selectedClientId 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<SavedInvoice[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setClients(getSavedClients());
    setInvoices(getSavedInvoices());
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get client invoice history
  const getClientHistory = (clientName: string, clientEmail: string): SavedInvoice[] => {
    return invoices.filter(
      inv => inv.clientName.toLowerCase() === clientName.toLowerCase() ||
             inv.clientEmail.toLowerCase() === clientEmail.toLowerCase()
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  // Get total spent by client
  const getClientTotalSpent = (clientName: string, clientEmail: string): number => {
    return getClientHistory(clientName, clientEmail).reduce((sum, inv) => sum + inv.total, 0);
  };

  // Get last invoice date
  const getLastInvoiceDate = (clientName: string, clientEmail: string): string | null => {
    const history = getClientHistory(clientName, clientEmail);
    return history.length > 0 ? history[0].invoiceDate : null;
  };

  // Filtered and sorted clients
  const filteredClients = useMemo(() => {
    let filtered = clients;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = clients.filter(
        client =>
          client.name.toLowerCase().includes(term) ||
          client.email.toLowerCase().includes(term) ||
          client.company?.toLowerCase().includes(term)
      );
    }

    // Sort by most recent invoice (returning clients first)
    return filtered.sort((a, b) => {
      const aHistory = getClientHistory(a.name, a.email);
      const bHistory = getClientHistory(b.name, b.email);
      
      if (aHistory.length && !bHistory.length) return -1;
      if (!aHistory.length && bHistory.length) return 1;
      if (aHistory.length && bHistory.length) {
        return new Date(bHistory[0].createdAt).getTime() - new Date(aHistory[0].createdAt).getTime();
      }
      return 0;
    });
  }, [clients, searchTerm, invoices]);

  const handleSelectClient = (client: Client) => {
    const history = getClientHistory(client.name, client.email);
    onSelectClient({ ...client, invoiceHistory: history });
    setSearchTerm(client.name);
    setIsOpen(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search clients by name, email, or company..."
          className="pl-10 h-12 text-base bg-background border-input"
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-muted/50 border-b border-border">
            <p className="text-sm font-medium text-foreground">
              {searchTerm ? `Results for "${searchTerm}"` : 'Recent & Returning Clients'}
            </p>
            <p className="text-xs text-muted-foreground">
              {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {/* Client List */}
          <div className="max-h-72 overflow-y-auto">
            {filteredClients.length === 0 ? (
              <div className="p-6 text-center">
                <User className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No clients found</p>
                <p className="text-sm text-muted-foreground">Add a new client below</p>
              </div>
            ) : (
              filteredClients.map((client) => {
                const history = getClientHistory(client.name, client.email);
                const totalSpent = getClientTotalSpent(client.name, client.email);
                const lastDate = getLastInvoiceDate(client.name, client.email);
                const isReturning = history.length > 0;
                const isSelected = client.id === selectedClientId;

                return (
                  <button
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className={`w-full p-4 text-left hover:bg-accent/50 transition-colors border-b border-border last:border-0 ${
                      isSelected ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground truncate">
                            {client.name}
                          </span>
                          {isReturning && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">
                              Returning
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {client.company && (
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {client.company}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {client.email}
                          </span>
                        </div>

                        {isReturning && (
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                              <DollarSign className="w-3 h-3" />
                              {totalSpent.toFixed(0)} DZD total
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {history.length} invoice{history.length !== 1 ? 's' : ''}
                            </span>
                            {lastDate && (
                              <span className="text-muted-foreground">
                                Last: {formatDate(lastDate)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartClientSearch;
