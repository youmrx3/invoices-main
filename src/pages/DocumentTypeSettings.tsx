import React, { useState } from 'react';
import { Settings, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import WorkspaceShell from '@/components/layout/WorkspaceShell';
import {
  getDocumentTypes,
  DocumentType,
} from '@/lib/documentTypes';
import {
  getDocumentTypeConfigs,
  updateDocumentTypeConfig,
  addGovernmentCharge,
  removeGovernmentCharge,
  updateGovernmentCharge,
  DocumentTypeConfig,
  FiscalField,
  fiscalFieldLabels,
  type GovernmentCharge,
} from '@/lib/documentTypeConfig';
import { getLanguage } from '@/lib/i18n';

type Language = 'fr' | 'en';

interface GovernmentChargeForm extends GovernmentCharge {
  isNew?: boolean;
}

const DocumentTypeSettingsPage = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [language] = useState<Language>(getLanguage() as Language);
  const [documentTypes] = useState<DocumentType[]>(getDocumentTypes());
  const [configs, setConfigs] = useState<DocumentTypeConfig[]>(getDocumentTypeConfigs());
  const [selectedTypeId, setSelectedTypeId] = useState<string>(() => {
    const requestedTypeId = searchParams.get('type') || '';
    if (requestedTypeId && documentTypes.some(type => type.id === requestedTypeId)) {
      return requestedTypeId;
    }
    return documentTypes[0]?.id || '';
  });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    businessFiscal: true,
    clientFiscal: true,
    governmentCharges: true,
  });
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false);
  const [newCharge, setNewCharge] = useState<GovernmentChargeForm>({
    id: '',
    name: '',
    amount: 0,
    percentage: false,
    isEnabled: true,
    isNew: true,
  });
  const [newBusinessFiscalLabel, setNewBusinessFiscalLabel] = useState('');
  const [newClientFiscalLabel, setNewClientFiscalLabel] = useState('');
  const [newEndingChoice, setNewEndingChoice] = useState('');

  const selectedConfig = configs.find(c => c.documentTypeId === selectedTypeId);
  const selectedType = documentTypes.find(t => t.id === selectedTypeId);

  const allFiscalFields: FiscalField[] = ['nif', 'nic', 'ait', 'rc', 'artisan', 'activity'];

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleBusinessFiscalChange = (field: FiscalField, checked: boolean) => {
    if (!selectedConfig) return;

    const newFields = checked
      ? [...selectedConfig.businessFiscalFields, field]
      : selectedConfig.businessFiscalFields.filter(f => f !== field);

    const updated = { ...selectedConfig, businessFiscalFields: newFields };
    updateDocumentTypeConfig(updated);
    setConfigs(getDocumentTypeConfigs());
    toast({ title: 'Updated', description: 'Business fiscal fields updated.' });
  };

  const handleClientFiscalChange = (field: FiscalField, checked: boolean) => {
    if (!selectedConfig) return;

    const newFields = checked
      ? [...selectedConfig.clientFiscalFields, field]
      : selectedConfig.clientFiscalFields.filter(f => f !== field);

    const updated = { ...selectedConfig, clientFiscalFields: newFields };
    updateDocumentTypeConfig(updated);
    setConfigs(getDocumentTypeConfigs());
    toast({ title: 'Updated', description: 'Client fiscal fields updated.' });
  };

  const handleShowBusinessFiscal = (checked: boolean) => {
    if (!selectedConfig) return;
    const updated = { ...selectedConfig, showBusinessFiscalInfo: checked };
    updateDocumentTypeConfig(updated);
    setConfigs(getDocumentTypeConfigs());
  };

  const handleShowClientFiscal = (checked: boolean) => {
    if (!selectedConfig) return;
    const updated = { ...selectedConfig, showClientFiscalInfo: checked };
    updateDocumentTypeConfig(updated);
    setConfigs(getDocumentTypeConfigs());
  };

  const handleRequireBusinessFiscal = (checked: boolean) => {
    if (!selectedConfig) return;
    const updated = { ...selectedConfig, requiresBusinessFiscalInfo: checked };
    updateDocumentTypeConfig(updated);
    setConfigs(getDocumentTypeConfigs());
  };

  const handleRequireClientFiscal = (checked: boolean) => {
    if (!selectedConfig) return;
    const updated = { ...selectedConfig, requiresClientFiscalInfo: checked };
    updateDocumentTypeConfig(updated);
    setConfigs(getDocumentTypeConfigs());
  };

  const addCustomBusinessFiscalField = () => {
    if (!selectedConfig || !newBusinessFiscalLabel.trim()) return;

    const updated = {
      ...selectedConfig,
      businessCustomFiscalFields: [
        ...(selectedConfig.businessCustomFiscalFields || []),
        {
          id: crypto.getRandomValues(new Uint8Array(8)).reduce((acc, b) => acc + b.toString(16).padStart(2, '0'), ''),
          label: newBusinessFiscalLabel.trim(),
          enabled: true,
        },
      ],
    };

    updateDocumentTypeConfig(updated);
    setConfigs(getDocumentTypeConfigs());
    setNewBusinessFiscalLabel('');
  };

  const addCustomClientFiscalField = () => {
    if (!selectedConfig || !newClientFiscalLabel.trim()) return;

    const updated = {
      ...selectedConfig,
      clientCustomFiscalFields: [
        ...(selectedConfig.clientCustomFiscalFields || []),
        {
          id: crypto.getRandomValues(new Uint8Array(8)).reduce((acc, b) => acc + b.toString(16).padStart(2, '0'), ''),
          label: newClientFiscalLabel.trim(),
          enabled: true,
        },
      ],
    };

    updateDocumentTypeConfig(updated);
    setConfigs(getDocumentTypeConfigs());
    setNewClientFiscalLabel('');
  };

  const toggleCustomBusinessFiscalField = (id: string, checked: boolean) => {
    if (!selectedConfig) return;

    const updated = {
      ...selectedConfig,
      businessCustomFiscalFields: (selectedConfig.businessCustomFiscalFields || []).map(field =>
        field.id === id ? { ...field, enabled: checked } : field
      ),
    };

    updateDocumentTypeConfig(updated);
    setConfigs(getDocumentTypeConfigs());
  };

  const toggleCustomClientFiscalField = (id: string, checked: boolean) => {
    if (!selectedConfig) return;

    const updated = {
      ...selectedConfig,
      clientCustomFiscalFields: (selectedConfig.clientCustomFiscalFields || []).map(field =>
        field.id === id ? { ...field, enabled: checked } : field
      ),
    };

    updateDocumentTypeConfig(updated);
    setConfigs(getDocumentTypeConfigs());
  };

  const removeCustomBusinessFiscalField = (id: string) => {
    if (!selectedConfig) return;

    const updated = {
      ...selectedConfig,
      businessCustomFiscalFields: (selectedConfig.businessCustomFiscalFields || []).filter(field => field.id !== id),
    };

    updateDocumentTypeConfig(updated);
    setConfigs(getDocumentTypeConfigs());
  };

  const removeCustomClientFiscalField = (id: string) => {
    if (!selectedConfig) return;

    const updated = {
      ...selectedConfig,
      clientCustomFiscalFields: (selectedConfig.clientCustomFiscalFields || []).filter(field => field.id !== id),
    };

    updateDocumentTypeConfig(updated);
    setConfigs(getDocumentTypeConfigs());
  };

  const handleAddGovernmentCharge = () => {
    if (!selectedTypeId || !newCharge.name || newCharge.amount === undefined) {
      toast({ title: 'Error', description: 'Please fill in all fields.', variant: 'destructive' });
      return;
    }

    if (addGovernmentCharge(selectedTypeId, {
      name: newCharge.name,
      amount: newCharge.amount,
      percentage: newCharge.percentage,
      isEnabled: newCharge.isEnabled,
    })) {
      setConfigs(getDocumentTypeConfigs());
      setNewCharge({
        id: '',
        name: '',
        amount: 0,
        percentage: false,
        isEnabled: true,
        isNew: true,
      });
      setChargeDialogOpen(false);
      toast({ title: 'Success', description: 'Government charge added.' });
    }
  };

  const handleRemoveCharge = (chargeId: string) => {
    if (removeGovernmentCharge(selectedTypeId, chargeId)) {
      setConfigs(getDocumentTypeConfigs());
      toast({ title: 'Success', description: 'Charge removed.' });
    }
  };

  const handleToggleCharge = (chargeId: string) => {
    const charge = selectedConfig?.governmentCharges.find(c => c.id === chargeId);
    if (charge) {
      updateGovernmentCharge(selectedTypeId, chargeId, { isEnabled: !charge.isEnabled });
      setConfigs(getDocumentTypeConfigs());
    }
  };

  const updateEndingConfig = (updates: Partial<DocumentTypeConfig>) => {
    if (!selectedConfig) return;
    const updated = { ...selectedConfig, ...updates };
    updateDocumentTypeConfig(updated);
    setConfigs(getDocumentTypeConfigs());
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedConfig) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      updateEndingConfig({ signatureImageUrl: (event.target?.result as string) || '' });
    };
    reader.readAsDataURL(file);
  };

  const addEndingChoice = () => {
    if (!selectedConfig || !newEndingChoice.trim()) return;

    updateEndingConfig({
      endingChoices: [
        ...(selectedConfig.endingChoices || []),
        {
          id: crypto.getRandomValues(new Uint8Array(8)).reduce((acc, b) => acc + b.toString(16).padStart(2, '0'), ''),
          label: newEndingChoice.trim(),
        },
      ],
    });
    setNewEndingChoice('');
  };

  const removeEndingChoice = (id: string) => {
    if (!selectedConfig) return;
    updateEndingConfig({ endingChoices: (selectedConfig.endingChoices || []).filter(choice => choice.id !== id) });
  };

  if (!selectedConfig || !selectedType) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <WorkspaceShell
      title="Document Type Settings"
      subtitle="Configure fiscal behavior, charges, and ending blocks for each paper type"
      actions={
        <Link to="/">
          <Button variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
      }
    >
      <Separator className="mb-8" />

      {/* Document Type Selector */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select Document Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {documentTypes.map(type => (
              <Button
                key={type.id}
                onClick={() => setSelectedTypeId(type.id)}
                variant={selectedTypeId === type.id ? 'default' : 'outline'}
                className={`justify-start ${selectedTypeId === type.id ? '' : 'border-2'}`}
              >
                <div
                  className="w-3 h-3 rounded mr-2"
                  style={{ backgroundColor: type.color }}
                />
                <div className="flex flex-col items-start">
                  <span className="font-medium">{language === 'fr' ? type.nameFr : type.nameEn}</span>
                  <span className="text-xs text-gray-500">{type.prefix}</span>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="fiscal">Fiscal Information</TabsTrigger>
          <TabsTrigger value="charges">Government Charges</TabsTrigger>
          <TabsTrigger value="ending">Fin du document</TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Display Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base font-medium">Show Tax Calculation</Label>
                  <p className="text-sm text-gray-500 mt-1">Display tax line item on documents</p>
                </div>
                <Switch
                  checked={selectedConfig.showTaxCalculation}
                  onCheckedChange={(checked) => {
                    const updated = { ...selectedConfig, showTaxCalculation: checked };
                    updateDocumentTypeConfig(updated);
                    setConfigs(getDocumentTypeConfigs());
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base font-medium">Show Due Date</Label>
                  <p className="text-sm text-gray-500 mt-1">Display due date field on documents</p>
                </div>
                <Switch
                  checked={selectedConfig.showDueDate}
                  onCheckedChange={(checked) => {
                    const updated = { ...selectedConfig, showDueDate: checked };
                    updateDocumentTypeConfig(updated);
                    setConfigs(getDocumentTypeConfigs());
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base font-medium">Show Notes</Label>
                  <p className="text-sm text-gray-500 mt-1">Allow notes section on documents</p>
                </div>
                <Switch
                  checked={selectedConfig.showNotes}
                  onCheckedChange={(checked) => {
                    const updated = { ...selectedConfig, showNotes: checked };
                    updateDocumentTypeConfig(updated);
                    setConfigs(getDocumentTypeConfigs());
                  }}
                />
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        {/* Ending Settings Tab */}
        <TabsContent value="ending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fin du document settings</CardTitle>
              <p className="text-sm text-gray-500">Configure signature on the right, and custom text/price/choice area on the left for this paper type only.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base font-medium">Enable Ending Block</Label>
                  <p className="text-sm text-gray-500 mt-1">Show this section at the end of exported document</p>
                </div>
                <Switch
                  checked={selectedConfig.showEndingBlock}
                  onCheckedChange={(checked) => updateEndingConfig({ showEndingBlock: checked })}
                />
              </div>

              {selectedConfig.showEndingBlock && (
                <>
                  <div className="space-y-2">
                    <Label>Line 1 Text (left, before price)</Label>
                    <Input
                      value={selectedConfig.endingLine1Text || ''}
                      onChange={(e) => updateEndingConfig({ endingLine1Text: e.target.value })}
                      placeholder="e.g., Amount to be paid in figures"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Line 2 Text (left, before dropdown choice)</Label>
                    <Input
                      value={selectedConfig.endingLine2Text || ''}
                      onChange={(e) => updateEndingConfig({ endingLine2Text: e.target.value })}
                      placeholder="e.g., Payment method"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Company Signature PNG (right side)</Label>
                    <Input type="file" accept="image/png,image/*" onChange={handleSignatureUpload} />
                    {selectedConfig.signatureImageUrl && (
                      <div className="flex items-center gap-3 pt-2">
                        <img
                          src={selectedConfig.signatureImageUrl}
                          alt="Signature"
                          className="h-16 w-auto object-contain border rounded bg-white"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateEndingConfig({ signatureImageUrl: '' })}
                        >
                          Remove Signature
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t space-y-3">
                    <Label className="text-sm font-medium">Dropdown Choices</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newEndingChoice}
                        onChange={(e) => setNewEndingChoice(e.target.value)}
                        placeholder="e.g., Bank transfer"
                      />
                      <Button onClick={addEndingChoice} size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add
                      </Button>
                    </div>

                    {(selectedConfig.endingChoices || []).map(choice => (
                      <div key={choice.id} className="flex items-center justify-between p-3 border rounded">
                        <span className="text-sm">{choice.label}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeEndingChoice(choice.id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fiscal Information Tab */}
        <TabsContent value="fiscal" className="space-y-6">
          {/* Business Fiscal Information */}
          <Card>
            <div
              className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection('businessFiscal')}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Business Fiscal Information</h3>
                  <p className="text-sm text-gray-500">Add business identification details to {language === 'fr' ? selectedType.nameFr : selectedType.nameEn}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={selectedConfig.showBusinessFiscalInfo}
                  onCheckedChange={handleShowBusinessFiscal}
                  onClick={(e) => e.stopPropagation()}
                />
                {expandedSections.businessFiscal ? <ChevronUp /> : <ChevronDown />}
              </div>
            </div>

            {expandedSections.businessFiscal && (
              <>
                <Separator />
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded bg-muted/20">
                    <div>
                      <p className="font-medium text-sm">Require Business Fiscal Info</p>
                      <p className="text-xs text-gray-500">Block save/export when selected business fiscal fields are missing</p>
                    </div>
                    <Switch
                      checked={selectedConfig.requiresBusinessFiscalInfo}
                      onCheckedChange={handleRequireBusinessFiscal}
                    />
                  </div>

                  {allFiscalFields.map(field => (
                    <div key={field} className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50">
                      <Checkbox
                        id={`business-${field}`}
                        checked={selectedConfig.businessFiscalFields.includes(field)}
                        onCheckedChange={(checked) => handleBusinessFiscalChange(field, checked as boolean)}
                      />
                      <Label htmlFor={`business-${field}`} className="cursor-pointer flex-1">
                        <span className="font-medium">
                          {language === 'fr' ? fiscalFieldLabels[field].fr : fiscalFieldLabels[field].en}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">({field.toUpperCase()})</span>
                      </Label>
                    </div>
                  ))}

                  <div className="pt-3 border-t space-y-3">
                    <Label className="text-sm font-medium">Custom Business Fiscal Fields</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newBusinessFiscalLabel}
                        onChange={(e) => setNewBusinessFiscalLabel(e.target.value)}
                        placeholder="e.g. Article Fiscal"
                      />
                      <Button onClick={addCustomBusinessFiscalField} size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add
                      </Button>
                    </div>

                    {(selectedConfig.businessCustomFiscalFields || []).map(field => (
                      <div key={field.id} className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50">
                        <Switch
                          checked={field.enabled}
                          onCheckedChange={(checked) => toggleCustomBusinessFiscalField(field.id, checked)}
                        />
                        <span className="flex-1 text-sm font-medium">{field.label}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomBusinessFiscalField(field.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </>
            )}
          </Card>

          {/* Client Fiscal Information */}
          <Card>
            <div
              className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection('clientFiscal')}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Client Fiscal Information</h3>
                  <p className="text-sm text-gray-500">Request client identification details</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={selectedConfig.showClientFiscalInfo}
                  onCheckedChange={handleShowClientFiscal}
                  onClick={(e) => e.stopPropagation()}
                />
                {expandedSections.clientFiscal ? <ChevronUp /> : <ChevronDown />}
              </div>
            </div>

            {expandedSections.clientFiscal && (
              <>
                <Separator />
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded bg-muted/20">
                    <div>
                      <p className="font-medium text-sm">Require Client Fiscal Info</p>
                      <p className="text-xs text-gray-500">Block save/export when selected client fiscal fields are missing</p>
                    </div>
                    <Switch
                      checked={selectedConfig.requiresClientFiscalInfo}
                      onCheckedChange={handleRequireClientFiscal}
                    />
                  </div>

                  {allFiscalFields.map(field => (
                    <div key={field} className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50">
                      <Checkbox
                        id={`client-${field}`}
                        checked={selectedConfig.clientFiscalFields.includes(field)}
                        onCheckedChange={(checked) => handleClientFiscalChange(field, checked as boolean)}
                      />
                      <Label htmlFor={`client-${field}`} className="cursor-pointer flex-1">
                        <span className="font-medium">
                          {language === 'fr' ? fiscalFieldLabels[field].fr : fiscalFieldLabels[field].en}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">({field.toUpperCase()})</span>
                      </Label>
                    </div>
                  ))}

                  <div className="pt-3 border-t space-y-3">
                    <Label className="text-sm font-medium">Custom Client Fiscal Fields</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newClientFiscalLabel}
                        onChange={(e) => setNewClientFiscalLabel(e.target.value)}
                        placeholder="e.g. ID Fiscale Locale"
                      />
                      <Button onClick={addCustomClientFiscalField} size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add
                      </Button>
                    </div>

                    {(selectedConfig.clientCustomFiscalFields || []).map(field => (
                      <div key={field.id} className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50">
                        <Switch
                          checked={field.enabled}
                          onCheckedChange={(checked) => toggleCustomClientFiscalField(field.id, checked)}
                        />
                        <span className="flex-1 text-sm font-medium">{field.label}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomClientFiscalField(field.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </TabsContent>

        {/* Government Charges Tab */}
        <TabsContent value="charges" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Government Charges</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Add government taxes, fees, or other charges specific to this document type</p>
              </div>
              <Dialog open={chargeDialogOpen} onOpenChange={setChargeDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Charge
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Government Charge</DialogTitle>
                    <DialogDescription>
                      Add a new tax, fee, or charge for {language === 'fr' ? selectedType.nameFr : selectedType.nameEn}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="charge-name">Charge Name</Label>
                      <Input
                        id="charge-name"
                        placeholder="e.g., Stamp Tax, Government Fee"
                        value={newCharge.name}
                        onChange={(e) => setNewCharge({ ...newCharge, name: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="charge-amount">Amount</Label>
                        <Input
                          id="charge-amount"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={newCharge.amount}
                          onChange={(e) => setNewCharge({ ...newCharge, amount: parseFloat(e.target.value) })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Type</Label>
                        <div className="flex items-center gap-2 border rounded-md p-2 h-10">
                          <Checkbox
                            id="is-percentage"
                            checked={newCharge.percentage}
                            onCheckedChange={(checked) => setNewCharge({ ...newCharge, percentage: checked as boolean })}
                          />
                          <Label htmlFor="is-percentage" className="cursor-pointer text-sm flex-1">
                            {newCharge.percentage ? '%' : 'Fixed'}
                          </Label>
                        </div>
                      </div>
                    </div>

                    <Button onClick={handleAddGovernmentCharge} className="w-full">
                      Add Charge
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent>
              {selectedConfig.governmentCharges.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No government charges configured</p>
                  <Button
                    variant="outline"
                    onClick={() => setChargeDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Charge
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedConfig.governmentCharges.map(charge => (
                    <div key={charge.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4 flex-1">
                        <Switch
                          checked={charge.isEnabled}
                          onCheckedChange={() => handleToggleCharge(charge.id)}
                        />
                        <div>
                          <p className="font-medium">{charge.name}</p>
                          <p className="text-sm text-gray-500">
                            {charge.percentage ? `${charge.amount}%` : `${charge.amount}`}
                            {charge.percentage ? ' of subtotal' : ' fixed amount'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCharge(charge.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </WorkspaceShell>
  );
};

export default DocumentTypeSettingsPage;
