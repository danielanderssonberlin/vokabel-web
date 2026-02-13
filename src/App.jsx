import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Overview from './screens/Overview';
import Learning from './screens/Learning';
import Login from './screens/Login';
import Profile from './screens/Profile';
import { GraduationCap, BookOpen, LogOut, User } from 'lucide-react';
import Toast from './components/Toast'; // Optional if I want custom toast
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Lernen', icon: GraduationCap },
    { path: '/overview', label: 'Übersicht', icon: BookOpen },
    { path: '/profile', label: 'Profil', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-light px-6 py-2 flex justify-around items-center h-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-40">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <Link 
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              isActive ? "text-primary" : "text-text-secondary"
            )}
          >
            <Icon size={24} />
            <span className="text-xs font-semibold">{item.label}</span>
          </Link>
        );
      })}
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

  if (!session) {
    return <Login />;
  }

  return (
    <Router>
      <main className="z-0 flex flex-col flex-1 overflow-hidden bg-background">
        <Routes>
          <Route path="/" element={<Learning />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Navigation />
    </Router>
  );
}
