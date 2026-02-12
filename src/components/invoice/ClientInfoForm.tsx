
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ClientInfoFormProps {
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientAddress: string;
  onUpdate: (field: string, value: string) => void;
}

const ClientInfoForm: React.FC<ClientInfoFormProps> = ({
  clientName,
  clientCompany,
  clientEmail,
  clientAddress,
  onUpdate
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="clientName" className="text-sm font-medium text-gray-700">Client Name</Label>
          <Input
            id="clientName"
            value={clientName}
            onChange={(e) => onUpdate('clientName', e.target.value)}
            placeholder="Client's full name"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientCompany" className="text-sm font-medium text-gray-700">Company</Label>
          <Input
            id="clientCompany"
            value={clientCompany}
            onChange={(e) => onUpdate('clientCompany', e.target.value)}
            placeholder="Company name"
            className="h-11"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="clientEmail" className="text-sm font-medium text-gray-700">Email</Label>
        <Input
          id="clientEmail"
          type="email"
          value={clientEmail}
          onChange={(e) => onUpdate('clientEmail', e.target.value)}
          placeholder="client@email.com"
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="clientAddress" className="text-sm font-medium text-gray-700">Address</Label>
        <Textarea
          id="clientAddress"
          value={clientAddress}
          onChange={(e) => onUpdate('clientAddress', e.target.value)}
          placeholder="Client's address"
          rows={3}
          className="resize-none"
        />
      </div>
    </div>
  );
};

export default ClientInfoForm;
