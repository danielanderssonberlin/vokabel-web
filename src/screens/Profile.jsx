import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getVocabulary } from '../store/vocabularyStore';
import { getUserStats, calculateStatsFromVocabulary } from '../store/userStore';
import { useLanguage, PREDEFINED_LANGUAGES } from '../context/LanguageContext';
import { User, Mail, Lock, LogOut, BarChart3, Save, Loader2, CheckCircle, ChevronRight, Calendar, XCircle, CheckCircle2, Plus, Trash2, Globe } from 'lucide-react';
import PasswordModal from '../components/PasswordModal';
import { UI_STRINGS } from '../constants/uiContent';

export default function Profile() {
  const { availableLanguages, addLanguage, removeLanguage, selectedLanguage, loading: langLoading } = useLanguage();
  const [user, setUser] = useState(null);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [disableTooSoon, setDisableTooSoon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, learned: 0, inProgress: 0, studyHistory: [], streak: 0 });

  // Language Form State
  const [newLangName, setNewLangName] = useState('');
  const [newLangCode, setNewLangCode] = useState('');
  const [newLangFlag, setNewLangFlag] = useState('');
  const [showAddLang, setShowAddLang] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSelectPredefined = (e) => {
    const selected = PREDEFINED_LANGUAGES.find(l => l.code === e.target.value);
    if (selected) {
      setNewLangCode(selected.code);
      setNewLangName(selected.name);
      setNewLangFlag(selected.flag);
    }
  };

  const handleAddLang = async (e) => {
    e.preventDefault();
    if (!newLangName || !newLangCode || !newLangFlag) return;
    
    await addLanguage({
      name: newLangName,
      code: newLangCode,
      flag: newLangFlag
    });
    
    setNewLangName('');
    setNewLangCode('');
    setNewLangFlag('');
    setShowAddLang(false);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (!langLoading) {
      if (selectedLanguage) {
        fetchStats();
      } else {
        setLoading(false);
      }
    }
  }, [selectedLanguage, langLoading]);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    console.log('Fetched user:', user);
    setUser(user);
    setFullName(user.user_metadata?.full_name || '');
    setEmail(user.email || '');

    // Superadmin abfragen
    console.log('Auth user id:', user.id);
    const { data, error } = await supabase
      .from('profiles')
      .select('superadmin, disable_too_soon')
      .eq('id', user.id)
      .maybeSingle(); 
    console.log('Profile data:', data);

    if (error) {
      console.error('Error fetching profile:', error);
    } else if (data) {
      console.log('Fetched profile data:', data);
      setIsSuperadmin(Boolean(data.superadmin));
      setDisableTooSoon(Boolean(data.disable_too_soon));
    } else {
      console.log('No profile found for this user.');
      setIsSuperadmin(false);
    }

  };

  const fetchStats = async () => {
    const all = await getVocabulary(selectedLanguage);
    const calculated = calculateStatsFromVocabulary(all);
    
    setStats({
      total: all.length,
      learned: all.filter(v => v.status === 5).length,
      inProgress: all.filter(v => v.status < 5).length,
      studyHistory: calculated.studyHistory,
      streak: calculated.streak
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

      // Profile settings (superadmin options)
      if (isSuperadmin) {
        const { data, error } = await supabase
          .from('profiles')
          .update({ disable_too_soon: disableTooSoon })
          .eq('id', user.id)
          .select(); // <-- hier bekommst du die aktualisierte Zeile zurück

        console.log('Update result:', data, error);
      }

      setMessage({ type: 'success', text: UI_STRINGS.PROFILE.SUCCESS_UPDATE });
    } catch (error) {
      let errorMessage = error.message;
      if (errorMessage === 'New email address is the same as the old one') errorMessage = UI_STRINGS.PROFILE.ERR_EMAIL_EXISTS;
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
    <div className="flex flex-col flex-1 w-full h-full max-w-2xl p-4 pb-24 mx-auto mb-64 overflow-y-auto md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <User className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-bold text-primary">{UI_STRINGS.PROFILE.TITLE}</h1>
        </div>
        {isSuperadmin && (
          <div className="items-center gap-1 px-3 py-1 text-center border rounded-full bg-primary/10 border-primary/20 ">
            <span className="text-[10px] font-black tracking-widest text-primary uppercase">{UI_STRINGS.PROFILE.SUPERADMIN_TAG}</span>
          </div>
        )}
      </div>

      {/* Sprachen Management */}
      <div className="bg-surface border border-border rounded-[32px] p-6 mb-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-text-main">{UI_STRINGS.PROFILE.LANGUAGES_SECTION}</h2>
          </div>
          <button 
            onClick={() => setShowAddLang(!showAddLang)}
            className="p-2 transition-colors rounded-full bg-primary/10 text-primary hover:bg-primary/20"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {availableLanguages.map((lang) => (
            <div key={lang.code} className="flex items-center justify-between p-4 border bg-background border-border-light rounded-2xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{lang.flag}</span>
                <div className="flex flex-col">
                  <span className="font-bold text-text-main">{lang.name}</span>
                  <span className="text-xs tracking-wider uppercase text-text-muted">{lang.code}</span>
                </div>
              </div>
              <button 
                onClick={() => removeLanguage(lang.code)}
                className="p-2 transition-colors rounded-full text-text-muted hover:text-error hover:bg-error/10"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        {showAddLang && (
          <form onSubmit={handleAddLang} className="pt-6 mt-6 border-t border-border-light animate-fade-in-up">
            <div className="mb-6">
              <label className="block mb-2 ml-1 text-xs font-bold uppercase text-text-muted">{UI_STRINGS.PROFILE.ADD_LANGUAGE_LABEL}</label>
              <select 
                className="w-full p-4 border bg-background border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                onChange={handleSelectPredefined}
                defaultValue=""
                required
              >
                <option value="" disabled>{UI_STRINGS.PROFILE.ADD_LANGUAGE_PLACEHOLDER}</option>
                {PREDEFINED_LANGUAGES
                  .filter(l => !availableLanguages.find(al => al.code === l.code))
                  .map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>
                  ))
                }
              </select>
            </div>
            
            <button 
              type="submit"
              disabled={!newLangCode}
              className="flex items-center justify-center w-full gap-2 p-4 font-bold text-white transition-colors bg-primary rounded-2xl hover:bg-primary/90 disabled:opacity-50"
            >
              {UI_STRINGS.PROFILE.ADD_LANGUAGE_BUTTON}
            </button>
          </form>
        )}
      </div>

      {/* Statistik Card */}
      <div className="bg-surface border border-border rounded-[32px] p-6 mb-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-text-main">{UI_STRINGS.PROFILE.STATS_SECTION}</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-primary/5 rounded-2xl">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="mt-1 text-xs tracking-wider uppercase text-text-secondary">{UI_STRINGS.PROFILE.STATS_TOTAL}</p>
          </div>
          <div className="p-4 bg-success/5 rounded-2xl">
            <p className="text-2xl font-bold text-success">{stats.learned}</p>
            <p className="mt-1 text-xs tracking-wider uppercase text-text-secondary">{UI_STRINGS.PROFILE.STATS_LEARNED}</p>
          </div>
          <div className="p-4 bg-secondary/5 rounded-2xl">
            <p className="text-2xl font-bold text-secondary">{stats.inProgress}</p>
            <p className="mt-1 text-xs tracking-wider uppercase text-text-secondary">{UI_STRINGS.PROFILE.STATS_OPEN}</p>
          </div>
        </div>
      </div>

      {/* Study Activity / Calendar */}
      <div className="bg-surface border border-border rounded-[32px] p-6 mb-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-text-main">{UI_STRINGS.PROFILE.ACTIVITY_SECTION}</h2>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 text-orange-600 border border-orange-100 rounded-full bg-orange-50">
            <span className="text-xs font-bold">{UI_STRINGS.PROFILE.STREAK_DAYS(stats.streak)}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 14 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (13 - i));
            const dateStr = date.toDateString();
            const isToday = dateStr === new Date().toDateString();
            const hasStudied = stats.studyHistory.includes(dateStr);
            
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-text-muted uppercase">
                  {UI_STRINGS.PROFILE.WEEKDAYS[date.getDay()]}
                </span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  hasStudied 
                    ? 'bg-success/10 text-success border border-success/20' 
                    : 'bg-slate-50 text-slate-300 border border-slate-100'
                } ${isToday ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                  {hasStudied ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <XCircle size={20} />
                  )}
                </div>
                <span className={`text-[10px] font-medium ${isToday ? 'text-primary font-bold' : 'text-text-muted'}`}>
                  {date.getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleUpdateProfile} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block mb-2 ml-1 text-sm font-medium text-text-main">{UI_STRINGS.PROFILE.NAME_LABEL}</label>
            <div className="relative">
              <User className="absolute w-5 h-5 -translate-y-1/2 left-4 top-1/2 text-text-muted" />
              <input
                type="text"
                className="w-full py-4 pl-12 pr-4 transition-all border bg-surface border-border rounded-2xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={UI_STRINGS.PROFILE.NAME_PLACEHOLDER}
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 ml-1 text-sm font-medium text-text-main">{UI_STRINGS.PROFILE.EMAIL_LABEL}</label>
            <div className="relative">
              <Mail className="absolute w-5 h-5 -translate-y-1/2 left-4 top-1/2 text-text-muted" />
              <input
                type="email"
                className="w-full py-4 pl-12 pr-4 transition-all border bg-surface border-border rounded-2xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={UI_STRINGS.PROFILE.EMAIL_PLACEHOLDER}
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
                <span className="font-medium text-text-main">{UI_STRINGS.PROFILE.CHANGE_PASSWORD}</span>
              </div>
              <ChevronRight size={18} className="text-text-muted" />
            </button>
          </div>

          {isSuperadmin && (
            <div className="pt-4 mt-6 border-t border-border">
              <h3 className="mb-4 text-xs font-bold tracking-widest uppercase text-text-muted">{UI_STRINGS.PROFILE.SUPERADMIN_SETTINGS}</h3>
              <div className="flex items-center justify-between p-4 border bg-primary/5 border-primary/10 rounded-2xl">
                <div className="flex flex-col">
                  <span className="font-bold text-primary">{UI_STRINGS.PROFILE.DISABLE_TOO_SOON_LABEL}</span>
                  <span className="text-xs text-text-secondary">{UI_STRINGS.PROFILE.DISABLE_TOO_SOON_DESC}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDisableTooSoon(!disableTooSoon)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${disableTooSoon ? 'bg-primary' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${disableTooSoon ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              <div className="mt-4 text-sm text-text-secondary">
                {UI_STRINGS.PROFILE.USER_ID_LABEL} {user.id}
              </div>
            </div>
            
          )}
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
          {UI_STRINGS.COMMON.SAVE}
        </button>
      </form>

      <div className="pt-8 mt-12 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center w-full gap-2 p-4 font-bold transition-all bg-error/10 text-error rounded-2xl hover:bg-error/20"
        >
          <LogOut size={20} />
          {UI_STRINGS.COMMON.LOGOUT}
        </button>
      </div>

      <PasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
    </div>
  );
}
