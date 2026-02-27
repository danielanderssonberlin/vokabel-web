import React, { useState } from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import Login from './Login';
import UiLanguageSwitcher from '../components/UiLanguageSwitcher';
import { useUiLanguage } from '../context/UiLanguageContext';

export default function Welcome() {
  const [showLogin, setShowLogin] = useState(false);
  const { strings } = useUiLanguage();
  const { LANDING, COMMON } = strings;

  if (showLogin) {
    return <Login onBack={() => setShowLogin(false)} />;
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-6 pb-12 overflow-y-auto bg-background no-scrollbar">
      {/* Hero Section */}
      <div className="w-full max-w-2xl pt-12 pb-16 text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center p-4 mb-6 rounded-full bg-primary/10 text-primary">
          <BookOpen size={48} />
        </div>
        <h1 className="mb-4 text-4xl font-black tracking-tight md:text-5xl text-text-main">
          {COMMON.APP_NAME.split(' ')[0]} <span className="text-primary">{COMMON.APP_NAME.split(' ')[1]}</span>
        </h1>
        <p className="max-w-md mx-auto mb-10 text-lg leading-relaxed text-text-secondary">
          {LANDING.TAGLINE}
        </p>
        
        <button
          onClick={() => setShowLogin(true)}
          className="flex items-center justify-center w-full max-w-sm gap-2 p-5 mx-auto font-bold text-white transition-all shadow-lg group bg-primary rounded-3xl hover:bg-primary/90 active:scale-95"
        >
          <span>{LANDING.START_BUTTON}</span>
          <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* Feature Grid */}
      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
        { LANDING.FEATURES.map((feature, idx) => (
          <div 
            key={idx} 
            className="p-6 bg-surface border border-border rounded-[32px] shadow-sm animate-fade-in-up"
            style={{ animationDelay: `${(idx + 1) * 0.15}s` }}
          >
            <div className="p-3 mb-4 bg-background rounded-2xl w-fit">
              {feature.icon}
            </div>
            <h3 className="mb-1 text-lg font-bold text-text-main">{feature.title}</h3>
            <p className="text-sm leading-relaxed text-text-secondary">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Social Proof / Footer Info */}
      <div className="mt-12 text-center animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
        <p className="text-xs text-text-muted">{LANDING.FOOTER_INFO}</p>
      </div>

      {/* Footer Switcher for non-logged in users */}
      <div className="w-full max-w-xs pt-8 mt-auto">
        <UiLanguageSwitcher />
      </div>
    </div>
  );
}
