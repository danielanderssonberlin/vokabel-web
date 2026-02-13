import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getVocabulary, updateVocabularyStatus } from '../store/vocabularyStore';
import { CheckCircle2, GraduationCap, ArrowRight, Mic, MicOff } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function Learning() {
  const [vokabeln, setVokabeln] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [wasTooSoon, setWasTooSoon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  
  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const recognition = useRef(null);

  const loadVokabeln = useCallback(async () => {
    setLoading(true);
    const all = await getVocabulary();
    const toLearn = all
      .filter(v => v.status < 5)
      .sort((a, b) => a.status - b.status);
    setVokabeln(toLearn);
    setCurrentIndex(0);
    setIsCorrect(null);
    setAnswer('');
    setSessionCompleted(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadVokabeln();
    
    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition();
      recognition.current.lang = 'es-ES';
      recognition.current.interimResults = true;
      recognition.current.continuous = false;

      recognition.current.onstart = () => setIsListening(true);
      recognition.current.onend = () => setIsListening(false);
      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setAnswer(transcript);
      };
      recognition.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
    }
  }, [loadVokabeln]);

  const handleMicPress = () => {
    if (!recognition.current) {
      alert('Spracherkennung wird in diesem Browser nicht unterstützt.');
      return;
    }

    if (isListening) {
      recognition.current.stop();
    } else {
      recognition.current.start();
    }
  };

  const handleCheck = async (e) => {
    if (e) e.preventDefault();
    if (!answer || isCorrect !== null) return;

    const current = vokabeln[currentIndex];
    const correct = answer.trim().toLowerCase() === current.spanish.trim().toLowerCase();
    
    // Sofortige Prüfung für direktes Feedback
    if (correct) {
      const now = new Date();
      const last = new Date(current.lastReviewed || 0);
      const hoursSinceLast = (now - last) / (1000 * 60 * 60);
      if (hoursSinceLast < 12 && current.lastReviewed !== null) {
        setWasTooSoon(true);
      }
    }

    setIsCorrect(correct);
    
    // Datenbank im Hintergrund aktualisieren
    try {
      const { tooSoon } = await updateVocabularyStatus(current.id, correct);
      setWasTooSoon(tooSoon); // Sync mit Server-Ergebnis
    } catch (err) {
      console.error('Update failed:', err);
    }

    setTimeout(() => {
      if (currentIndex < vokabeln.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setAnswer('');
        setIsCorrect(null);
        setWasTooSoon(false);
      } else {
        setSessionCompleted(true);
      }
    }, 2000); // 2 Sekunden Zeit zum Lesen geben
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 h-full bg-background">
        <p className="text-text-secondary">Lade Vokabeln...</p>
      </div>
    );
  }

  if (sessionCompleted || vokabeln.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 h-full p-6 text-center">
        <div className="p-6 mb-6 rounded-full bg-success-light">
          <CheckCircle2 size={60} className="text-success" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-text-main">
          {sessionCompleted ? 'Session beendet!' : 'Alles gelernt!'}
        </h2>
        <p className="max-w-sm mb-8 text-text-secondary">
          {sessionCompleted 
            ? 'Du hast alle Vokabeln für heute durchgearbeitet. Komm morgen wieder!'
            : 'Alle Vokabeln sind im Archiv oder du hast noch keine hinzugefügt.'}
        </p>
        {(sessionCompleted || vokabeln.length === 0) && (
          <button 
            onClick={loadVokabeln}
            className="px-8 py-4 font-bold text-white transition-colors shadow-md bg-primary rounded-2xl hover:bg-primary/90"
          >
            {vokabeln.length === 0 ? 'Aktualisieren' : 'Nochmal starten'}
          </button>
        )}
      </div>
    );
  }

  const current = vokabeln[currentIndex];

  return (
    <div className="flex flex-col flex-1 w-full h-full max-w-2xl p-4 pb-24 mx-auto md:p-8 mb-[80px]">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <GraduationCap size={24} className="text-primary" />
          <h1 className="text-lg font-bold text-primary">Lernen</h1>
        </div>
        <div className="px-4 py-1 border rounded-full border-border bg-surface">
          <p className="text-sm font-medium text-text-secondary">{currentIndex + 1} / {vokabeln.length}</p>
        </div>
      </div>

      <div className="flex flex-col items-center p-10 mb-8 text-center border shadow-sm border-border-light bg-surface rounded-3xl">
        <span className="mb-2 text-xs font-bold tracking-widest uppercase text-text-muted">Deutsch</span>
        <h2 className="text-4xl font-bold text-text-main">{current.german}</h2>
        
        <div className="flex gap-2 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "w-4 h-4 rounded-full border",
                current.status > i ? "bg-primary border-primary" : "bg-transparent border-primary-light"
              )}
            />
          ))}
        </div>
      </div>

      <form onSubmit={handleCheck} className="flex flex-col flex-1">
        <label className="mb-2 ml-1 text-sm font-medium text-text-main">Spanische Übersetzung</label>
        <div className="flex items-center gap-3">
          <input
            autoFocus
            className={cn(
              "flex-1 bg-surface border p-4 rounded-2xl text-xl shadow-sm focus:outline-none focus:ring-2 transition-all",
              isCorrect === true ? "border-success text-success bg-success-light" : 
              isCorrect === false ? "border-error text-error bg-error-light" : 
              "border-border text-text-main focus:ring-primary/20"
            )}
            placeholder={isListening ? "Escuchando..." : "Escribe aquí..."}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={isCorrect !== null || isListening}
            autoComplete="off"
          />
          
          <button 
            type="button"
            onClick={handleMicPress}
            className={cn(
              "p-4 rounded-2xl shadow-sm transition-colors",
              isListening ? "bg-error text-white" : "bg-primary-light text-primary hover:bg-primary-light/80"
            )}
          >
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
        </div>
        
        <div className="h-8 mt-3 text-center">
          {isCorrect === false && (
            <p className="font-medium text-error">Falsch! Richtig wäre: {current.spanish}</p>
          )}
          {isCorrect === true && (
            <p className="font-medium text-success">
              {wasTooSoon ? 'Richtig! (Status unverändert - 12h Regel)' : 'Sehr gut! +1 Status'}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!answer || isCorrect !== null || isListening}
          className="flex items-center justify-center gap-2 p-4 mt-auto mb-6 font-bold text-white transition-colors shadow-md bg-primary rounded-2xl hover:bg-primary/90 disabled:opacity-50 disabled:bg-text-muted"
        >
          <span>Prüfen</span>
          <ArrowRight size={20} />
        </button>
      </form>
    </div>
  );
}
