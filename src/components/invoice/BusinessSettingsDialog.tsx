import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Building2, CreditCard, FileText, Plus, Trash2, ImageIcon, Save } from 'lucide-react';
import {
  getBusinessSettings,
  saveBusinessSettings,
  generateFieldId,
  type BusinessSettings,
  type CustomField,
  type PaymentMethod,
  type FiscalCustomInfo,
} from '@/lib/businessSettings';
import { useToast } from '@/hooks/use-toast';

interface BusinessSettingsDialogProps {
  onSettingsChange?: (settings: BusinessSettings) => void;
}

const BusinessSettingsDialog: React.FC<BusinessSettingsDialogProps> = ({ onSettingsChange }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<BusinessSettings>(getBusinessSettings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (open) {
      setSettings(getBusinessSettings());
      setHasChanges(false);
    }
  }, [open]);

  const updateSetting = <K extends keyof BusinessSettings>(key: K, value: BusinessSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const addCustomField = () => {
    const newField: CustomField = {
      id: generateFieldId(),
      label: '',
      value: '',
      showOnInvoice: true,
      type: 'text',
    };
    updateSetting('customFields', [...settings.customFields, newField]);
  };

  const updateCustomField = (id: string, updates: Partial<CustomField>) => {
    updateSetting('customFields', settings.customFields.map(f => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeCustomField = (id: string) => {
    updateSetting('customFields', settings.customFields.filter(f => f.id !== id));
  };

  const addPaymentMethod = () => {
    const newMethod: PaymentMethod = {
      id: generateFieldId(),
      name: '',
      details: '',
      enabled: true,
    };
    updateSetting('paymentMethods', [...settings.paymentMethods, newMethod]);
  };

  const updatePaymentMethod = (id: string, updates: Partial<PaymentMethod>) => {
    updateSetting('paymentMethods', settings.paymentMethods.map(m => (m.id === id ? { ...m, ...updates } : m)));
  };

  const removePaymentMethod = (id: string) => {
    updateSetting('paymentMethods', settings.paymentMethods.filter(m => m.id !== id));
  };

  const addBusinessCustomFiscalInfo = () => {
    const newField: FiscalCustomInfo = { id: generateFieldId(), label: '', value: '' };
    updateSetting('businessCustomFiscalInfo', [...(settings.businessCustomFiscalInfo || []), newField]);
  };

  const updateBusinessCustomFiscalInfo = (id: string, updates: Partial<FiscalCustomInfo>) => {
    updateSetting(
      'businessCustomFiscalInfo',
      (settings.businessCustomFiscalInfo || []).map(field => (field.id === id ? { ...field, ...updates } : field))
    );
  };

  const removeBusinessCustomFiscalInfo = (id: string) => {
    updateSetting('businessCustomFiscalInfo', (settings.businessCustomFiscalInfo || []).filter(field => field.id !== id));
  };

  const addClientCustomFiscalInfo = () => {
    const newField: FiscalCustomInfo = { id: generateFieldId(), label: '', value: '' };
    updateSetting('clientCustomFiscalInfo', [...(settings.clientCustomFiscalInfo || []), newField]);
  };

  const updateClientCustomFiscalInfo = (id: string, updates: Partial<FiscalCustomInfo>) => {
    updateSetting(
      'clientCustomFiscalInfo',
      (settings.clientCustomFiscalInfo || []).map(field => (field.id === id ? { ...field, ...updates } : field))
    );
  };

  const removeClientCustomFiscalInfo = (id: string) => {
    updateSetting('clientCustomFiscalInfo', (settings.clientCustomFiscalInfo || []).filter(field => field.id !== id));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      updateSetting('logoUrl', event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const success = saveBusinessSettings(settings);
    if (success) {
      toast({ title: 'Settings Saved', description: 'Your business settings have been updated.' });
      onSettingsChange?.(settings);
      setHasChanges(false);
      setOpen(false);
      return;
    }

    toast({
      title: 'Error',
      description: 'Failed to save settings. Please try again.',
      variant: 'destructive',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="w-5 h-5" />
            Business Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="business" className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="business" className="gap-2"><Building2 className="w-4 h-4" /><span className="hidden sm:inline">Business</span></TabsTrigger>
            <TabsTrigger value="fiscal" className="gap-2"><FileText className="w-4 h-4" /><span className="hidden sm:inline">Fiscal</span></TabsTrigger>
            <TabsTrigger value="fields" className="gap-2"><FileText className="w-4 h-4" /><span className="hidden sm:inline">Fields</span></TabsTrigger>
            <TabsTrigger value="payment" className="gap-2"><CreditCard className="w-4 h-4" /><span className="hidden sm:inline">Payment</span></TabsTrigger>
            <TabsTrigger value="invoice" className="gap-2"><FileText className="w-4 h-4" /><span className="hidden sm:inline">Invoice</span></TabsTrigger>
          </TabsList>

          <TabsContent value="business" className="space-y-6 mt-6">
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Logo</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="logoEnabled" className="text-sm text-muted-foreground">Show on invoice</Label>
                  <Switch id="logoEnabled" checked={settings.logoEnabled} onCheckedChange={(checked) => updateSetting('logoEnabled', checked)} />
                </div>
              </div>

              <div className="flex items-center gap-4">
                {settings.logoUrl ? (
                  <div className="relative w-24 h-24 border rounded-lg overflow-hidden bg-white">
                    <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    <Button variant="destructive" size="icon" className="absolute top-1 right-1 w-6 h-6" onClick={() => updateSetting('logoUrl', '')}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}

                <div>
                  <Input type="file" accept="image/*" onChange={handleLogoUpload} className="w-auto" />
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input id="businessName" value={settings.businessName} onChange={(e) => updateSetting('businessName', e.target.value)} placeholder="Your Business Name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline / Subtitle</Label>
                <Input id="tagline" value={settings.tagline} onChange={(e) => updateSetting('tagline', e.target.value)} placeholder="Professional Services" />
              </div>
            </div>

            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-semibold">Contact Information</h4>
              <div className="grid gap-4">
                <div className="flex items-center justify-between gap-4"><div className="flex-1 space-y-2"><Label>Owner Name</Label><Input value={settings.ownerName} onChange={(e) => updateSetting('ownerName', e.target.value)} placeholder="Your name" /></div><div className="flex items-center gap-2 pt-6"><Switch checked={settings.showOwnerName} onCheckedChange={(checked) => updateSetting('showOwnerName', checked)} /><span className="text-xs text-muted-foreground">Show</span></div></div>
                <div className="flex items-center justify-between gap-4"><div className="flex-1 space-y-2"><Label>Email</Label><Input type="email" value={settings.email} onChange={(e) => updateSetting('email', e.target.value)} placeholder="contact@email.com" /></div><div className="flex items-center gap-2 pt-6"><Switch checked={settings.showEmail} onCheckedChange={(checked) => updateSetting('showEmail', checked)} /><span className="text-xs text-muted-foreground">Show</span></div></div>
                <div className="flex items-center justify-between gap-4"><div className="flex-1 space-y-2"><Label>Phone</Label><Input value={settings.phone} onChange={(e) => updateSetting('phone', e.target.value)} placeholder="+213 XXX XXX XXX" /></div><div className="flex items-center gap-2 pt-6"><Switch checked={settings.showPhone} onCheckedChange={(checked) => updateSetting('showPhone', checked)} /><span className="text-xs text-muted-foreground">Show</span></div></div>
                <div className="flex items-center justify-between gap-4"><div className="flex-1 space-y-2"><Label>Website</Label><Input value={settings.website} onChange={(e) => updateSetting('website', e.target.value)} placeholder="www.yoursite.com" /></div><div className="flex items-center gap-2 pt-6"><Switch checked={settings.showWebsite} onCheckedChange={(checked) => updateSetting('showWebsite', checked)} /><span className="text-xs text-muted-foreground">Show</span></div></div>
                <div className="flex items-start justify-between gap-4"><div className="flex-1 space-y-2"><Label>Address</Label><Textarea value={settings.address} onChange={(e) => updateSetting('address', e.target.value)} placeholder="Your business address" rows={2} /></div><div className="flex items-center gap-2 pt-6"><Switch checked={settings.showAddress} onCheckedChange={(checked) => updateSetting('showAddress', checked)} /><span className="text-xs text-muted-foreground">Show</span></div></div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="fiscal" className="space-y-6 mt-6">
            <div>
              <h4 className="font-semibold mb-2">Fiscal Information</h4>
              <p className="text-sm text-muted-foreground mb-4">Add global fiscal information for your business and your client. These defaults are available across the app.</p>
            </div>

            <div className="space-y-4 p-4 border rounded-lg">
              <h5 className="font-medium">Business Fiscal Information</h5>
              <div className="grid gap-4">
                <div className="space-y-2"><Label>NIF (Tax Identification Number)</Label><Input value={settings.fiscalInfo?.nif || ''} onChange={(e) => updateSetting('fiscalInfo', { ...settings.fiscalInfo, nif: e.target.value })} /></div>
                <div className="space-y-2"><Label>NIC (National ID Number)</Label><Input value={settings.fiscalInfo?.nic || ''} onChange={(e) => updateSetting('fiscalInfo', { ...settings.fiscalInfo, nic: e.target.value })} /></div>
                <div className="space-y-2"><Label>AIT (Professional Activity Tax)</Label><Input value={settings.fiscalInfo?.ait || ''} onChange={(e) => updateSetting('fiscalInfo', { ...settings.fiscalInfo, ait: e.target.value })} /></div>
                <div className="space-y-2"><Label>RC (Commercial Register Number)</Label><Input value={settings.fiscalInfo?.rc || ''} onChange={(e) => updateSetting('fiscalInfo', { ...settings.fiscalInfo, rc: e.target.value })} /></div>
                <div className="space-y-2"><Label>Artisan Number</Label><Input value={settings.fiscalInfo?.artisan || ''} onChange={(e) => updateSetting('fiscalInfo', { ...settings.fiscalInfo, artisan: e.target.value })} /></div>
                <div className="space-y-2"><Label>Activity / Industry</Label><Input value={settings.fiscalInfo?.activity || ''} onChange={(e) => updateSetting('fiscalInfo', { ...settings.fiscalInfo, activity: e.target.value })} /></div>
              </div>

              <div className="pt-3 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Custom Business Fiscal Fields</Label>
                  <Button type="button" size="sm" variant="outline" className="gap-2" onClick={addBusinessCustomFiscalInfo}><Plus className="w-4 h-4" />Add</Button>
                </div>
                {(settings.businessCustomFiscalInfo || []).map((field) => (
                  <div key={field.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                    <Input value={field.label} onChange={(e) => updateBusinessCustomFiscalInfo(field.id, { label: e.target.value })} placeholder="Label" />
                    <Input value={field.value} onChange={(e) => updateBusinessCustomFiscalInfo(field.id, { value: e.target.value })} placeholder="Value" />
                    <Button variant="ghost" size="icon" onClick={() => removeBusinessCustomFiscalInfo(field.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 p-4 border rounded-lg">
              <h5 className="font-medium">Client Fiscal Information (Global Defaults)</h5>
              <div className="grid gap-4">
                <div className="space-y-2"><Label>NIF (Tax Identification Number)</Label><Input value={settings.clientFiscalInfo?.nif || ''} onChange={(e) => updateSetting('clientFiscalInfo', { ...settings.clientFiscalInfo, nif: e.target.value })} /></div>
                <div className="space-y-2"><Label>NIC (National ID Number)</Label><Input value={settings.clientFiscalInfo?.nic || ''} onChange={(e) => updateSetting('clientFiscalInfo', { ...settings.clientFiscalInfo, nic: e.target.value })} /></div>
                <div className="space-y-2"><Label>AIT (Professional Activity Tax)</Label><Input value={settings.clientFiscalInfo?.ait || ''} onChange={(e) => updateSetting('clientFiscalInfo', { ...settings.clientFiscalInfo, ait: e.target.value })} /></div>
                <div className="space-y-2"><Label>RC (Commercial Register Number)</Label><Input value={settings.clientFiscalInfo?.rc || ''} onChange={(e) => updateSetting('clientFiscalInfo', { ...settings.clientFiscalInfo, rc: e.target.value })} /></div>
                <div className="space-y-2"><Label>Artisan Number</Label><Input value={settings.clientFiscalInfo?.artisan || ''} onChange={(e) => updateSetting('clientFiscalInfo', { ...settings.clientFiscalInfo, artisan: e.target.value })} /></div>
                <div className="space-y-2"><Label>Activity / Industry</Label><Input value={settings.clientFiscalInfo?.activity || ''} onChange={(e) => updateSetting('clientFiscalInfo', { ...settings.clientFiscalInfo, activity: e.target.value })} /></div>
              </div>

              <div className="pt-3 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Custom Client Fiscal Fields</Label>
                  <Button type="button" size="sm" variant="outline" className="gap-2" onClick={addClientCustomFiscalInfo}><Plus className="w-4 h-4" />Add</Button>
                </div>
                {(settings.clientCustomFiscalInfo || []).map((field) => (
                  <div key={field.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                    <Input value={field.label} onChange={(e) => updateClientCustomFiscalInfo(field.id, { label: e.target.value })} placeholder="Label" />
                    <Input value={field.value} onChange={(e) => updateClientCustomFiscalInfo(field.id, { value: e.target.value })} placeholder="Default Value" />
                    <Button variant="ghost" size="icon" onClick={() => removeClientCustomFiscalInfo(field.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="fields" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div><h4 className="font-semibold">Custom Fields</h4><p className="text-sm text-muted-foreground">Add additional information to display on invoices</p></div>
              <Button onClick={addCustomField} size="sm" variant="outline" className="gap-2"><Plus className="w-4 h-4" />Add Field</Button>
            </div>

            <div className="space-y-3">
              {settings.customFields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/30">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No custom fields yet</p>
                </div>
              ) : (
                settings.customFields.map((field) => (
                  <div key={field.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <Input value={field.label} onChange={(e) => updateCustomField(field.id, { label: e.target.value })} placeholder="Label" />
                      <Input value={field.value} onChange={(e) => updateCustomField(field.id, { value: e.target.value })} placeholder="Value" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={field.showOnInvoice} onCheckedChange={(checked) => updateCustomField(field.id, { showOnInvoice: checked })} />
                      <Button variant="ghost" size="icon" onClick={() => removeCustomField(field.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div><h4 className="font-semibold">Payment Methods</h4><p className="text-sm text-muted-foreground">Add payment methods to display on invoices</p></div>
              <Button onClick={addPaymentMethod} size="sm" variant="outline" className="gap-2"><Plus className="w-4 h-4" />Add Method</Button>
            </div>

            <div className="space-y-3">
              {settings.paymentMethods.map((method) => (
                <div key={method.id} className="p-4 border rounded-lg bg-card space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Input value={method.name} onChange={(e) => updatePaymentMethod(method.id, { name: e.target.value })} placeholder="Method name" className="max-w-xs" />
                    <div className="flex items-center gap-2">
                      <Switch checked={method.enabled} onCheckedChange={(checked) => updatePaymentMethod(method.id, { enabled: checked })} />
                      <Button variant="ghost" size="icon" onClick={() => removePaymentMethod(method.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <Textarea value={method.details} onChange={(e) => updatePaymentMethod(method.id, { details: e.target.value })} rows={3} placeholder="Payment details" />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="invoice" className="space-y-6 mt-6">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Currency</Label><Input value={settings.currency} onChange={(e) => updateSetting('currency', e.target.value)} /></div>
                <div className="space-y-2"><Label>Currency Symbol</Label><Input value={settings.currencySymbol} onChange={(e) => updateSetting('currencySymbol', e.target.value)} /></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Default Tax Rate (%)</Label><Input type="number" value={settings.defaultTaxRate} onChange={(e) => updateSetting('defaultTaxRate', parseFloat(e.target.value) || 0)} /></div>
                <div className="space-y-2"><Label>Tax Label</Label><Input value={settings.taxLabel} onChange={(e) => updateSetting('taxLabel', e.target.value)} /></div>
              </div>

              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Label>Invoice Footer</Label>
                  <div className="flex items-center gap-2"><Switch checked={settings.showFooter} onCheckedChange={(checked) => updateSetting('showFooter', checked)} /><span className="text-xs text-muted-foreground">Show</span></div>
                </div>
                <Textarea value={settings.footerText} onChange={(e) => updateSetting('footerText', e.target.value)} rows={2} />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!hasChanges} className="gap-2"><Save className="w-4 h-4" />Save Settings</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BusinessSettingsDialog;
