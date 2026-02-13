import React from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, title = "Vokabel löschen", message = "Möchtest du diese Vokabel wirklich unwiderruflich löschen?" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div 
        className="bg-background rounded-[32px] p-6 shadow-2xl w-full max-w-sm animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-error-light/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-error" />
          </div>
          
          <h2 className="text-xl font-bold text-text-main mb-2">
            {title}
          </h2>
          
          <p className="text-text-secondary mb-8">
            {message}
          </p>

          <div className="grid grid-cols-2 gap-3 w-full">
            <button 
              onClick={onClose}
              className="p-4 rounded-2xl bg-surface border border-border text-text-secondary font-bold hover:bg-slate-100 transition-colors"
            >
              Abbrechen
            </button>
            <button 
              onClick={onConfirm}
              className="p-4 rounded-2xl bg-error text-white font-bold flex items-center justify-center gap-2 hover:bg-error/90 transition-colors shadow-md shadow-error/20"
            >
              <Trash2 size={18} />
              Löschen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
