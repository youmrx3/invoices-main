
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getDocumentTypeConfig, fiscalFieldLabels } from '@/lib/documentTypeConfig';
import { getLanguage } from '@/lib/i18n';

type Language = 'fr' | 'en';

interface ClientInfoFormProps {
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientAddress: string;
  clientNif?: string;
  clientNic?: string;
  clientAit?: string;
  clientRc?: string;
  clientArtisan?: string;
  clientActivity?: string;
  documentTypeId?: string;
  onUpdate: (field: string, value: string) => void;
}

const ClientInfoForm: React.FC<ClientInfoFormProps> = ({
  clientName,
  clientCompany,
  clientEmail,
  clientAddress,
  clientNif = '',
  clientNic = '',
  clientAit = '',
  clientRc = '',
  clientArtisan = '',
  clientActivity = '',
  documentTypeId = 'invoice',
  onUpdate
}) => {
  const language = getLanguage() as Language;
  const config = documentTypeId ? getDocumentTypeConfig(documentTypeId) : null;
  const showFiscalInfo = config?.showClientFiscalInfo;
  const [expandFiscal, setExpandFiscal] = React.useState(false);

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

      {showFiscalInfo && config?.clientFiscalFields && config.clientFiscalFields.length > 0 && (
        <Collapsible open={expandFiscal} onOpenChange={setExpandFiscal}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 w-full justify-between p-2 rounded hover:bg-blue-50">
            <span>Fiscal Information</span>
            {expandFiscal ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4 border-t mt-4 pt-6">
            {config.clientFiscalFields.includes('nif') && (
              <div className="space-y-2">
                <Label htmlFor="clientNif" className="text-sm font-medium text-gray-700">
                  {language === 'fr' ? fiscalFieldLabels.nif.fr : fiscalFieldLabels.nif.en}
                </Label>
                <Input
                  id="clientNif"
                  value={clientNif}
                  onChange={(e) => onUpdate('clientNif', e.target.value)}
                  placeholder="Tax ID"
                  className="h-11"
                />
              </div>
            )}
            {config.clientFiscalFields.includes('nic') && (
              <div className="space-y-2">
                <Label htmlFor="clientNic" className="text-sm font-medium text-gray-700">
                  {language === 'fr' ? fiscalFieldLabels.nic.fr : fiscalFieldLabels.nic.en}
                </Label>
                <Input
                  id="clientNic"
                  value={clientNic}
                  onChange={(e) => onUpdate('clientNic', e.target.value)}
                  placeholder="National ID"
                  className="h-11"
                />
              </div>
            )}
            {config.clientFiscalFields.includes('ait') && (
              <div className="space-y-2">
                <Label htmlFor="clientAit" className="text-sm font-medium text-gray-700">
                  {language === 'fr' ? fiscalFieldLabels.ait.fr : fiscalFieldLabels.ait.en}
                </Label>
                <Input
                  id="clientAit"
                  value={clientAit}
                  onChange={(e) => onUpdate('clientAit', e.target.value)}
                  placeholder="Professional Tax"
                  className="h-11"
                />
              </div>
            )}
            {config.clientFiscalFields.includes('rc') && (
              <div className="space-y-2">
                <Label htmlFor="clientRc" className="text-sm font-medium text-gray-700">
                  {language === 'fr' ? fiscalFieldLabels.rc.fr : fiscalFieldLabels.rc.en}
                </Label>
                <Input
                  id="clientRc"
                  value={clientRc}
                  onChange={(e) => onUpdate('clientRc', e.target.value)}
                  placeholder="Commercial Register"
                  className="h-11"
                />
              </div>
            )}
            {config.clientFiscalFields.includes('artisan') && (
              <div className="space-y-2">
                <Label htmlFor="clientArtisan" className="text-sm font-medium text-gray-700">
                  {language === 'fr' ? fiscalFieldLabels.artisan.fr : fiscalFieldLabels.artisan.en}
                </Label>
                <Input
                  id="clientArtisan"
                  value={clientArtisan}
                  onChange={(e) => onUpdate('clientArtisan', e.target.value)}
                  placeholder="Artisan Number"
                  className="h-11"
                />
              </div>
            )}
            {config.clientFiscalFields.includes('activity') && (
              <div className="space-y-2">
                <Label htmlFor="clientActivity" className="text-sm font-medium text-gray-700">
                  {language === 'fr' ? fiscalFieldLabels.activity.fr : fiscalFieldLabels.activity.en}
                </Label>
                <Input
                  id="clientActivity"
                  value={clientActivity}
                  onChange={(e) => onUpdate('clientActivity', e.target.value)}
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

export default ClientInfoForm;
