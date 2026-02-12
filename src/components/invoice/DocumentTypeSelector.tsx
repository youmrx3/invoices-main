import React, { useState, useEffect } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Trash2, FileText } from 'lucide-react';
import { 
  getDocumentTypes, 
  addDocumentType, 
  deleteDocumentType,
  type DocumentType 
} from '@/lib/documentTypes';
import { getLanguage, t } from '@/lib/i18n';

interface DocumentTypeSelectorProps {
  selectedType: DocumentType | null;
  onTypeChange: (type: DocumentType) => void;
}

const DocumentTypeSelector: React.FC<DocumentTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
}) => {
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newType, setNewType] = useState({
    nameFr: '',
    nameEn: '',
    prefix: '',
    color: '#3b82f6',
  });
  
  const lang = getLanguage();
  
  useEffect(() => {
    const loadedTypes = getDocumentTypes();
    setTypes(loadedTypes);
    
    // Select default type if none selected
    if (!selectedType) {
      const defaultType = loadedTypes.find(t => t.isDefault) || loadedTypes[0];
      if (defaultType) {
        onTypeChange(defaultType);
      }
    }
  }, []);
  
  const handleAddType = () => {
    if (!newType.nameFr || !newType.prefix) return;
    
    const added = addDocumentType({
      name: newType.nameFr,
      nameFr: newType.nameFr,
      nameEn: newType.nameEn || newType.nameFr,
      prefix: newType.prefix.toUpperCase(),
      color: newType.color,
      isDefault: false,
    });
    
    setTypes([...types, added]);
    setNewType({ nameFr: '', nameEn: '', prefix: '', color: '#3b82f6' });
    setIsAddOpen(false);
  };
  
  const handleDeleteType = (id: string) => {
    if (deleteDocumentType(id)) {
      setTypes(types.filter(t => t.id !== id));
      if (selectedType?.id === id) {
        const defaultType = types.find(t => t.isDefault && t.id !== id) || types[0];
        if (defaultType) onTypeChange(defaultType);
      }
    }
  };
  
  const getTypeName = (type: DocumentType) => {
    return lang === 'fr' ? type.nameFr : type.nameEn;
  };
  
  return (
    <div className="flex items-center gap-2">
      <Select 
        value={selectedType?.id || ''} 
        onValueChange={(id) => {
          const type = types.find(t => t.id === id);
          if (type) onTypeChange(type);
        }}
      >
        <SelectTrigger className="w-40 h-9">
          <div className="flex items-center gap-2">
            {selectedType && (
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: selectedType.color }}
              />
            )}
            <SelectValue placeholder={t('documentType')} />
          </div>
        </SelectTrigger>
        <SelectContent>
          {types.map((type) => (
            <SelectItem key={type.id} value={type.id}>
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: type.color }}
                />
                <span>{getTypeName(type)}</span>
                <span className="text-xs text-muted-foreground">({type.prefix})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Plus className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addDocumentType')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom (Français)</Label>
                <Input
                  value={newType.nameFr}
                  onChange={(e) => setNewType({ ...newType, nameFr: e.target.value })}
                  placeholder="ex: Facture"
                />
              </div>
              <div className="space-y-2">
                <Label>Name (English)</Label>
                <Input
                  value={newType.nameEn}
                  onChange={(e) => setNewType({ ...newType, nameEn: e.target.value })}
                  placeholder="e.g. Invoice"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Préfixe</Label>
                <Input
                  value={newType.prefix}
                  onChange={(e) => setNewType({ ...newType, prefix: e.target.value.toUpperCase() })}
                  placeholder="ex: FAC"
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label>Couleur</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={newType.color}
                    onChange={(e) => setNewType({ ...newType, color: e.target.value })}
                    className="w-12 h-9 p-1 cursor-pointer"
                  />
                  <Input
                    value={newType.color}
                    onChange={(e) => setNewType({ ...newType, color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleAddType}>
                {t('add')}
              </Button>
            </div>
          </div>
          
          {/* Existing types list */}
          <div className="border-t pt-4 mt-4">
            <Label className="text-sm text-muted-foreground mb-3 block">
              Types existants
            </Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {types.map((type) => (
                <div 
                  key={type.id} 
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: type.color }}
                    />
                    <span className="text-sm font-medium">{getTypeName(type)}</span>
                    <span className="text-xs text-muted-foreground">{type.prefix}</span>
                  </div>
                  {!type.isSystem && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteType(type.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentTypeSelector;
