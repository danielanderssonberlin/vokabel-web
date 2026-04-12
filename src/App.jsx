import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Overview from './screens/Overview';
import Learning from './screens/Learning';
import Profile from './screens/Profile';
import Welcome from './screens/Welcome';
import UserStats from './screens/UserStats';
import { GraduationCap, BookOpen, LogOut, User, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { UiLanguageProvider, useUiLanguage } from './context/UiLanguageContext';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function Navigation({ isSuperadmin }) {
  const location = useLocation();
  const { strings } = useUiLanguage();
  const { LEARNING, OVERVIEW, PROFILE, USER_STATS } = strings;

  const navItems = [
    { path: '/', label: LEARNING.TITLE, icon: GraduationCap },
    { path: '/overview', label: OVERVIEW.TITLE, icon: BookOpen },
    ...(isSuperadmin ? [{ path: '/stats', label: USER_STATS.TITLE, icon: Users }] : []),
    { path: '/profile', label: PROFILE.TITLE, icon: User },
  ];

  return (
    <nav className="bg-white border-t border-border-light px-6 pt-2 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex flex-col items-center shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-40">
      <div className="flex items-center justify-around w-full max-w-2xl gap-4 h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link 
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors",
                navItems.length === 4 ? "w-[25%]" : "w-[33%]",
                isActive ? "text-primary" : "text-text-secondary"
              )}
            >
              <Icon size={24} />
              <span className="text-[10px] font-semibold text-center leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkSuperadmin(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkSuperadmin(session.user.id);
      } else {
        setIsSuperadmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSuperadmin = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('superadmin')
        .eq('id', userId)
        .maybeSingle();
      
      if (data) {
        setIsSuperadmin(Boolean(data.superadmin));
      }
    } catch (e) {
      console.error("Error checking superadmin:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  return (
    <UiLanguageProvider>
      <AppContent session={session} isSuperadmin={isSuperadmin} />
    </UiLanguageProvider>
  );
}

function AppContent({ session, isSuperadmin }) {
  if (!session) {
    return <Welcome />;
  }

  return (
    <Router basename="/">
      <div className="flex flex-col h-screen bg-background overflow-hidden">
        <main className="z-0 flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Learning />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/profile" element={<Profile />} />
            {isSuperadmin && <Route path="/stats" element={<UserStats />} />}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Navigation isSuperadmin={isSuperadmin} />
      </div>
    </Router>
  );
}


