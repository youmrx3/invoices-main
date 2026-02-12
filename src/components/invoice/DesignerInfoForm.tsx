
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface DesignerInfoFormProps {
  designerName: string;
  designerEmail: string;
  designerPhone: string;
  designerAddress: string;
  designerWebsite: string;
  onUpdate: (field: string, value: string) => void;
}

const DesignerInfoForm: React.FC<DesignerInfoFormProps> = ({
  designerName,
  designerEmail,
  designerPhone,
  designerAddress,
  designerWebsite,
  onUpdate
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="designerName" className="text-sm font-medium text-gray-700">Full Name</Label>
          <Input
            id="designerName"
            value={designerName}
            onChange={(e) => onUpdate('designerName', e.target.value)}
            placeholder="Your full name"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="designerEmail" className="text-sm font-medium text-gray-700">Email</Label>
          <Input
            id="designerEmail"
            type="email"
            value={designerEmail}
            onChange={(e) => onUpdate('designerEmail', e.target.value)}
            placeholder="your@email.com"
            className="h-11"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="designerPhone" className="text-sm font-medium text-gray-700">Phone</Label>
          <Input
            id="designerPhone"
            value={designerPhone}
            onChange={(e) => onUpdate('designerPhone', e.target.value)}
            placeholder="+213 123 456 789"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="designerWebsite" className="text-sm font-medium text-gray-700">Website</Label>
          <Input
            id="designerWebsite"
            value={designerWebsite}
            onChange={(e) => onUpdate('designerWebsite', e.target.value)}
            placeholder="www.yourwebsite.com"
            className="h-11"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="designerAddress" className="text-sm font-medium text-gray-700">Address</Label>
        <Textarea
          id="designerAddress"
          value={designerAddress}
          onChange={(e) => onUpdate('designerAddress', e.target.value)}
          placeholder="Your business address"
          rows={3}
          className="resize-none"
        />
      </div>
    </div>
  );
};

export default DesignerInfoForm;
