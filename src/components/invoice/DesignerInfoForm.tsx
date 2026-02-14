
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getDocumentTypeConfig, fiscalFieldLabels } from '@/lib/documentTypeConfig';
import { getLanguage } from '@/lib/i18n';

type Language = 'fr' | 'en';

interface DesignerInfoFormProps {
  designerName: string;
  designerEmail: string;
  designerPhone: string;
  designerAddress: string;
  designerWebsite: string;
  designerNif?: string;
  designerNic?: string;
  designerAit?: string;
  designerRc?: string;
  designerArtisan?: string;
  designerActivity?: string;
  documentTypeId?: string;
  onUpdate: (field: string, value: string) => void;
}

const DesignerInfoForm: React.FC<DesignerInfoFormProps> = ({
  designerName,
  designerEmail,
  designerPhone,
  designerAddress,
  designerWebsite,
  designerNif = '',
  designerNic = '',
  designerAit = '',
  designerRc = '',
  designerArtisan = '',
  designerActivity = '',
  documentTypeId = 'invoice',
  onUpdate
}) => {
  const language = getLanguage() as Language;
  const config = documentTypeId ? getDocumentTypeConfig(documentTypeId) : null;
  const showFiscalInfo = config?.showBusinessFiscalInfo;
  const [expandFiscal, setExpandFiscal] = React.useState(false);

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

      {showFiscalInfo && config?.businessFiscalFields && config.businessFiscalFields.length > 0 && (
        <Collapsible open={expandFiscal} onOpenChange={setExpandFiscal}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 w-full justify-between p-2 rounded hover:bg-blue-50">
            <span>Fiscal Information</span>
            {expandFiscal ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4 border-t mt-4 pt-6">
            {config.businessFiscalFields.includes('nif') && (
              <div className="space-y-2">
                <Label htmlFor="designerNif" className="text-sm font-medium text-gray-700">
                  {language === 'fr' ? fiscalFieldLabels.nif.fr : fiscalFieldLabels.nif.en}
                </Label>
                <Input
                  id="designerNif"
                  value={designerNif}
                  onChange={(e) => onUpdate('designerNif', e.target.value)}
                  placeholder="Tax ID"
                  className="h-11"
                />
              </div>
            )}
            {config.businessFiscalFields.includes('nic') && (
              <div className="space-y-2">
                <Label htmlFor="designerNic" className="text-sm font-medium text-gray-700">
                  {language === 'fr' ? fiscalFieldLabels.nic.fr : fiscalFieldLabels.nic.en}
                </Label>
                <Input
                  id="designerNic"
                  value={designerNic}
                  onChange={(e) => onUpdate('designerNic', e.target.value)}
                  placeholder="National ID"
                  className="h-11"
                />
              </div>
            )}
            {config.businessFiscalFields.includes('ait') && (
              <div className="space-y-2">
                <Label htmlFor="designerAit" className="text-sm font-medium text-gray-700">
                  {language === 'fr' ? fiscalFieldLabels.ait.fr : fiscalFieldLabels.ait.en}
                </Label>
                <Input
                  id="designerAit"
                  value={designerAit}
                  onChange={(e) => onUpdate('designerAit', e.target.value)}
                  placeholder="Professional Tax"
                  className="h-11"
                />
              </div>
            )}
            {config.businessFiscalFields.includes('rc') && (
              <div className="space-y-2">
                <Label htmlFor="designerRc" className="text-sm font-medium text-gray-700">
                  {language === 'fr' ? fiscalFieldLabels.rc.fr : fiscalFieldLabels.rc.en}
                </Label>
                <Input
                  id="designerRc"
                  value={designerRc}
                  onChange={(e) => onUpdate('designerRc', e.target.value)}
                  placeholder="Commercial Register"
                  className="h-11"
                />
              </div>
            )}
            {config.businessFiscalFields.includes('artisan') && (
              <div className="space-y-2">
                <Label htmlFor="designerArtisan" className="text-sm font-medium text-gray-700">
                  {language === 'fr' ? fiscalFieldLabels.artisan.fr : fiscalFieldLabels.artisan.en}
                </Label>
                <Input
                  id="designerArtisan"
                  value={designerArtisan}
                  onChange={(e) => onUpdate('designerArtisan', e.target.value)}
                  placeholder="Artisan Number"
                  className="h-11"
                />
              </div>
            )}
            {config.businessFiscalFields.includes('activity') && (
              <div className="space-y-2">
                <Label htmlFor="designerActivity" className="text-sm font-medium text-gray-700">
                  {language === 'fr' ? fiscalFieldLabels.activity.fr : fiscalFieldLabels.activity.en}
                </Label>
                <Input
                  id="designerActivity"
                  value={designerActivity}
                  onChange={(e) => onUpdate('designerActivity', e.target.value)}
                  placeholder="Activity"
                  className="h-11"
                />
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export default DesignerInfoForm;
