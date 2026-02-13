import React, { useState } from 'react';
import { X, Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PasswordModal({ isOpen, onClose }) {
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
      setError('Die neuen Passwörter stimmen nicht überein.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
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
        throw new Error('Das alte Passwort ist nicht korrekt.');
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
      if (errorMessage === 'Password should be at least 6 characters') errorMessage = 'Das neue Passwort muss mindestens 6 Zeichen lang sein.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
      <div 
        className="bg-background rounded-[32px] p-6 shadow-2xl w-full max-w-sm relative animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <X size={20} className="text-text-secondary" />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Lock size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-text-main">Passwort ändern</h2>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-8 text-center animate-in zoom-in">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={40} className="text-success" />
            </div>
            <p className="text-success font-bold text-lg">Passwort erfolgreich geändert!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-main ml-1">Altes Passwort</label>
              <input
                type="password"
                required
                className="w-full bg-surface border border-border rounded-2xl py-4 px-4 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="••••••••"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-border/50">
              <label className="text-sm font-medium text-text-main ml-1">Neues Passwort</label>
              <input
                type="password"
                required
                className="w-full bg-surface border border-border rounded-2xl py-4 px-4 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-main ml-1">Neues Passwort bestätigen</label>
              <input
                type="password"
                required
                className="w-full bg-surface border border-border rounded-2xl py-4 px-4 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 bg-error/10 rounded-xl flex items-center gap-2 text-error">
                <AlertCircle size={16} />
                <p className="text-xs font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 p-4 bg-primary text-white rounded-2xl font-bold shadow-md hover:bg-primary/90 transition-all disabled:opacity-50 mt-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Passwort aktualisieren'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
