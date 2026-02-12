import { z } from 'zod';

export type CalculationLineType = 
  | 'discount_percent'
  | 'discount_fixed'
  | 'shipping'
  | 'deposit'
  | 'additional_fee'
  | 'custom';

export const CalculationLineSchema = z.object({
  id: z.string(),
  type: z.enum(['discount_percent', 'discount_fixed', 'shipping', 'deposit', 'additional_fee', 'custom']),
  label: z.string(),
  value: z.number(),
  order: z.number(),
  isSubtraction: z.boolean().default(false), // True for discounts and deposits
});

export type CalculationLine = z.infer<typeof CalculationLineSchema>;

export function createCalculationLine(
  type: CalculationLineType,
  label: string,
  value: number = 0,
  order: number = 0
): CalculationLine {
  const isSubtraction = ['discount_percent', 'discount_fixed', 'deposit'].includes(type);
  
  return {
    id: crypto.getRandomValues(new Uint8Array(8)).reduce((acc, b) => acc + b.toString(16).padStart(2, '0'), ''),
    type,
    label,
    value,
    order,
    isSubtraction,
  };
}

export function getDefaultCalculationLines(): CalculationLine[] {
  return [];
}

export function calculateWithCustomLines(
  subtotal: number,
  taxRate: number,
  taxLabel: string,
  calculationLines: CalculationLine[]
): {
  subtotal: number;
  lines: Array<{ label: string; value: number; isSubtraction: boolean }>;
  tax: number;
  total: number;
  balanceDue: number;
} {
  const sortedLines = [...calculationLines].sort((a, b) => a.order - b.order);
  
  let runningTotal = subtotal;
  let depositAmount = 0;
  const processedLines: Array<{ label: string; value: number; isSubtraction: boolean }> = [];
  
  // Process discount and additional fees before tax
  for (const line of sortedLines) {
    if (line.type === 'deposit') {
      depositAmount = line.value;
      continue; // Process deposit after total
    }
    
    let lineValue = line.value;
    
    if (line.type === 'discount_percent') {
      lineValue = (subtotal * line.value) / 100;
    }
    
    if (line.isSubtraction) {
      runningTotal -= lineValue;
    } else {
      runningTotal += lineValue;
    }
    
    processedLines.push({
      label: line.label,
      value: lineValue,
      isSubtraction: line.isSubtraction,
    });
  }
  
  // Calculate tax on the adjusted subtotal
  const tax = taxRate > 0 ? (runningTotal * taxRate) / 100 : 0;
  const total = runningTotal + tax;
  const balanceDue = total - depositAmount;
  
  // Add deposit line if exists
  if (depositAmount > 0) {
    processedLines.push({
      label: 'Acompte versé',
      value: depositAmount,
      isSubtraction: true,
    });
  }
  
  return {
    subtotal,
    lines: processedLines,
    tax,
    total,
    balanceDue: depositAmount > 0 ? balanceDue : total,
  };
}
