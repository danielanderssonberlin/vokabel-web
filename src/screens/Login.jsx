import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen, Mail, Lock, Loader2 } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Registrierung erfolgreich! Bitte prüfe deine E-Mails (falls Bestätigung aktiviert ist).');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      alert('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-4 bg-primary/10 rounded-3xl">
            <BookOpen className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-text-main">Vokabel Trainer</h1>
          <p className="text-text-secondary">
            {isSignUp ? 'Erstelle ein Konto' : 'Melde dich an'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-main ml-1">E-Mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
              <input
                type="email"
                required
                className="w-full bg-surface border border-border rounded-2xl py-4 pl-12 pr-4 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="deine@email.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-main ml-1">Passwort</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
              <input
                type="password"
                required
                className="w-full bg-surface border border-border rounded-2xl py-4 pl-12 pr-4 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 p-4 bg-primary text-white rounded-2xl font-bold shadow-md hover:bg-primary/90 transition-all disabled:opacity-50 mt-6"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {isSignUp ? 'Registrieren' : 'Anmelden'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary font-medium hover:underline transition-all"
          >
            {isSignUp ? 'Bereits ein Konto? Anmelden' : 'Noch kein Konto? Registrieren'}
          </button>
        </div>
      </div>
    </div>
  );
}
