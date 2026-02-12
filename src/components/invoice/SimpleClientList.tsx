
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSavedClients, saveClients as saveClientsToStorage, generateSecureId } from '@/lib/safeStorage';

interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
}

interface SimpleClientListProps {
  onSelectClient?: (client: Client) => void;
}

const SimpleClientList = ({ onSelectClient }: SimpleClientListProps) => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', company: '' });

  useEffect(() => {
    // Use safe parsing utility
    const savedClients = getSavedClients();
    setClients(savedClients as Client[]);
  }, []);

  const saveClients = (updatedClients: Client[]) => {
    setClients(updatedClients);
    // Use safe storage utility - need to adapt the interface
    saveClientsToStorage(updatedClients.map(c => ({
      ...c,
      company: c.company || '',
      phone: '',
      address: '',
      notes: ''
    })));
  };

  const addClient = () => {
    if (!newClient.name || !newClient.email) {
      toast({
        title: "Missing Information",
        description: "Please enter client name and email",
        variant: "destructive"
      });
      return;
    }

    const client: Client = {
      id: generateSecureId(),
      name: newClient.name,
      email: newClient.email,
      company: newClient.company
    };

    const updatedClients = [client, ...clients];
    saveClients(updatedClients);
    setNewClient({ name: '', email: '', company: '' });
    setShowAddForm(false);
    
    toast({
      title: "Client Added",
      description: `${client.name} has been added to your client list`
    });
  };

  const deleteClient = (clientId: string) => {
    const updatedClients = clients.filter(client => client.id !== clientId);
    saveClients(updatedClients);
    
    toast({
      title: "Client Deleted",
      description: "Client has been removed from your list"
    });
  };

  const selectClient = (client: Client) => {
    if (onSelectClient) {
      onSelectClient(client);
      toast({
        title: "Client Selected",
        description: `${client.name} has been selected for the invoice`
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-teal-600" />
          <h3 className="font-semibold text-gray-800">Quick Client Select</h3>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          size="sm"
          className="bg-teal-600 hover:bg-teal-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Client
        </Button>
      </div>

      {/* Add Client Form */}
      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
          <Input
            placeholder="Client Name"
            value={newClient.name}
            onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
          />
          <Input
            placeholder="Email"
            type="email"
            value={newClient.email}
            onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
          />
          <Input
            placeholder="Company (optional)"
            value={newClient.company}
            onChange={(e) => setNewClient(prev => ({ ...prev, company: e.target.value }))}
          />
          <div className="flex gap-2">
            <Button onClick={addClient} size="sm" className="bg-green-600 hover:bg-green-700">
              Add Client
            </Button>
            <Button 
              onClick={() => setShowAddForm(false)} 
              variant="outline" 
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Client List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {clients.length === 0 ? (
          <div className="text-center text-gray-500 py-6">
            <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No clients yet</p>
            <p className="text-sm">Add your first client to get started</p>
          </div>
        ) : (
          clients.map((client) => (
            <div
              key={client.id}
              className="flex items-center justify-between p-3 bg-white border rounded-lg hover:border-teal-300 transition-colors"
            >
              <div className="flex-1 cursor-pointer" onClick={() => selectClient(client)}>
                <div className="font-medium text-gray-900">{client.name}</div>
                <div className="text-sm text-gray-600">{client.email}</div>
                {client.company && (
                  <div className="text-xs text-gray-500">{client.company}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => selectClient(client)}
                  size="sm"
                  variant="outline"
                  className="text-xs px-2 py-1"
                >
                  Select
                </Button>
                <Button
                  onClick={() => deleteClient(client.id)}
                  size="sm"
                  variant="destructive"
                  className="p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {clients.length > 0 && (
        <div className="text-xs text-gray-500 text-center">
          Click on a client to auto-fill their information in your invoice
        </div>
      )}
    </div>
  );
};

export default SimpleClientList;
