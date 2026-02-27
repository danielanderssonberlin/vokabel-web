import React, { useState } from 'react';
import { X, Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUiLanguage } from '../context/UiLanguageContext';

export default function PasswordModal({ isOpen, onClose }) {
  const { strings } = useUiLanguage();
  const { COMPONENTS } = strings;
  const { PASSWORD_MODAL } = COMPONENTS;

  const [loading, setLoading] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError(PASSWORD_MODAL.ERR_MISMATCH);
      return;
    }

    if (newPassword.length < 6) {
      setError(PASSWORD_MODAL.ERR_SHORT);
      return;
    }

    setLoading(true);

    try {
      // 1. Re-authenticate to verify old password (required for password change)
      const { data: { user } } = await supabase.auth.getUser();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });

      if (signInError) {
        throw new Error(PASSWORD_MODAL.ERR_OLD_WRONG);
      }

      // 2. Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 2000);
    } catch (err) {
      let errorMessage = err.message;
      if (errorMessage === 'Password should be at least 6 characters') errorMessage = PASSWORD_MODAL.ERR_SHORT;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
      <div 
        className="bg-background rounded-[32px] p-6 shadow-2xl w-full max-sm relative animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute p-2 transition-colors rounded-full right-6 top-6 bg-slate-100 hover:bg-slate-200"
        >
          <X size={20} className="text-text-secondary" />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 mb-4 bg-primary/10 rounded-2xl">
            <Lock size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-text-main">{PASSWORD_MODAL.TITLE}</h2>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-8 text-center animate-in zoom-in">
            <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-success/10">
              <CheckCircle size={40} className="text-success" />
            </div>
            <p className="text-lg font-bold text-success">{PASSWORD_MODAL.SUCCESS}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="ml-1 text-sm font-medium text-text-main">{PASSWORD_MODAL.CURRENT_LABEL}</label>
              <input
                type="password"
                required
                className="w-full px-4 py-4 transition-all border bg-surface border-border rounded-2xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="••••••••"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>

            <div className="pt-2 space-y-2 border-t border-border/50">
              <label className="ml-1 text-sm font-medium text-text-main">{PASSWORD_MODAL.NEW_LABEL}</label>
              <input
                type="password"
                required
                className="w-full px-4 py-4 transition-all border bg-surface border-border rounded-2xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-sm font-medium text-text-main">{PASSWORD_MODAL.CONFIRM_LABEL}</label>
              <input
                type="password"
                required
                className="w-full px-4 py-4 transition-all border bg-surface border-border rounded-2xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-error/10 rounded-xl text-error">
                <AlertCircle size={16} />
                <p className="text-xs font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full gap-2 p-4 mt-4 font-bold text-white transition-all shadow-md bg-primary rounded-2xl hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : PASSWORD_MODAL.UPDATE_BUTTON}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
