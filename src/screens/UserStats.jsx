import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUiLanguage } from '../context/UiLanguageContext';
import { Users, Mail, BarChart3, Flame, Clock, Search, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function UserStats() {
  const { strings } = useUiLanguage();
  const { USER_STATS } = strings;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchUsersData();
  }, []);

  const fetchUsersData = async (manual = false) => {
    if (manual) setIsRefreshing(true);
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching users data...');
      // Fetch data from our new RPC function
      const { data: profiles, error: profilesError } = await supabase
        .rpc('get_user_stats');

      if (profilesError) {
        console.error('Profiles fetch error:', profilesError);
        throw profilesError;
      } else {
        console.log('Profiles found:', profiles?.length || 0);
      }

      const activeProfiles = profiles || [];

      // Fetch vocabulary counts for all users
      const { data: vocabData, error: vocabError } = await supabase
        .from('vocabulary')
        .select('user_id, status, lastReviewed');

      if (vocabError) {
        console.error('Vocabulary fetch error:', vocabError);
        throw vocabError;
      }
      
      console.log('Vocabulary entries found:', vocabData?.length || 0);

      // Process data to aggregate stats per user
      const usersWithStats = activeProfiles.map(profile => {
        const userVocab = (vocabData || []).filter(v => v.user_id === profile.id);
        const total = userVocab.length;
        const learned = userVocab.filter(v => v.status === 5).length;
        
        // Find last reviewed date
        const lastReviewed = userVocab
          .filter(v => v.lastReviewed)
          .map(v => new Date(v.lastReviewed))
          .sort((a, b) => b - a)[0];

        return {
          ...profile,
          total,
          learned,
          lastReviewed: lastReviewed ? lastReviewed.toLocaleDateString() : '---'
        };
      });

      // Sort by total vocabulary (descending)
      setUsers(usersWithStats.sort((a, b) => b.total - a.total));
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError(err.message || 'Ein Fehler ist beim Laden der Nutzer aufgetreten.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase();
    const name = (user.full_name || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const id = (user.id || '').toLowerCase();
    return name.includes(search) || email.includes(search) || id.includes(search);
  });

  return (
    <div className="flex flex-col flex-1 w-full h-full max-w-2xl p-4 pb-0 mx-auto mb-10 md:p-8 md:pb-0">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-primary">{USER_STATS.TITLE}</h1>
        </div>
        <button
          onClick={() => fetchUsersData(true)}
          disabled={isRefreshing}
          className={cn(
            "p-2 transition-all rounded-full bg-primary/10 text-primary hover:bg-primary/20",
            isRefreshing && "animate-spin opacity-50"
          )}
          title="Aktualisieren"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 flex items-center pointer-events-none left-4">
          <Search className="w-5 h-5 text-text-muted" />
        </div>
        <input
          type="text"
          className="w-full py-4 pl-12 pr-4 border shadow-sm bg-surface border-border rounded-2xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Nutzer suchen (Name, E-Mail oder ID)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 animate-pulse">
            <div className="w-full h-16 mb-2 rounded-2xl bg-surface/50" />
            <div className="w-full h-16 mb-2 rounded-2xl bg-surface/50" />
            <div className="w-full h-16 mb-2 rounded-2xl bg-surface/50" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 p-6 text-center border-2 border-dashed border-error/20 rounded-3xl">
            <XCircle size={48} className="mb-4 text-error opacity-50" />
            <p className="font-bold text-error">{error}</p>
            <p className="mt-2 text-sm text-text-muted">Prüfe deine Berechtigungen oder die SQL Funktion.</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Users size={48} className="mb-4 opacity-20 text-primary" />
            <p className="text-text-secondary">{USER_STATS.EMPTY_STATE}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div 
                key={user.id}
                className="p-5 transition-all border shadow-sm bg-surface border-border-light rounded-3xl hover:border-primary/30"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 font-bold text-white rounded-2xl bg-primary/20 text-primary shrink-0">
                      {(user.full_name?.[0] || user.email?.[0] || user.id?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold truncate text-text-main">
                        {user.full_name || user.email || `User ${user.id.substring(0, 8)}`}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-text-muted truncate">
                        <Mail size={12} className="shrink-0" />
                        <span className="truncate">{user.email || user.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 md:flex md:gap-8">
                    <div className="flex flex-col items-center md:items-start">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">{USER_STATS.TOTAL}</span>
                      <div className="flex items-center gap-1 font-bold text-text-main">
                        <BarChart3 size={14} className="text-primary" />
                        {user.total}
                      </div>
                    </div>
                    <div className="flex flex-col items-center md:items-start">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">{USER_STATS.LEARNED}</span>
                      <div className="flex items-center gap-1 font-bold text-success">
                        <CheckCircle2 size={14} />
                        {user.learned}
                      </div>
                    </div>
                    <div className="flex flex-col items-center md:items-start">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">{USER_STATS.LAST_LEARNED}</span>
                      <div className="flex items-center gap-1 text-sm font-medium text-text-secondary">
                        <Clock size={14} />
                        {user.lastReviewed}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
