import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useUiLanguage } from '../context/UiLanguageContext';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function LanguageSwitcher() {
  const { strings } = useUiLanguage();
  const { COMMON } = strings;
  const { selectedLanguage, availableLanguages, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = availableLanguages.find(l => l.code === selectedLanguage) || availableLanguages[0];

  if (availableLanguages.length <= 1) return (
    <div className="flex items-center gap-2 px-3 py-1.5 border border-border-light rounded-full bg-surface shadow-sm">
      <span className="text-xl leading-none">{currentLang?.flag}</span>
      <span className="text-xs font-bold uppercase tracking-wider text-text-main">{currentLang?.code}</span>
    </div>
  );

  return (
    <div className="relative">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 border border-border-light rounded-full bg-surface shadow-sm active:scale-95 transition-all hover:bg-slate-50"
      >
        <span className="text-xl leading-none">{currentLang?.flag}</span>
        <span className="text-xs font-bold uppercase tracking-wider text-text-main">{currentLang?.code}</span>
        <ChevronDown size={14} className={cn("text-text-muted transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[60]" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-40 bg-surface border border-border rounded-2xl shadow-xl z-[70] overflow-hidden animate-bounce-in origin-top-right">
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  changeLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 w-full p-3 text-left hover:bg-slate-50 transition-colors",
                  selectedLanguage === lang.code ? "bg-primary/5 text-primary" : "text-text-main"
                )}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-bold">
                    {COMMON.PREDEFINED_LANGUAGES.find(l => l.code === lang.code)?.name || lang.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest opacity-60">{lang.code}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
