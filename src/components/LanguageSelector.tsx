import React from 'react';
import { SupportedLanguage } from '../types';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  currentLanguage: SupportedLanguage;
  onChange: (lang: SupportedLanguage) => void;
}

const LANGUAGES: { code: SupportedLanguage; name: string; flag: string }[] = [
  { code: 'auto', name: 'Auto-detect', flag: '✨' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇶🇦' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onChange,
}) => {
  return (
    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 shadow-xs hover:bg-slate-100 transition-colors">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
      <Globe className="w-3.5 h-3.5 text-blue-600" />
      <select
        id="language-dropdown"
        value={currentLanguage}
        onChange={(e) => onChange(e.target.value as SupportedLanguage)}
        className="text-[10px] font-bold text-slate-600 bg-transparent border-none outline-hidden focus:ring-0 cursor-pointer pr-1 uppercase tracking-tight"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} className="text-slate-800 normal-case">
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

