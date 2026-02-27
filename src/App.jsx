import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Overview from './screens/Overview';
import Learning from './screens/Learning';
import Login from './screens/Login';
import Profile from './screens/Profile';
import Welcome from './screens/Welcome';
import { GraduationCap, BookOpen, LogOut, User } from 'lucide-react';
import Toast from './components/Toast'; 
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { UiLanguageProvider, useUiLanguage } from './context/UiLanguageContext';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function Navigation() {
  const location = useLocation();
  const { uiLanguage, toggleUiLanguage, strings } = useUiLanguage();
  const { LEARNING, OVERVIEW, PROFILE } = strings;

  const navItems = [
    { path: '/', label: LEARNING.TITLE, icon: GraduationCap },
    { path: '/overview', label: OVERVIEW.TITLE, icon: BookOpen },
    { path: '/profile', label: PROFILE.TITLE, icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-light px-6 pt-2 pb-[env(safe-area-inset-bottom)] flex flex-col items-center shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-40">
      <div className="flex items-center justify-around w-full max-w-2xl gap-4 h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link 
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors w-[33%]",
                isActive ? "text-primary" : "text-text-secondary"
              )}
            >
              <Icon size={24} />
              <span className="text-[10px] font-semibold text-center">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  return (
    <UiLanguageProvider>
      <AppContent session={session} />
    </UiLanguageProvider>
  );
}

function AppContent({ session }) {
  if (!session) {
    return <Welcome />;
  }

  return (
    <Router basename="/">
      <div className="flex flex-col h-screen h-[100dvh] bg-background overflow-hidden">
        <main className="z-0 flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Learning />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Navigation />
      </div>
    </Router>
  );
}


