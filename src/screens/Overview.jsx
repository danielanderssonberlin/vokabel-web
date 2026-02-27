import React, { useState, useEffect, useCallback } from 'react';
import { getVocabulary, deleteVocabularyItem, addVocabularyItem, updateVocabularyItem } from '../store/vocabularyStore';
import { Search, Trash2, BookOpen, Plus, PlusCircle, X, Edit2, AlertCircle, SortAsc, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useUiLanguage } from '../context/UiLanguageContext';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function Overview() {
  const { strings } = useUiLanguage();
  const { OVERVIEW, COMMON } = strings;
  const { selectedLanguage } = useLanguage();
  const [vokabeln, setVokabeln] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date' or 'alpha'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Form State
  const [german, setGerman] = useState('');
  const [foreign, setForeign] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadVokabeln = useCallback(async () => {
    if (!selectedLanguage) return;
    try {
      const all = await getVocabulary(selectedLanguage);
      setVokabeln(all);
    } finally {
      setInitialLoading(false);
    }
  }, [selectedLanguage]);

  useEffect(() => {
    loadVokabeln();
  }, [loadVokabeln]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setGerman('');
    setForeign('');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setGerman(item.german);
    setForeign(item.spanish);
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!german || !foreign) {
      setError(OVERVIEW.ERR_FILL_ALL);
      return;
    }

    setLoading(true);
    try {
      if (editingItem) {
        await updateVocabularyItem(editingItem.id, german.trim(), foreign.trim());
      } else {
        await addVocabularyItem(german.trim(), foreign.trim(), selectedLanguage);
      }
      setGerman('');
      setForeign('');
      setIsModalOpen(false);
      setEditingItem(null);
      await loadVokabeln();
    } catch {
      setError(OVERVIEW.ERR_SAVE);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setError('');
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      try {
        await deleteVocabularyItem(itemToDelete);
        await loadVokabeln();
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
      } catch {
        setError(OVERVIEW.ERR_DELETE);
      }
    }
  };

  const filteredData = vokabeln
    .filter(item => 
      item.german.toLowerCase().includes(search.toLowerCase()) || 
      item.spanish.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'alpha') {
        return a.german.localeCompare(b.german);
      }
      // Default: date (newest first)
      return new Date(b.created_at) - new Date(a.created_at);
    });

  const activeVokabeln = filteredData.filter(item => item.status < 5);
  const archivedVokabeln = filteredData.filter(item => item.status === 5);

  return (
    <div className="flex flex-col flex-1 w-full h-full max-w-2xl p-4 pb-24 mx-auto mb-25 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-bold text-primary">{OVERVIEW.TITLE}</h1>
        </div>
        <LanguageSwitcher />
      </div>

      <div className="relative flex items-center gap-2 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 flex items-center pointer-events-none left-4">
            <Search className="w-5 h-5 text-text-muted" />
          </div>
          <input
            type="text"
            className="w-full py-4 pl-12 pr-4 border shadow-sm bg-surface border-border rounded-2xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder={OVERVIEW.SEARCH_PLACEHOLDER}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <button
          onClick={() => setSortBy(sortBy === 'date' ? 'alpha' : 'date')}
          className="flex items-center justify-center transition-all border shadow-sm w-14 h-14 bg-surface border-border rounded-2xl text-primary active:scale-95 hover:bg-slate-50"
          title={sortBy === 'date' ? OVERVIEW.SORT_ALPHA : OVERVIEW.SORT_DATE}
        >
          {sortBy === 'date' ? <Clock size={24} /> : <SortAsc size={24} />}
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
        {initialLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 animate-pulse">
            <div className="w-full h-24 rounded-2xl bg-surface/50" />
            <div className="w-full h-24 rounded-2xl bg-surface/50" />
            <div className="w-full h-24 rounded-2xl bg-surface/50" />
          </div>
        ) : (
          <>
            {activeVokabeln.map((item, index) => (
              <VocabularyItem 
                key={item.id} 
                item={item} 
                index={index}
                onEdit={handleOpenAdd} 
                onDelete={handleDelete}
                OVERVIEW={OVERVIEW}
              />
            ))}

            {archivedVokabeln.length > 0 && (
              <div className="pt-4 pb-2 mt-4 mb-2 animate-fade-in-up">
                <h2 className="text-xl font-bold text-text-secondary">{OVERVIEW.ARCHIVE_HEADER}</h2>
              </div>
            )}

            {archivedVokabeln.map((item, index) => (
              <VocabularyItem 
                key={item.id} 
                item={item} 
                index={activeVokabeln.length + index}
                onEdit={handleOpenAdd} 
                onDelete={handleDelete}
                OVERVIEW={OVERVIEW}
              />
            ))}

            {filteredData.length === 0 && (
              <div className="flex items-center justify-center h-40">
                <p className="text-text-muted">{OVERVIEW.EMPTY_STATE}</p>
              </div>
            )}
          </>
        )}
      </div>

      <button 
        onClick={handleOpenAdd}
        className="fixed z-10 flex items-center justify-center text-white transition-colors rounded-full shadow-lg bottom-24 right-6 md:right-12 w-14 h-14 bg-primary hover:bg-primary/90"
      >
        <Plus size={30} />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="bg-background rounded-t-[40px] p-6 shadow-2xl w-full max-w-2xl h-[80%] animate-slide-up">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-text-main">
                {editingItem ? OVERVIEW.MODAL_EDIT_TITLE : OVERVIEW.MODAL_ADD_TITLE}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 transition-colors rounded-full bg-slate-200 hover:bg-slate-300"
              >
                <X size={20} className="text-text-secondary" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-4 bg-error/10 text-error rounded-2xl">
                  <AlertCircle size={20} />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}
              <div>
                <label className="block mb-2 ml-1 text-sm font-medium text-text-main">{OVERVIEW.GERMAN_LABEL}</label>
                <textarea
                  className="w-full bg-surface border border-border p-4 rounded-2xl text-lg shadow-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder={OVERVIEW.GERMAN_PLACEHOLDER}
                  value={german}
                  onChange={(e) => setGerman(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-2 ml-1 text-sm font-medium text-text-main">{OVERVIEW.FOREIGN_LABEL}</label>
                <textarea
                  className="w-full bg-surface border border-border p-4 rounded-2xl text-lg shadow-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder={OVERVIEW.FOREIGN_PLACEHOLDER}
                  value={foreign}
                  onChange={(e) => setForeign(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center w-full gap-2 p-4 mt-4 font-bold text-white transition-colors shadow-md bg-primary rounded-2xl hover:bg-primary/90 disabled:opacity-50"
              >
                <PlusCircle size={24} />
                {editingItem ? COMMON.SAVE : COMMON.ADD}
              </button>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

function VocabularyItem({ item, onEdit, onDelete, index, OVERVIEW }) {
  return (
    <div 
      className="flex items-center justify-between p-4 transition-all border shadow-sm cursor-pointer bg-surface border-border-light rounded-2xl hover:border-primary/30 group animate-fade-in-up"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={() => onEdit(item)}
    >
      <div className="flex-1">
        <h3 className="text-lg font-bold text-text-main">{item.german}</h3>
        <p className="italic text-text-secondary">{item.spanish}</p>
        
        <div className="flex items-center gap-1 mt-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "w-3 h-3 rounded-full border transition-all duration-300",
                item.status >= i ? "bg-primary border-primary" : "bg-transparent border-primary-light"
              )}
            />
          ))}
          {item.status === 5 && (
            <div className="px-2 ml-2 rounded-full bg-success-light">
              <span className="text-success text-[10px] font-bold">{OVERVIEW.ARCHIVE_TAG}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={() => onEdit(item)}
          className="p-2 transition-colors rounded-full bg-primary-light/20 hover:bg-primary-light/40 text-primary"
        >
          <Edit2 size={16} />
        </button>
        <button 
          onClick={() => onDelete(item.id)}
          className="p-2 transition-colors rounded-full bg-error-light hover:bg-error/20 text-error"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
}
