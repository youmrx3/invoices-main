
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InvoiceDetailsFormProps {
  invoiceNumber: string;
  projectName: string;
  invoiceDate: string;
  dueDate: string;
  onUpdate: (field: string, value: string) => void;
}

const InvoiceDetailsForm: React.FC<InvoiceDetailsFormProps> = ({
  invoiceNumber,
  projectName,
  invoiceDate,
  dueDate,
  onUpdate
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="invoiceNumber" className="text-sm font-medium text-gray-700">Invoice Number</Label>
          <Input
            id="invoiceNumber"
            value={invoiceNumber}
            onChange={(e) => onUpdate('invoiceNumber', e.target.value)}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectName" className="text-sm font-medium text-gray-700">Project Name</Label>
          <Input
            id="projectName"
            value={projectName}
            onChange={(e) => onUpdate('projectName', e.target.value)}
            placeholder="Project title"
            className="h-11"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="invoiceDate" className="text-sm font-medium text-gray-700">Invoice Date</Label>
          <Input
            id="invoiceDate"
            type="date"
            value={invoiceDate}
            onChange={(e) => onUpdate('invoiceDate', e.target.value)}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate" className="text-sm font-medium text-gray-700">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => onUpdate('dueDate', e.target.value)}
            className="h-11"
          />
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailsForm;
