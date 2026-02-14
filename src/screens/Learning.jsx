import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getVocabulary, updateVocabularyStatus } from '../store/vocabularyStore';
import { CheckCircle2, GraduationCap, ArrowRight, Mic, MicOff, AlertCircle, Volume2 } from 'lucide-react';
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
  const [error, setError] = useState('');
  const [wrongAnswers, setWrongAnswers] = useState([]);
  
  // Carousel Drag State
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };
  
  // Speech Recognition State
  const [isMicEnabled, setIsMicEnabled] = useState(false);
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
    setWrongAnswers([]);
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
        // Fallback: Wenn Fehler (z.B. no-speech), Modus nicht hart beenden
      };
    }
  }, [loadVokabeln]);

  // Automatischer Start des Mikrofons
  useEffect(() => {
    if (isMicEnabled && isCorrect === null && !loading && !sessionCompleted && recognition.current && !isListening) {
      try {
        recognition.current.start();
      } catch (e) {
        // Bereits gestartet
      }
    }
    
    // Stoppen wenn eine Antwort geprüft wird
    if (isCorrect !== null && isListening && recognition.current) {
      recognition.current.stop();
    }
  }, [currentIndex, isMicEnabled, isCorrect, loading, sessionCompleted, isListening]);

  const handleMicPress = () => {
    setError('');
    if (!recognition.current) {
      setError('Spracherkennung wird in diesem Browser nicht unterstützt.');
      return;
    }

    setIsMicEnabled(!isMicEnabled);
  };

  const handleCheck = async (e) => {
    if (e) e.preventDefault();
    if (isCorrect !== null) return;

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
    } else {
      setWrongAnswers(prev => [...prev, current]);
    }

    setIsCorrect(correct);
    
    // Datenbank im Hintergrund aktualisieren
    try {
      const { updated, tooSoon } = await updateVocabularyStatus(current.id, correct);
      setWasTooSoon(tooSoon); // Sync mit Server-Ergebnis
      
      // Lokal aktualisieren für Animation
      if (updated) {
        setVokabeln(prev => prev.map(v => v.id === current.id ? updated : v));
      }
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
      <div className="flex flex-col items-center justify-center flex-1 h-full py-6 overflow-hidden text-center">
        <div className="flex flex-col items-center px-6 mb-8">
          <div className="p-6 mb-6 rounded-full bg-success-light animate-bounce-in">
            <CheckCircle2 size={60} className="text-success" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-text-main">
            {sessionCompleted ? 'Session beendet!' : 'Alles gelernt!'}
          </h2>
          <p className="max-w-sm mb-8 text-text-secondary">
            {sessionCompleted 
              ? `Du hast ${vokabeln.length} Vokabeln gelernt.${wrongAnswers.length > 0 ? ` Dabei gab es ${wrongAnswers.length} Fehler.` : ''}`
              : 'Alle Vokabeln sind im Archiv oder du hast noch keine hinzugefügt.'}
          </p>
          
          <div className="flex flex-col w-full max-w-xs gap-3">
            <button 
              onClick={loadVokabeln}
              className="px-8 py-4 font-bold text-white transition-colors shadow-md bg-primary rounded-2xl hover:bg-primary/90"
            >
              {vokabeln.length === 0 ? 'Aktualisieren' : 'Neue Session'}
            </button>
          </div>
        </div>

        {sessionCompleted && wrongAnswers.length > 0 && (
          <div className="flex flex-col items-center w-full mt-4">
            <div className="flex items-center self-start gap-2 px-6 mb-4 md:self-center">
              <AlertCircle size={20} className="text-error" />
              <h3 className="text-sm font-bold tracking-wider uppercase text-text-main">Deine Fehler im Überblick</h3>
            </div>
            
            <div 
              ref={scrollRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              className={cn(
                "w-full overflow-x-auto snap-x snap-mandatory no-scrollbar cursor-grab select-none",
                isDragging && "cursor-grabbing active:snap-none"
              )}
            >
              <div className="flex justify-center min-w-full gap-4 px-6 pb-8 w-max">
                {wrongAnswers.map((item, idx) => (
                  <div 
                    key={`wrong-${idx}`}
                    className="flex-shrink-0 w-[280px] p-6 bg-surface border border-error-light rounded-[32px] shadow-sm snap-center text-left animate-fade-in-up"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <span className="text-[10px] font-bold tracking-widest uppercase text-text-muted mb-1 block">Deutsch</span>
                    <p className="mb-4 text-xl font-bold text-text-main">{item.german}</p>
                    
                    <div className="pt-4 border-t border-border-light">
                      <span className="text-[10px] font-bold tracking-widest uppercase text-success mb-1 block">Richtig wäre</span>
                      <p className="text-2xl font-bold text-success">{item.spanish}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const current = vokabeln[currentIndex];

  return (
    <div className="flex flex-col w-full max-w-2xl p-4 pb-24 mx-auto md:p-8 ">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <GraduationCap size={24} className="text-primary" />
          <h1 className="text-lg font-bold text-primary">Lernen</h1>
        </div>
        <div className="px-4 py-1 border rounded-full border-border bg-surface">
          <p className="text-sm font-medium text-text-secondary">{currentIndex + 1} / {vokabeln.length}</p>
        </div>
      </div>

      <div className="relative pt-1 mb-8">
        {/* Stapel-Effekt (Hintergrundkarten) */}
        {[1, 2, 3, 4].map((i) => {
          const remaining = vokabeln.length - currentIndex - 1;
          if (i > remaining) return null;
          
          return (
            <div 
              key={`stack-${i}`}
              className="card-stack-layer"
              style={{ 
                top: `${(i * -8)}px`, // Karten nach oben versetzt
                transform: `scale(${1 - i * 0.04})`,
                opacity: 1 - i * 0.2,
                zIndex: -i
              }}
            />
          );
        })}
        
        <div 
          key={currentIndex}
          className="relative flex flex-col items-center p-10 text-center border shadow-sm border-border-light bg-surface rounded-3xl animate-slide-in-top"
        >
          <span className="mb-2 text-xs font-bold tracking-widest uppercase text-text-muted">Deutsch</span>
          <h2 className="text-4xl font-bold text-text-main">{current.german}</h2>
          
          {isCorrect === false && (
            <div className="w-full pt-6 mt-6 border-t border-border-light animate-bounce-in">
              <span className="mb-2 text-xs font-bold tracking-widest uppercase text-error">Lösung</span>
              <h3 className="text-3xl font-bold text-error">{current.spanish}</h3>
            </div>
          )}

          <div className="flex gap-2 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  "w-4 h-4 rounded-full border transition-all duration-500",
                  current.status > i ? "bg-primary border-primary" : "bg-transparent border-primary-light",
                  current.status === i + 1 && isCorrect === true && !wasTooSoon && "animate-status-pop"
                )}
              />
            ))}
          </div>
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
            placeholder={isListening ? "Höre zu..." : "Hier schreiben..."}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={isCorrect !== null}
            autoComplete="off"
          />
          
          <button 
            type="button"
            onClick={handleMicPress}
            className={cn(
              "p-4 rounded-2xl shadow-sm transition-all",
              isMicEnabled ? "bg-error text-white scale-110" : "bg-primary-light text-primary hover:bg-primary-light/80"
            )}
          >
            {isMicEnabled ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
        </div>
        
        {error && (
          <div className="flex items-center gap-2 p-3 mt-4 bg-error/10 text-error rounded-xl">
            <AlertCircle size={18} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        
        
          {isCorrect === true && (
            <div className="h-8 mt-3 text-center">
              <p className="font-medium text-success">
                {wasTooSoon ? 'Richtig! (Status unverändert - 12h Regel)' : 'Sehr gut! +1 Status'}
              </p>
            </div>
          )}
        

        <button
          type="submit"
          disabled={isCorrect !== null}
          className="flex items-center justify-center gap-2 p-4 mt-8 mb-6 font-bold text-white transition-colors shadow-md bg-primary rounded-2xl hover:bg-primary/90 disabled:opacity-50 disabled:bg-text-muted"
        >
          <span>{!answer && isCorrect === null ? 'Ich weiß es nicht' : 'Prüfen'}</span>
          <ArrowRight size={20} />
        </button>
      </form>
    </div>
  );
}
