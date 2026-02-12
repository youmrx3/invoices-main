
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';

interface ServiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

interface ServicesFormProps {
  services: ServiceItem[];
  taxRate: number;
  onAddService: () => void;
  onUpdateService: (id: string, field: keyof ServiceItem, value: string | number) => void;
  onRemoveService: (id: string) => void;
  onUpdateTaxRate: (taxRate: number) => void;
}

const ServicesForm: React.FC<ServicesFormProps> = ({
  services,
  taxRate,
  onAddService,
  onUpdateService,
  onRemoveService,
  onUpdateTaxRate
}) => {
  return (
    <div className="space-y-6">
      {/* Add Service Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Service Items</h3>
          <p className="text-sm text-gray-500">Add the services you're billing for</p>
        </div>
        <Button 
          onClick={onAddService} 
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </Button>
      </div>

      {/* Services List */}
      <div className="space-y-4">
        {services.map((service, index) => (
          <div key={service.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800">
                Service {index + 1}
              </span>
              {services.length > 1 && (
                <Button
                  onClick={() => onRemoveService(service.id)}
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-700">Description</Label>
                <Textarea
                  value={service.description}
                  onChange={(e) => onUpdateService(service.id, 'description', e.target.value)}
                  placeholder="Describe the service provided"
                  rows={2}
                  className="mt-1 resize-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Quantity/Hours</Label>
                  <Input
                    type="number"
                    value={service.quantity}
                    onChange={(e) => onUpdateService(service.id, 'quantity', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.5"
                    className="mt-1 h-10"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Rate (DZD)</Label>
                  <Input
                    type="number"
                    value={service.rate}
                    onChange={(e) => onUpdateService(service.id, 'rate', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="mt-1 h-10"
                  />
                </div>
              </div>
              
              <div className="text-right">
                <div className="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                  Total: {(service.quantity * service.rate).toFixed(2)} DZD
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Tax Rate */}
      <div className="pt-4 border-t border-gray-200">
        <div className="max-w-xs">
          <Label htmlFor="taxRate" className="text-sm font-medium text-gray-700">Tax Rate (%)</Label>
          <Input
            id="taxRate"
            type="number"
            value={taxRate}
            onChange={(e) => onUpdateTaxRate(parseFloat(e.target.value) || 0)}
            min="0"
            max="100"
            step="0.1"
            className="mt-1 h-10"
          />
        </div>
      </div>
    </div>
  );
};

export default ServicesForm;
