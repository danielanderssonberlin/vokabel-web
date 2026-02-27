import React from 'react';
import { useUiLanguage } from '../context/UiLanguageContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function UiLanguageSwitcher({ className }) {
  const { uiLanguage, toggleUiLanguage } = useUiLanguage();

  return (
    <div className={cn("flex items-center gap-4 py-2 w-full justify-center", className)}>
      <button 
        onClick={() => toggleUiLanguage('de')}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all",
          uiLanguage === 'de' ? "bg-primary text-white shadow-sm" : "bg-surface text-text-muted hover:bg-slate-100 border border-border-light"
        )}
      >
        DE
      </button>
      <button 
        onClick={() => toggleUiLanguage('en')}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all",
          uiLanguage === 'en' ? "bg-primary text-white shadow-sm" : "bg-surface text-text-muted hover:bg-slate-100 border border-border-light"
        )}
      >
        EN
      </button>
    </div>
  );
}
