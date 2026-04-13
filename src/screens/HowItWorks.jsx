import React from 'react';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { useUiLanguage } from '../context/UiLanguageContext';

export default function HowItWorks({ onBack }) {
  const { strings } = useUiLanguage();
  const { HOW_IT_WORKS } = strings.LANDING;

  return (
    <div className="flex flex-col min-h-screen bg-background animate-fade-in-up">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border">
        <button 
          onClick={onBack}
          className="p-2 transition-colors rounded-full hover:bg-surface text-text-secondary"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-text-main">{HOW_IT_WORKS.TITLE}</h1>
      </div>

      <div className="flex-1 w-full max-w-2xl px-6 py-8 mx-auto overflow-y-auto no-scrollbar pb-20">
        <div className="flex justify-center mb-8">
          <div className="p-6 rounded-full bg-primary/10 text-primary">
            <HelpCircle size={60} />
          </div>
        </div>

        <div className="space-y-8">
          {HOW_IT_WORKS.SECTIONS.map((section, idx) => (
            <div 
              key={idx}
              className="p-6 border bg-surface border-border rounded-3xl shadow-sm animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <h2 className="mb-3 text-xl font-black text-primary">{section.title}</h2>
              <p className="leading-relaxed text-text-secondary">
                {section.text}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={onBack}
          className="w-full p-5 mt-12 font-bold transition-all border shadow-sm text-text-secondary border-border bg-surface rounded-3xl hover:bg-background active:scale-95"
        >
          {HOW_IT_WORKS.BACK}
        </button>
      </div>
    </div>
  );
}
