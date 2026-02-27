import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen, Mail, Lock, Loader2, CheckCircle, AlertCircle, ChevronLeft } from 'lucide-react';
import { UI_STRINGS } from '../constants/uiContent';

export default function Login({ onBack }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState('login'); // 'login', 'signup', 'forgot'
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (view === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: UI_STRINGS.LOGIN.SUCCESS_SIGNUP });
      } else if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (error.message === 'Invalid login credentials') {
            throw new Error(UI_STRINGS.LOGIN.ERR_INVALID_CREDENTIALS);
          }
          throw error;
        }
      } else if (view === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: UI_STRINGS.LOGIN.SUCCESS_FORGOT });
        setView('login');
      }
    } catch (error) {
      let errorMessage = error.message;
      if (errorMessage === 'User already registered') errorMessage = UI_STRINGS.LOGIN.ERR_ALREADY_REGISTERED;
      if (errorMessage === 'Password should be at least 6 characters') errorMessage = UI_STRINGS.LOGIN.ERR_PASSWORD_SHORT;
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-6 bg-background">
      {onBack && (
        <button 
          onClick={onBack}
          className="absolute p-2 transition-colors top-6 left-6 text-text-muted hover:text-text-main"
        >
          <ChevronLeft size={24} />
        </button>
      )}
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-4 bg-primary/10 rounded-3xl">
            <BookOpen className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-text-main">{UI_STRINGS.COMMON.APP_NAME.split(' ')[0]} <span className="text-primary">{UI_STRINGS.COMMON.APP_NAME.split(' ')[1]}</span></h1>
          
          <p className="text-text-secondary">
            {view === 'signup' ? UI_STRINGS.LOGIN.SUBTITLE_SIGNUP : 
             view === 'forgot' ? UI_STRINGS.LOGIN.SUBTITLE_FORGOT : UI_STRINGS.LOGIN.SUBTITLE_LOGIN}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label className="ml-1 text-sm font-medium text-text-main">{UI_STRINGS.LOGIN.EMAIL_LABEL}</label>
            <div className="relative">
              <Mail className="absolute w-5 h-5 -translate-y-1/2 left-4 top-1/2 text-text-muted" />
              <input
                type="email"
                required
                className="w-full py-4 pl-12 pr-4 transition-all border bg-surface border-border rounded-2xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder={UI_STRINGS.LOGIN.EMAIL_PLACEHOLDER}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                tabIndex={1}
              />
            </div>
          </div>

          {view !== 'forgot' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-medium text-text-main">{UI_STRINGS.LOGIN.PASSWORD_LABEL}</label>
                {view === 'login' && (
                  <button 
                    type="button"
                    onClick={() => setView('forgot')}
                    className="text-xs text-primary hover:underline"
                    tabIndex={4} 
                  >
                    {UI_STRINGS.LOGIN.FORGOT_PASSWORD}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute w-5 h-5 -translate-y-1/2 left-4 top-1/2 text-text-muted" />
                <input
                  type="password"
                  required
                  className="w-full py-4 pl-12 pr-4 transition-all border bg-surface border-border rounded-2xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder={UI_STRINGS.LOGIN.PASSWORD_PLACEHOLDER}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  tabIndex={2}
                />
              </div>
            </div>
          )}

          {message.text && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200 ${
              message.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
            }`}>
              {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center w-full gap-2 p-4 mt-6 font-bold text-white transition-all shadow-md bg-primary rounded-2xl hover:bg-primary/90 disabled:opacity-50"
            tabIndex={3} 
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {view === 'signup' ? UI_STRINGS.LOGIN.SIGNUP_BUTTON : 
             view === 'forgot' ? UI_STRINGS.LOGIN.SEND_LINK : UI_STRINGS.LOGIN.LOGIN_BUTTON}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setView(view === 'signup' ? 'login' : 'signup')}
            className="font-medium transition-all text-primary hover:underline"
          >
            {view === 'signup' ? UI_STRINGS.LOGIN.LOGIN_PROMPT : 
             view === 'forgot' ? UI_STRINGS.LOGIN.BACK_TO_LOGIN : UI_STRINGS.LOGIN.SIGNUP_PROMPT}
          </button>
        </div>
      </div>
    </div>
  );
}
