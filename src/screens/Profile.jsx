import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getVocabulary } from '../store/vocabularyStore';
import { User, Mail, Lock, LogOut, BarChart3, Save, Loader2, CheckCircle, ChevronRight } from 'lucide-react';
import PasswordModal from '../components/PasswordModal';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, learned: 0, inProgress: 0 });

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUserData();
    fetchStats();
  }, []);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      setFullName(user.user_metadata?.full_name || '');
      setEmail(user.email || '');
    }
  };

  const fetchStats = async () => {
    const all = await getVocabulary();
    setStats({
      total: all.length,
      learned: all.filter(v => v.status === 5).length,
      inProgress: all.filter(v => v.status < 5 && v.status > 0).length,
    });
    setLoading(false);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const updates = {
        data: { full_name: fullName }
      };

      if (email !== user.email) {
        updates.email = email;
      }

      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;

      setMessage({ type: 'success', text: 'Profil erfolgreich aktualisiert!' });
    } catch (error) {
      let errorMessage = error.message;
      if (errorMessage === 'New email address is the same as the old one') errorMessage = 'Diese E-Mail-Adresse wird bereits verwendet.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 w-full h-full max-w-2xl p-4 pb-24 mx-auto overflow-y-auto md:p-8">
      <div className="flex items-center gap-3 mb-8">
        <User className="w-8 h-8 text-primary" />
        <h1 className="text-xl font-bold text-primary">Profil & Einstellungen</h1>
      </div>

      {/* Statistik Card */}
      <div className="bg-surface border border-border rounded-[32px] p-6 mb-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-text-main">Statistik</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-primary/5 rounded-2xl">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="mt-1 text-xs tracking-wider uppercase text-text-secondary">Gesamt</p>
          </div>
          <div className="p-4 bg-success/5 rounded-2xl">
            <p className="text-2xl font-bold text-success">{stats.learned}</p>
            <p className="mt-1 text-xs tracking-wider uppercase text-text-secondary">Gelernt</p>
          </div>
          <div className="p-4 bg-secondary/5 rounded-2xl">
            <p className="text-2xl font-bold text-secondary">{stats.inProgress}</p>
            <p className="mt-1 text-xs tracking-wider uppercase text-text-secondary">Offen</p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleUpdateProfile} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block mb-2 ml-1 text-sm font-medium text-text-main">Name</label>
            <div className="relative">
              <User className="absolute w-5 h-5 -translate-y-1/2 left-4 top-1/2 text-text-muted" />
              <input
                type="text"
                className="w-full py-4 pl-12 pr-4 transition-all border bg-surface border-border rounded-2xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dein Name"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 ml-1 text-sm font-medium text-text-main">E-Mail</label>
            <div className="relative">
              <Mail className="absolute w-5 h-5 -translate-y-1/2 left-4 top-1/2 text-text-muted" />
              <input
                type="email"
                className="w-full py-4 pl-12 pr-4 transition-all border bg-surface border-border rounded-2xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.de"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="flex items-center justify-between w-full p-4 transition-all border bg-surface border-border rounded-2xl hover:bg-slate-50 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 transition-colors bg-primary/10 rounded-xl group-hover:bg-primary/20">
                  <Lock size={18} className="text-primary" />
                </div>
                <span className="font-medium text-text-main">Passwort ändern</span>
              </div>
              <ChevronRight size={18} className="text-text-muted" />
            </button>
          </div>
        </div>

        {message.text && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 ${message.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
            {message.type === 'success' && <CheckCircle size={20} />}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center w-full gap-2 p-4 font-bold text-white transition-all shadow-md bg-primary rounded-2xl hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={20} />}
          Änderungen speichern
        </button>
      </form>

      <div className="pt-8 mt-12 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center w-full gap-2 p-4 font-bold transition-all bg-error/10 text-error rounded-2xl hover:bg-error/20"
        >
          <LogOut size={20} />
          Abmelden
        </button>
      </div>

      <PasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
    </div>
  );
}
