import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getVocabulary, deleteVocabularyItem, addVocabularyItem, updateVocabularyItem } from '../store/vocabularyStore';
import { Search, Trash2, BookOpen, Plus, PlusCircle, X, Edit2, AlertCircle, SortAsc, Clock, ArrowDownRight, Languages, HelpCircle, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useUiLanguage } from '../context/UiLanguageContext';
import { supabase } from '../lib/supabase';
import { clearLearningSession } from '../lib/storage';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function Overview() {
  const { strings } = useUiLanguage();
  const navigate = useNavigate();
  const { OVERVIEW, COMMON } = strings;
  const { selectedLanguage, availableLanguages } = useLanguage();
  const selectedLangData = availableLanguages.find(l => l.code === selectedLanguage);
  const selectedLanguageName = selectedLangData?.name || OVERVIEW.FOREIGN_LABEL;
  const selectedLanguageExample = selectedLangData?.example || 'apple';
  const [vokabeln, setVokabeln] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date' or 'alpha'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Form State
  const [german, setGerman] = useState('');
  const [foreign, setForeign] = useState('');
  const [isVerb, setIsVerb] = useState(false);
  const [isReflexive, setIsReflexive] = useState(false);
  const [showReflexiveHelp, setShowReflexiveHelp] = useState(false);
  const [forms, setForms] = useState({
    yo: '',
    tu: '',
    el: '',
    nosotros: '',
    vosotros: '',
    ellos: ''
  });
  const [sentence, setSentence] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadVokabeln = useCallback(async () => {
    if (!selectedLanguage) {
      setInitialLoading(false);
      return;
    }
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

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setGerman('');
    setForeign('');
    setIsVerb(false);
    setIsReflexive(false);
    setShowReflexiveHelp(false);
    setForms({
      yo: '',
      tu: '',
      el: '',
      nosotros: '',
      vosotros: '',
      ellos: ''
    });
    setSentence('');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setGerman(item.german);
    
    try {
      const parsed = JSON.parse(item.spanish);
      if (parsed && parsed.isVerb) {
        setIsVerb(true);
        setIsReflexive(parsed.isReflexive || false);
        setShowReflexiveHelp(false);
        setForeign(parsed.infinitive || '');
        setForms(parsed.forms || {
          yo: '',
          tu: '',
          el: '',
          nosotros: '',
          vosotros: '',
          ellos: ''
        });
      } else {
        setIsVerb(false);
        setIsReflexive(false);
        setShowReflexiveHelp(false);
        setForeign(item.spanish);
      }
    } catch (e) {
      setIsVerb(false);
      setIsReflexive(false);
      setShowReflexiveHelp(false);
      setForeign(item.spanish);
    }
    
    setSentence(item.sentence || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!german || (!isVerb && !foreign) || (isVerb && !foreign)) {
      setError(OVERVIEW.ERR_FILL_ALL);
      return;
    }

    if (isVerb) {
      const allFormsFilled = Object.values(forms).every(f => f.trim() !== '');
      if (!allFormsFilled) {
        setError(OVERVIEW.ERR_FILL_ALL);
        return;
      }
    }

    setLoading(true);
    try {
      const finalForeign = isVerb 
        ? JSON.stringify({ isVerb: true, isReflexive, infinitive: foreign.trim(), forms }) 
        : foreign.trim();

      if (editingItem) {
        await updateVocabularyItem(editingItem.id, german.trim(), finalForeign, sentence.trim());
      } else {
        await addVocabularyItem(german.trim(), finalForeign, selectedLanguage, sentence.trim());
      }

      // Session im LocalStorage invalidieren damit die neue Vokabel sofort gelernt werden kann
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        clearLearningSession(selectedLanguage, user.id);
      }

      setGerman('');
      setForeign('');
      setSentence('');
      setIsVerb(false);
      setIsReflexive(false);
      setShowReflexiveHelp(false);
      setForms({
        yo: '',
        tu: '',
        el: '',
        nosotros: '',
        vosotros: '',
        ellos: ''
      });
      setIsModalOpen(false);
      setEditingItem(null);
      await loadVokabeln();
    } catch {
      setError(OVERVIEW.ERR_SAVE);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (key, value) => {
    setForms(prev => ({ ...prev, [key]: value }));
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
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          clearLearningSession(selectedLanguage, user.id);
        }
        await loadVokabeln();
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
      } catch {
        setError(OVERVIEW.ERR_DELETE);
      }
    }
  };

  const handleAddExamples = async () => {
    setLoading(true);
    try {
      let examples = [];
      if (selectedLanguage === 'en') {
        examples = [
          { g: 'Apfel', f: 'apple' },
          { g: 'Haus', f: 'house' },
          { g: 'Hund', f: 'dog' },
          { g: 'Katze', f: 'cat' },
          { g: 'Baum', f: 'tree' },
          { g: 'Wasser', f: 'water' },
          { g: 'Brot', f: 'bread' },
          { g: 'Sonne', f: 'sun' },
          { g: 'Mond', f: 'moon' },
          { g: 'Buch', f: 'book' },
          { g: 'Auto', f: 'car' },
          { g: 'Schule', f: 'school' },
          { g: 'Stadt', f: 'city' },
          { g: 'Freund', f: 'friend' },
          { g: 'Zeit', f: 'time' },
          { g: 'Name', f: 'name' },
          { g: 'Tag', f: 'day' },
          { g: 'Nacht', f: 'night' },
          { g: 'Kind', f: 'child' },
          { g: 'Leben', f: 'life' }
        ];
      } else if (selectedLanguage === 'es') {
        examples = [
          { g: 'Apfel', f: 'manzana' },
          { g: 'Haus', f: 'casa' },
          { g: 'Hund', f: 'perro' },
          { g: 'Katze', f: 'gato' },
          { g: 'Baum', f: 'árbol' },
          { g: 'Wasser', f: 'agua' },
          { g: 'Brot', f: 'pan' },
          { g: 'Sonne', f: 'sol' },
          { g: 'Mond', f: 'luna' },
          { g: 'Buch', f: 'libro' },
          { g: 'Auto', f: 'coche' },
          { g: 'Schule', f: 'escuela' },
          { g: 'Stadt', f: 'ciudad' },
          { g: 'Freund', f: 'amigo' },
          { g: 'Zeit', f: 'tiempo' },
          { g: 'Name', f: 'nombre' },
          { g: 'Tag', f: 'día' },
          { g: 'Nacht', f: 'noche' },
          { g: 'Kind', f: 'niño' },
          { g: 'Leben', f: 'vida' }
        ];
      } else if (selectedLanguage === 'fr') {
        examples = [
          { g: 'Apfel', f: 'pomme' },
          { g: 'Haus', f: 'maison' },
          { g: 'Hund', f: 'chien' },
          { g: 'Katze', f: 'chat' },
          { g: 'Baum', f: 'arbre' },
          { g: 'Wasser', f: 'eau' },
          { g: 'Brot', f: 'pain' },
          { g: 'Sonne', f: 'soleil' },
          { g: 'Mond', f: 'lune' },
          { g: 'Buch', f: 'livre' },
          { g: 'Auto', f: 'voiture' },
          { g: 'Schule', f: 'école' },
          { g: 'Stadt', f: 'ville' },
          { g: 'Freund', f: 'ami' },
          { g: 'Zeit', f: 'temps' },
          { g: 'Name', f: 'nom' },
          { g: 'Tag', f: 'jour' },
          { g: 'Nacht', f: 'nuit' },
          { g: 'Kind', f: 'enfant' },
          { g: 'Leben', f: 'vie' }
        ];
      } else if (selectedLanguage === 'it') {
        examples = [
          { g: 'Apfel', f: 'mela' },
          { g: 'Haus', f: 'casa' },
          { g: 'Hund', f: 'cane' },
          { g: 'Katze', f: 'gatto' },
          { g: 'Baum', f: 'albero' },
          { g: 'Wasser', f: 'acqua' },
          { g: 'Brot', f: 'pane' },
          { g: 'Sonne', f: 'sole' },
          { g: 'Mond', f: 'luna' },
          { g: 'Buch', f: 'libro' },
          { g: 'Auto', f: 'auto' },
          { g: 'Schule', f: 'scuola' },
          { g: 'Stadt', f: 'città' },
          { g: 'Freund', f: 'amigo' },
          { g: 'Zeit', f: 'tempo' },
          { g: 'Name', f: 'nome' },
          { g: 'Tag', f: 'giorno' },
          { g: 'Nacht', f: 'notte' },
          { g: 'Kind', f: 'bambino' },
          { g: 'Leben', f: 'vita' }
        ];
      } else if (selectedLanguage === 'pt') {
        examples = [
          { g: 'Apfel', f: 'maçã' },
          { g: 'Haus', f: 'casa' },
          { g: 'Hund', f: 'cachorro' },
          { g: 'Katze', f: 'gato' },
          { g: 'Baum', f: 'árvore' },
          { g: 'Wasser', f: 'água' },
          { g: 'Brot', f: 'pão' },
          { g: 'Sonne', f: 'sol' },
          { g: 'Mond', f: 'lua' },
          { g: 'Buch', f: 'livre' },
          { g: 'Auto', f: 'carro' },
          { g: 'Schule', f: 'escola' },
          { g: 'Stadt', f: 'cidade' },
          { g: 'Freund', f: 'amigo' },
          { g: 'Zeit', f: 'tempo' },
          { g: 'Name', f: 'nome' },
          { g: 'Tag', f: 'dia' },
          { g: 'Nacht', f: 'noite' },
          { g: 'Kind', f: 'criança' },
          { g: 'Leben', f: 'vida' }
        ];
      } else if (selectedLanguage === 'ru') {
        examples = [
          { g: 'Apfel', f: 'яблоко' },
          { g: 'Haus', f: 'дом' },
          { g: 'Hund', f: 'собака' },
          { g: 'Katze', f: 'кошка' },
          { g: 'Baum', f: 'дерево' },
          { g: 'Wasser', f: 'вода' },
          { g: 'Brot', f: 'хлеб' },
          { g: 'Sonne', f: 'солнце' },
          { g: 'Mond', f: 'луна' },
          { g: 'Buch', f: 'книга' },
          { g: 'Auto', f: 'машина' },
          { g: 'Schule', f: 'школа' },
          { g: 'Stadt', f: 'город' },
          { g: 'Freund', f: 'друг' },
          { g: 'Zeit', f: 'время' },
          { g: 'Name', f: 'имя' },
          { g: 'Tag', f: 'день' },
          { g: 'Nacht', f: 'ночь' },
          { g: 'Kind', f: 'ребенок' },
          { g: 'Leben', f: 'жизнь' }
        ];
      } else if (selectedLanguage === 'tr') {
        examples = [
          { g: 'Apfel', f: 'elma' },
          { g: 'Haus', f: 'ev' },
          { g: 'Hund', f: 'köpek' },
          { g: 'Katze', f: 'kedi' },
          { g: 'Baum', f: 'ağaç' },
          { g: 'Wasser', f: 'su' },
          { g: 'Brot', f: 'ekmek' },
          { g: 'Sonne', f: 'güneş' },
          { g: 'Mond', f: 'ay' },
          { g: 'Buch', f: 'kitap' },
          { g: 'Auto', f: 'araba' },
          { g: 'Schule', f: 'okul' },
          { g: 'Stadt', f: 'şehir' },
          { g: 'Freund', f: 'arkadaş' },
          { g: 'Zeit', f: 'zaman' },
          { g: 'Name', f: 'isim' },
          { g: 'Tag', f: 'gün' },
          { g: 'Nacht', f: 'gece' },
          { g: 'Kind', f: 'çocuk' },
          { g: 'Leben', f: 'hayat' }
        ];
      } else if (selectedLanguage === 'pl') {
        examples = [
          { g: 'Apfel', f: 'jabłko' },
          { g: 'Haus', f: 'dom' },
          { g: 'Hund', f: 'pies' },
          { g: 'Katze', f: 'kot' },
          { g: 'Baum', f: 'drzewo' },
          { g: 'Wasser', f: 'woda' },
          { g: 'Brot', f: 'chleb' },
          { g: 'Sonne', f: 'słońce' },
          { g: 'Mond', f: 'księżyc' },
          { g: 'Buch', f: 'książka' },
          { g: 'Auto', f: 'samochód' },
          { g: 'Schule', f: 'szkoła' },
          { g: 'Stadt', f: 'miasto' },
          { g: 'Freund', f: 'przyjaciel' },
          { g: 'Zeit', f: 'czas' },
          { g: 'Name', f: 'imię' },
          { g: 'Tag', f: 'dzień' },
          { g: 'Nacht', f: 'noc' },
          { g: 'Kind', f: 'dziecko' },
          { g: 'Leben', f: 'życie' }
        ];
      } else if (selectedLanguage === 'nl') {
        examples = [
          { g: 'Apfel', f: 'appel' },
          { g: 'Haus', f: 'huis' },
          { g: 'Hund', f: 'hond' },
          { g: 'Katze', f: 'kat' },
          { g: 'Baum', f: 'boom' },
          { g: 'Wasser', f: 'water' },
          { g: 'Brot', f: 'brood' },
          { g: 'Sonne', f: 'zon' },
          { g: 'Mond', f: 'maan' },
          { g: 'Buch', f: 'boek' },
          { g: 'Auto', f: 'auto' },
          { g: 'Schule', f: 'school' },
          { g: 'Stadt', f: 'stad' },
          { g: 'Freund', f: 'vriend' },
          { g: 'Zeit', f: 'tijd' },
          { g: 'Name', f: 'naam' },
          { g: 'Tag', f: 'dag' },
          { g: 'Nacht', f: 'nacht' },
          { g: 'Kind', f: 'kind' },
          { g: 'Leben', f: 'leven' }
        ];
      } else {
        // Generic examples for other languages
        examples = [
          { g: 'Apfel', f: selectedLangData?.example || 'apple' },
          { g: 'Hallo', f: '...' },
          { g: 'Danke', f: '...' },
          { g: 'Bitte', f: '...' },
          { g: 'Ja', f: '...' },
          { g: 'Nein', f: '...' }
        ];
      }

      for (const ex of examples) {
        await addVocabularyItem(ex.g, ex.f, selectedLanguage, '');
      }

      // Session im LocalStorage invalidieren damit die neuen Vokabeln sofort gelernt werden können
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        clearLearningSession(selectedLanguage, user.id);
      }

      await loadVokabeln();
    } catch (e) {
      console.error("Error adding examples:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = vokabeln
    .filter(item => {
      const searchLower = search.toLowerCase();
      const inGerman = item.german.toLowerCase().includes(searchLower);
      
      let inForeign = false;
      try {
        const parsed = JSON.parse(item.spanish);
        if (parsed && parsed.isVerb) {
          inForeign = parsed.infinitive.toLowerCase().includes(searchLower) ||
                      Object.values(parsed.forms).some(f => f.toLowerCase().includes(searchLower));
        } else {
          inForeign = item.spanish.toLowerCase().includes(searchLower);
        }
      } catch (e) {
        inForeign = item.spanish.toLowerCase().includes(searchLower);
      }
      
      return inGerman || inForeign;
    })
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
    <div className="flex flex-col flex-1 w-full h-full max-w-2xl p-4 pb-0 mx-auto mb-10 md:p-8 md:pb-0">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-bold text-primary">{OVERVIEW.TITLE}</h1>
        </div>
        {selectedLanguage && <LanguageSwitcher />}
      </div>

      {selectedLanguage && (
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
      )}

      <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
        {initialLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 animate-pulse">
            <div className="w-full h-24 rounded-2xl bg-surface/50" />
            <div className="w-full h-24 rounded-2xl bg-surface/50" />
            <div className="w-full h-24 rounded-2xl bg-surface/50" />
          </div>
        ) : !selectedLanguage ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center animate-fade-in-up">
            <div className="p-6 mb-4 rounded-full bg-primary/10">
              <Languages size={48} className="text-primary" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-text-main">{OVERVIEW.NO_LANGUAGE_TITLE}</h2>
            <p className="mb-8 text-text-secondary">{OVERVIEW.NO_LANGUAGE_SUB}</p>
            <Link 
              to="/profile"
              className="px-8 py-3 font-bold text-white transition-all shadow-md bg-primary rounded-2xl hover:bg-primary/90 active:scale-95"
            >
              {OVERVIEW.GO_TO_PROFILE}
            </Link>
          </div>
        ) : (
          <>
            {activeVokabeln.map((item, index) => (
              <VocabularyItem 
                key={item.id} 
                item={item} 
                index={index}
                onEdit={handleOpenEdit} 
                onDelete={handleDelete}
                OVERVIEW={OVERVIEW}
              />
            ))}

            {archivedVokabeln.length > 0 && (
              <div className="flex items-center justify-between pt-4 pb-2 mt-4 mb-2 animate-fade-in-up">
                <h2 className="text-xl font-bold text-text-secondary">{OVERVIEW.ARCHIVE_HEADER}</h2>
                <button
                  onClick={() => setIsArchiveModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 rounded-full transition-all hover:bg-primary/20 active:scale-95 border border-primary/10"
                >
                  <RotateCcw size={14} />
                  {OVERVIEW.ARCHIVE_REPEAT}
                </button>
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
              <div className="relative flex flex-col items-center justify-center px-6 text-center animate-fade-in-up">
                <div className="p-6 mt-4 mb-4 rounded-full bg-primary/5">
                  <BookOpen size={48} className="opacity-20 text-primary" />
                </div>
                <h2 className="mb-1 text-lg font-bold text-text-main">{OVERVIEW.EMPTY_STATE}</h2>
                <p className="mb-8 text-sm text-text-secondary">{OVERVIEW.EMPTY_STATE_SUB}</p>
                
                <div className="flex flex-col w-full gap-3">
                  <button
                    onClick={handleOpenAdd}
                    className="flex items-center justify-center gap-2 px-6 py-4 font-bold text-white transition-all shadow-lg bg-primary rounded-2xl hover:bg-primary/90 active:scale-95"
                  >
                    <Plus size={20} />
                    <span>{OVERVIEW.MODAL_ADD_TITLE}</span>
                  </button>

                  <div className="flex items-center gap-4 my-2">
                    <div className="flex-1 h-px bg-border-light" />
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{OVERVIEW.OR_SEPARATOR}</span>
                    <div className="flex-1 h-px bg-border-light" />
                  </div>

                  <button
                    onClick={handleAddExamples}
                    disabled={loading}
                    className="px-6 py-4 text-sm font-bold transition-all border text-text-secondary border-border bg-surface rounded-2xl hover:bg-background active:scale-95 disabled:opacity-50"
                  >
                    {loading ? OVERVIEW.ADDING_EXAMPLES : OVERVIEW.ADD_EXAMPLES}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {selectedLanguage && (
        <button 
          onClick={handleOpenAdd}
          className="fixed z-10 flex items-center justify-center text-white transition-colors rounded-full shadow-lg bottom-35 right-6 md:right-12 w-14 h-14 bg-primary hover:bg-primary/90"
        >
          <Plus size={30} />
        </button>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background rounded-[40px] p-6 shadow-2xl w-full max-w-2xl max-h-[85vh] mb-[calc(5rem+env(safe-area-inset-bottom))] animate-slide-up flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-6 shrink-0">
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

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 pr-2 space-y-6 overflow-y-auto no-scrollbar overscroll-contain">
                {error && (
                  <div className="flex items-center gap-2 p-4 bg-error/10 text-error rounded-2xl">
                    <AlertCircle size={20} />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between p-4 border bg-surface/50 border-border-light rounded-2xl">
                  <div className="flex flex-col">
                    <span className="font-bold text-text-main">{OVERVIEW.VERB_LABEL}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsVerb(!isVerb)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      isVerb ? "bg-primary" : "bg-slate-300"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      isVerb ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>

                {isVerb && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-4 border bg-surface/50 border-border-light rounded-2xl">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-main">{OVERVIEW.REFLEXIVE_LABEL}</span>
                        <button 
                          type="button"
                          onClick={() => setShowReflexiveHelp(!showReflexiveHelp)}
                          className="transition-colors text-text-muted hover:text-primary"
                        >
                          <HelpCircle size={18} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsReflexive(!isReflexive)}
                        className={cn(
                          "w-12 h-6 rounded-full transition-colors relative",
                          isReflexive ? "bg-primary" : "bg-slate-300"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                          isReflexive ? "left-7" : "left-1"
                        )} />
                      </button>
                    </div>
                    
                    {showReflexiveHelp && (
                      <div className="p-4 mx-1 text-sm border bg-primary/5 border-primary/10 rounded-2xl text-text-secondary animate-fade-in">
                        {OVERVIEW.REFLEXIVE_DESC}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block mb-2 ml-1 text-sm font-medium text-text-main">
                    {isVerb ? OVERVIEW.INFINITIVE_LABEL : OVERVIEW.GERMAN_LABEL}
                  </label>
                  <textarea
                    className="w-full p-4 text-lg border shadow-sm bg-surface border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder={isVerb ? OVERVIEW.INFINITIVE_LABEL : OVERVIEW.GERMAN_PLACEHOLDER}
                    value={german}
                    rows={1}
                    onChange={(e) => setGerman(e.target.value)}
                  />
                </div>

                {!isVerb ? (
                  <div>
                    <label className="block mb-2 ml-1 text-sm font-medium text-text-main">{selectedLanguageName}</label>
                    <textarea
                      className="w-full p-4 text-lg border shadow-sm bg-surface border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder={`z.B. ${selectedLanguageExample}`}
                      value={foreign}
                      rows={1}
                      onChange={(e) => setForeign(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-2 ml-1 text-sm font-medium text-text-main">{selectedLanguageName} ({OVERVIEW.INFINITIVE_LABEL})</label>
                      <input
                        type="text"
                        className="w-full p-4 text-lg border shadow-sm bg-surface border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder={`z.B. ${selectedLanguageExample}`}
                        value={foreign}
                        onChange={(e) => setForeign(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: 'yo', label: isReflexive ? `${OVERVIEW.YO} me` : OVERVIEW.YO },
                        { key: 'tu', label: isReflexive ? `${OVERVIEW.TU} te` : OVERVIEW.TU },
                        { key: 'el', label: isReflexive ? `${OVERVIEW.EL} se` : OVERVIEW.EL },
                        { key: 'nosotros', label: isReflexive ? `${OVERVIEW.NOSOTROS} nos` : OVERVIEW.NOSOTROS },
                        { key: 'vosotros', label: isReflexive ? `${OVERVIEW.VOSOTROS} os` : OVERVIEW.VOSOTROS },
                        { key: 'ellos', label: isReflexive ? `${OVERVIEW.ELLOS} se` : OVERVIEW.ELLOS },
                      ].map((f) => (
                        <div key={f.key}>
                          <label className="block mb-1 ml-1 text-xs font-medium text-text-secondary">{f.label}</label>
                          <input
                            type="text"
                            className="w-full p-3 text-base border shadow-sm bg-surface border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={forms[f.key]}
                            onChange={(e) => handleFormChange(f.key, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-border-light">
                  <label className="block mb-2 ml-1 text-sm font-medium text-text-main">
                    {OVERVIEW.SENTENCE_LABEL}
                  </label>
                  <textarea
                    className="w-full p-4 text-base border shadow-sm bg-surface border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder={OVERVIEW.SENTENCE_PLACEHOLDER}
                    value={sentence}
                    rows={2}
                    onChange={(e) => setSentence(e.target.value)}
                  />
                  <p className="mt-1.5 ml-1 text-xs text-text-muted">
                    {OVERVIEW.SENTENCE_HINT}
                  </p>
                </div>
              </div>

              <div className="pt-4 shrink-0">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center w-full gap-2 p-4 font-bold text-white transition-colors shadow-lg bg-primary rounded-2xl hover:bg-primary/90 disabled:opacity-50"
                >
                  <PlusCircle size={24} />
                  {editingItem ? COMMON.SAVE : COMMON.ADD}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      {isArchiveModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background rounded-[40px] p-8 shadow-2xl w-full max-w-sm animate-slide-up flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-text-main">{strings.LEARNING.ARCHIVE_MODAL_TITLE}</h2>
              <button 
                onClick={() => setIsArchiveModalOpen(false)}
                className="p-2 transition-colors rounded-full bg-slate-200 hover:bg-slate-300"
              >
                <X size={20} className="text-text-secondary" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'random', label: strings.LEARNING.ARCHIVE_OPTION_RANDOM, icon: <RotateCcw size={18} /> },
                { id: 'last50', label: strings.LEARNING.ARCHIVE_OPTION_LAST_50, icon: <Clock size={18} /> },
                { id: 'all', label: strings.LEARNING.ARCHIVE_OPTION_ALL, icon: <BookOpen size={18} /> },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setIsArchiveModalOpen(false);
                    navigate('/', { state: { archive: true, archiveMode: opt.id } });
                  }}
                  className="flex items-center justify-between p-5 transition-all border shadow-sm bg-surface border-border-light rounded-2xl hover:border-primary/50 hover:bg-primary/5 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 transition-colors rounded-xl bg-slate-100 group-hover:bg-primary/10 group-hover:text-primary">
                      {opt.icon}
                    </div>
                    <span className="font-bold text-text-main">{opt.label}</span>
                  </div>
                  <ArrowDownRight className="transition-transform -rotate-90 text-text-muted group-hover:text-primary group-hover:translate-x-1" size={18} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VocabularyItem({ item, onEdit, onDelete, index, OVERVIEW }) {
  let displayForeign = item.spanish;
  let isInfinitive = false;
  
  try {
    const parsed = JSON.parse(item.spanish);
    if (parsed && parsed.isVerb) {
      displayForeign = parsed.infinitive;
      isInfinitive = true;
    }
  } catch (e) {
    // Not JSON
  }

  return (
    <div 
      className="flex items-center justify-between p-4 transition-all border shadow-sm cursor-pointer bg-surface border-border-light rounded-2xl hover:border-primary/30 group animate-fade-in-up"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={() => onEdit(item)}
    >
      <div className="flex-1">
        <h3 className="text-lg font-bold text-text-main">{item.german}</h3>
        <p className={cn(
          "italic text-text-secondary",
          isInfinitive && "text-primary font-medium"
        )}>
          {displayForeign} {isInfinitive && ` ${OVERVIEW.CONJUGATED_LABEL}`}
        </p>
        
        {item.sentence && (
          <p className="mt-1 text-sm text-text-muted line-clamp-1">
            {item.sentence}
          </p>
        )}
        
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
