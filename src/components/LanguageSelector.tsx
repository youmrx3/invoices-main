import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { getLanguage, setLanguage, type Language } from '@/lib/i18n';

interface LanguageSelectorProps {
  onLanguageChange?: (lang: Language) => void;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  onLanguageChange,
  variant = 'ghost',
  size = 'sm'
}) => {
  const currentLang = getLanguage();
  
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    onLanguageChange?.(lang);
    // Trigger a re-render by refreshing the page or dispatching an event
    window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Globe className="w-4 h-4" />
          <span className="uppercase font-medium">{currentLang}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('fr')}
          className={currentLang === 'fr' ? 'bg-accent' : ''}
        >
          🇫🇷 Français
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('en')}
          className={currentLang === 'en' ? 'bg-accent' : ''}
        >
          🇬🇧 English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
