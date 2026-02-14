import React, { useState, useEffect } from 'react';
import { Layout, Eye, EyeOff, GripVertical, AlignLeft, AlignCenter, AlignRight, ArrowLeftRight, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  getInvoiceLayout,
  saveInvoiceLayout,
  getDefaultLabel,
  type InvoiceLayout,
  type HeaderLayout,
  type PartiesLayout,
  type MetaField,
  type SectionOrder,
} from '@/lib/invoiceLayout';
import { getLanguage } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';

interface InvoiceLayoutDialogProps {
  onLayoutChange?: (layout: InvoiceLayout) => void;
}

const AlignmentPicker: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options?: string[];
}> = ({ value, onChange, options = ['left', 'center', 'right'] }) => {
  const icons = { left: AlignLeft, center: AlignCenter, right: AlignRight };
  return (
    <div className="flex gap-1 bg-muted rounded-md p-0.5">
      {options.map((opt) => {
        const Icon = icons[opt as keyof typeof icons] || AlignLeft;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`p-1.5 rounded transition-colors ${
              value === opt
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        );
      })}
    </div>
  );
};

const InvoiceLayoutDialog: React.FC<InvoiceLayoutDialogProps> = ({ onLayoutChange }) => {
  const { toast } = useToast();
  const lang = getLanguage();
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState<InvoiceLayout>(getInvoiceLayout);

  useEffect(() => {
    if (open) setLayout(getInvoiceLayout());
  }, [open]);

  const handleSave = () => {
    saveInvoiceLayout(layout);
    onLayoutChange?.(layout);
    toast({ title: lang === 'fr' ? 'Mise en page enregistrée' : 'Layout saved' });
    setOpen(false);
  };

  const updateHeader = <K extends keyof HeaderLayout>(field: K, value: HeaderLayout[K]) => {
    setLayout(prev => ({ ...prev, header: { ...prev.header, [field]: value } }));
  };

  const updateParties = <K extends keyof PartiesLayout>(field: K, value: PartiesLayout[K]) => {
    setLayout(prev => ({ ...prev, parties: { ...prev.parties, [field]: value } }));
  };

  const updateMetaField = <K extends keyof MetaField>(id: string, field: K, value: MetaField[K]) => {
    setLayout(prev => ({
      ...prev,
      metaFields: prev.metaFields.map(f => f.id === id ? { ...f, [field]: value } : f),
    }));
  };

  const updateSection = <K extends keyof SectionOrder>(id: string, field: K, value: SectionOrder[K]) => {
    setLayout(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === id ? { ...s, [field]: value } : s),
    }));
  };

  const moveItem = <T extends { order: number }>(list: T[], index: number, direction: 'up' | 'down'): T[] => {
    const newList = [...list];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newList.length) return newList;
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    return newList.map((item, i) => ({ ...item, order: i }));
  };

  const sortedMeta = [...layout.metaFields].sort((a, b) => a.order - b.order);
  const sortedSections = [...layout.sections].sort((a, b) => a.order - b.order);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Layout className="w-4 h-4" />
          {lang === 'fr' ? 'Mise en page' : 'Layout'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-primary" />
            {lang === 'fr' ? 'Mise en page de la facture' : 'Invoice Layout'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[65vh] pr-4">
          <Tabs defaultValue="header" className="space-y-4">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="header" className="text-xs">
                {lang === 'fr' ? 'En-tête' : 'Header'}
              </TabsTrigger>
              <TabsTrigger value="parties" className="text-xs">
                {lang === 'fr' ? 'Expéditeur/Client' : 'From/To'}
              </TabsTrigger>
              <TabsTrigger value="fields" className="text-xs">
                {lang === 'fr' ? 'Champs' : 'Fields'}
              </TabsTrigger>
              <TabsTrigger value="sections" className="text-xs">
                {lang === 'fr' ? 'Sections' : 'Sections'}
              </TabsTrigger>
            </TabsList>

            {/* Header Tab */}
            <TabsContent value="header" className="space-y-4">
              {/* Overall Header Alignment */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  {lang === 'fr' ? '📐 Alignement global de l\'en-tête' : '📐 Header Overall Alignment'}
                </h4>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{lang === 'fr' ? 'Alignement vertical' : 'Vertical Alignment'}</Label>
                  <div className="flex gap-1 bg-muted rounded-md p-0.5">
                    {[
                      { value: 'flex-start', label: '↑' },
                      { value: 'center', label: '↕' },
                      { value: 'flex-end', label: '↓' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateHeader('headerAlignment', opt.value)}
                        className={`px-2 py-1 rounded transition-colors text-sm font-medium ${
                          layout.header.headerAlignment === opt.value
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Logo Section */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm">{lang === 'fr' ? '🏢 Position du logo' : '🏢 Logo Position'}</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{lang === 'fr' ? 'Alignement horizontal' : 'Horizontal Alignment'}</Label>
                    <AlignmentPicker value={layout.header.logoPosition} onChange={(v) => updateHeader('logoPosition', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{lang === 'fr' ? 'Alignement vertical' : 'Vertical Alignment'}</Label>
                    <div className="flex gap-1 bg-muted rounded-md p-0.5">
                      {[
                        { value: 'top', label: '↑' },
                        { value: 'center', label: '↕' },
                        { value: 'bottom', label: '↓' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => updateHeader('logoVerticalAlign', opt.value)}
                          className={`px-2 py-1 rounded transition-colors text-sm font-medium ${
                            layout.header.logoVerticalAlign === opt.value
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{lang === 'fr' ? 'Afficher le logo' : 'Show Logo'}</Label>
                    <Switch checked={layout.header.showLogo} onCheckedChange={(v) => updateHeader('showLogo', v)} />
                  </div>
                </div>
              </div>

              {/* Business Info Section */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm">{lang === 'fr' ? '📝 Nom et slogan de l\'entreprise' : '📝 Business Name & Tagline'}</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{lang === 'fr' ? 'Alignement du nom' : 'Business Name Alignment'}</Label>
                    <AlignmentPicker value={layout.header.businessNameAlign} onChange={(v) => updateHeader('businessNameAlign', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{lang === 'fr' ? 'Afficher le nom' : 'Show Business Name'}</Label>
                    <Switch checked={layout.header.showBusinessName} onCheckedChange={(v) => updateHeader('showBusinessName', v)} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{lang === 'fr' ? 'Alignement du slogan' : 'Tagline Alignment'}</Label>
                    <AlignmentPicker value={layout.header.taglineAlign} onChange={(v) => updateHeader('taglineAlign', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{lang === 'fr' ? 'Afficher le slogan' : 'Show Tagline'}</Label>
                    <Switch checked={layout.header.showTagline} onCheckedChange={(v) => updateHeader('showTagline', v)} />
                  </div>
                </div>
              </div>

              {/* Document Title Section */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm">{lang === 'fr' ? '📄 Titre du document' : '📄 Document Title'}</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{lang === 'fr' ? 'Alignement horizontal' : 'Horizontal Alignment'}</Label>
                    <AlignmentPicker value={layout.header.titlePosition} onChange={(v) => updateHeader('titlePosition', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{lang === 'fr' ? 'Alignement vertical' : 'Vertical Alignment'}</Label>
                    <div className="flex gap-1 bg-muted rounded-md p-0.5">
                      {[
                        { value: 'top', label: '↑' },
                        { value: 'center', label: '↕' },
                        { value: 'bottom', label: '↓' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => updateHeader('titleVerticalAlign', opt.value)}
                          className={`px-2 py-1 rounded transition-colors text-sm font-medium ${
                            layout.header.titleVerticalAlign === opt.value
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{lang === 'fr' ? 'Afficher le titre' : 'Show Title'}</Label>
                    <Switch checked={layout.header.showDocumentTitle} onCheckedChange={(v) => updateHeader('showDocumentTitle', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{lang === 'fr' ? 'Afficher le numéro' : 'Show Number'}</Label>
                    <Switch checked={layout.header.showDocumentNumber} onCheckedChange={(v) => updateHeader('showDocumentNumber', v)} />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Parties Tab */}
            <TabsContent value="parties" className="space-y-4">
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">{lang === 'fr' ? 'Inverser les positions' : 'Swap Positions'}</Label>
                    <p className="text-xs text-muted-foreground">{lang === 'fr' ? 'Mettre l\'expéditeur à droite' : 'Put sender on the right'}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateParties('fromPosition', layout.parties.fromPosition === 'left' ? 'right' : 'left')}
                    className="gap-2"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    {layout.parties.fromPosition === 'left' ? (lang === 'fr' ? 'De ← | → À' : 'From ← | → To') : (lang === 'fr' ? 'À ← | → De' : 'To ← | → From')}
                  </Button>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{lang === 'fr' ? 'Afficher l\'expéditeur' : 'Show From'}</Label>
                    <Switch checked={layout.parties.showFrom} onCheckedChange={(v) => updateParties('showFrom', v)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{lang === 'fr' ? 'Libellé personnalisé (expéditeur)' : 'Custom Label (From)'}</Label>
                    <Input
                      value={layout.parties.fromLabel}
                      onChange={(e) => updateParties('fromLabel', e.target.value)}
                      placeholder={getDefaultLabel('from', lang)}
                      className="h-8"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{lang === 'fr' ? 'Afficher le client' : 'Show To'}</Label>
                    <Switch checked={layout.parties.showTo} onCheckedChange={(v) => updateParties('showTo', v)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{lang === 'fr' ? 'Libellé personnalisé (client)' : 'Custom Label (To)'}</Label>
                    <Input
                      value={layout.parties.toLabel}
                      onChange={(e) => updateParties('toLabel', e.target.value)}
                      placeholder={getDefaultLabel('to', lang)}
                      className="h-8"
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <Label className="text-sm">{lang === 'fr' ? 'Alignement du texte' : 'Text Alignment'}</Label>
                  <AlignmentPicker value={layout.parties.textAlignment} onChange={(v) => updateParties('textAlignment', v)} />
                </div>
              </div>
            </TabsContent>

            {/* Fields Tab */}
            <TabsContent value="fields" className="space-y-4">
              {/* Meta fields */}
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  {lang === 'fr' ? 'Champs d\'information' : 'Info Fields'}
                </h4>
                {sortedMeta.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-3 p-2 bg-background rounded border">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => setLayout(prev => ({ ...prev, metaFields: moveItem(sortedMeta, index, 'up') }))}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        disabled={index === 0}
                      >▲</button>
                      <button
                        onClick={() => setLayout(prev => ({ ...prev, metaFields: moveItem(sortedMeta, index, 'down') }))}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        disabled={index === sortedMeta.length - 1}
                      >▼</button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Input
                        value={field.label}
                        onChange={(e) => updateMetaField(field.id, 'label', e.target.value)}
                        placeholder={getDefaultLabel(field.key, lang)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">{lang === 'fr' ? 'Align' : 'Align'}:</span>
                      <AlignmentPicker 
                        value={field.alignment} 
                        onChange={(v) => updateMetaField(field.id, 'alignment', v)}
                        options={['left', 'center', 'right']}
                      />
                    </div>
                    <Badge variant="outline" className="text-xs whitespace-nowrap">{getDefaultLabel(field.key, lang)}</Badge>
                    <button
                      onClick={() => updateMetaField(field.id, 'visible', !field.visible)}
                      className={`p-1 rounded ${field.visible ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      {field.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>

              {/* Table column labels */}
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm">{lang === 'fr' ? 'Colonnes du tableau' : 'Table Columns'}</h4>
                {(['description', 'quantity', 'rate', 'amount'] as const).map((col) => (
                  <div key={col} className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs w-20">{getDefaultLabel(col, lang)}</Badge>
                    <Input
                      value={layout.tableLabels[col]}
                      onChange={(e) => setLayout(prev => ({
                        ...prev,
                        tableLabels: { ...prev.tableLabels, [col]: e.target.value },
                      }))}
                      placeholder={getDefaultLabel(col, lang)}
                      className="h-8 text-sm flex-1"
                    />
                  </div>
                ))}
              </div>

              {/* Totals labels */}
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm">{lang === 'fr' ? 'Libellés des totaux' : 'Totals Labels'}</h4>
                {(['subtotal', 'tax', 'total'] as const).map((key) => (
                  <div key={key} className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs w-20">{getDefaultLabel(key, lang)}</Badge>
                    <Input
                      value={layout.totalsLabels[key]}
                      onChange={(e) => setLayout(prev => ({
                        ...prev,
                        totalsLabels: { ...prev.totalsLabels, [key]: e.target.value },
                      }))}
                      placeholder={getDefaultLabel(key, lang)}
                      className="h-8 text-sm flex-1"
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Sections Tab */}
            <TabsContent value="sections" className="space-y-4">
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm">{lang === 'fr' ? 'Ordre et visibilité des sections' : 'Section Order & Visibility'}</h4>
                <p className="text-xs text-muted-foreground">
                  {lang === 'fr' ? 'Réorganisez et masquez les sections de la facture' : 'Reorder and hide invoice sections'}
                </p>
                {sortedSections.map((section, index) => (
                  <div key={section.id} className="flex items-center gap-3 p-3 bg-background rounded-lg border flex-wrap">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => setLayout(prev => ({ ...prev, sections: moveItem(sortedSections, index, 'up') }))}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        disabled={index === 0}
                      >▲</button>
                      <button
                        onClick={() => setLayout(prev => ({ ...prev, sections: moveItem(sortedSections, index, 'down') }))}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        disabled={index === sortedSections.length - 1}
                      >▼</button>
                    </div>
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1 min-w-[150px]">
                      <Input
                        value={section.label}
                        onChange={(e) => updateSection(section.id, 'label', e.target.value)}
                        placeholder={getDefaultLabel(section.key, lang)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{lang === 'fr' ? 'Align' : 'Align'}:</span>
                      <AlignmentPicker 
                        value={section.alignment} 
                        onChange={(v) => updateSection(section.id, 'alignment', v)}
                        options={['left', 'center', 'right']}
                      />
                    </div>
                    <Badge variant="secondary" className="text-xs">{getDefaultLabel(section.key, lang)}</Badge>
                    <button
                      onClick={() => updateSection(section.id, 'visible', !section.visible)}
                      className={`p-1.5 rounded ${section.visible ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      {section.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {lang === 'fr' ? 'Annuler' : 'Cancel'}
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Layout className="w-4 h-4" />
            {lang === 'fr' ? 'Enregistrer' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceLayoutDialog;
