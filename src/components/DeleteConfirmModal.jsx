import React from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { useUiLanguage } from '../context/UiLanguageContext';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  const { strings } = useUiLanguage();
  const { COMPONENTS, COMMON } = strings;
  const { DELETE_MODAL } = COMPONENTS;

  const displayTitle = title || DELETE_MODAL.TITLE;
  const displayMessage = message || DELETE_MODAL.DESC;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div 
        className="bg-background rounded-[32px] p-6 shadow-2xl w-full max-w-sm animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-error-light/20">
            <AlertTriangle size={32} className="text-error" />
          </div>
          
          <h2 className="mb-2 text-xl font-bold text-text-main">
            {displayTitle}
          </h2>
          
          <p className="mb-8 text-text-secondary">
            {displayMessage}
          </p>

          <div className="grid w-full grid-cols-2 gap-3">
            <button 
              onClick={onClose}
              className="p-4 font-bold transition-colors border rounded-2xl bg-surface border-border text-text-secondary hover:bg-slate-100"
            >
              {COMMON.CANCEL}
            </button>
            <button 
              onClick={onConfirm}
              className="flex items-center justify-center gap-2 p-4 font-bold text-white transition-colors shadow-md rounded-2xl bg-error hover:bg-error/90 shadow-error/20"
            >
              <Trash2 size={18} />
              {DELETE_MODAL.CONFIRM}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
