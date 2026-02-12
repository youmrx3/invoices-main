
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface NotesFormProps {
  notes: string;
  onUpdate: (notes: string) => void;
}

const NotesForm: React.FC<NotesFormProps> = ({ notes, onUpdate }) => {
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notes</Label>
        <p className="text-xs text-gray-500 mt-1">Payment terms, additional information, etc.</p>
      </div>
      <Textarea
        id="notes"
        value={notes}
        onChange={(e) => onUpdate(e.target.value)}
        placeholder="Payment terms: Net 30 days&#10;Thank you for your business!"
        rows={4}
        className="resize-none"
      />
    </div>
  );
};

export default NotesForm;
