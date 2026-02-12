import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Percent, DollarSign, Truck, CreditCard, PlusCircle } from 'lucide-react';
import { 
  createCalculationLine, 
  type CalculationLine, 
  type CalculationLineType 
} from '@/lib/calculationLines';
import { t, getLanguage } from '@/lib/i18n';

interface CalculationLinesEditorProps {
  lines: CalculationLine[];
  onChange: (lines: CalculationLine[]) => void;
  currency: string;
}

const lineTypeOptions: { type: CalculationLineType; labelFr: string; labelEn: string; icon: React.ReactNode }[] = [
  { type: 'discount_percent', labelFr: 'Remise (%)', labelEn: 'Discount (%)', icon: <Percent className="w-4 h-4" /> },
  { type: 'discount_fixed', labelFr: 'Remise (fixe)', labelEn: 'Discount (fixed)', icon: <DollarSign className="w-4 h-4" /> },
  { type: 'shipping', labelFr: 'Livraison', labelEn: 'Shipping', icon: <Truck className="w-4 h-4" /> },
  { type: 'deposit', labelFr: 'Acompte versé', labelEn: 'Deposit Paid', icon: <CreditCard className="w-4 h-4" /> },
  { type: 'additional_fee', labelFr: 'Frais supplémentaires', labelEn: 'Additional Fee', icon: <PlusCircle className="w-4 h-4" /> },
  { type: 'custom', labelFr: 'Personnalisé', labelEn: 'Custom', icon: <Plus className="w-4 h-4" /> },
];

const CalculationLinesEditor: React.FC<CalculationLinesEditorProps> = ({
  lines,
  onChange,
  currency,
}) => {
  const lang = getLanguage();
  
  const addLine = (type: CalculationLineType) => {
    const option = lineTypeOptions.find(o => o.type === type);
    const label = lang === 'fr' ? option?.labelFr || '' : option?.labelEn || '';
    
    const newLine = createCalculationLine(type, label, 0, lines.length);
    onChange([...lines, newLine]);
  };
  
  const updateLine = (id: string, updates: Partial<CalculationLine>) => {
    onChange(lines.map(line => 
      line.id === id ? { ...line, ...updates } : line
    ));
  };
  
  const removeLine = (id: string) => {
    onChange(lines.filter(line => line.id !== id));
  };
  
  const getTypeLabel = (type: CalculationLineType) => {
    const option = lineTypeOptions.find(o => o.type === type);
    return lang === 'fr' ? option?.labelFr : option?.labelEn;
  };
  
  return (
    <div className="space-y-3">
      {/* Existing lines */}
      {lines.map((line) => (
        <div 
          key={line.id} 
          className={`flex items-center gap-2 p-3 rounded-lg border ${
            line.isSubtraction 
              ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900' 
              : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
          }`}
        >
          <div className="flex-1 grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Input
                value={line.label}
                onChange={(e) => updateLine(line.id, { label: e.target.value })}
                placeholder="Label"
                className="h-8 text-sm bg-background"
              />
            </div>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={line.value}
                onChange={(e) => updateLine(line.id, { value: parseFloat(e.target.value) || 0 })}
                className="h-8 text-sm bg-background"
                min={0}
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {line.type === 'discount_percent' ? '%' : currency}
              </span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => removeLine(line.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
      
      {/* Add new line */}
      <Select onValueChange={(value) => addLine(value as CalculationLineType)}>
        <SelectTrigger className="h-9 border-dashed">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Plus className="w-4 h-4" />
            <span className="text-sm">{t('addCalculationLine')}</span>
          </div>
        </SelectTrigger>
        <SelectContent>
          {lineTypeOptions.map((option) => (
            <SelectItem key={option.type} value={option.type}>
              <div className="flex items-center gap-2">
                {option.icon}
                <span>{lang === 'fr' ? option.labelFr : option.labelEn}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CalculationLinesEditor;
