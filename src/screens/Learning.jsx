import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getVocabulary, updateVocabularyStatus } from '../store/vocabularyStore';
import { updateStudyStats, getUserStats, calculateStatsFromVocabulary } from '../store/userStore';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { CheckCircle2, BookOpen, ArrowRight, Mic, MicOff, AlertCircle, Volume2, Flame, GraduationCap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useUiLanguage } from '../context/UiLanguageContext';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function Learning() {
  const { strings: UI_STRINGS } = useUiLanguage();
  const { LEARNING, COMMON } = UI_STRINGS;
  const navigate = useNavigate();
  const { selectedLanguage, availableLanguages, addLanguage, changeLanguage, loading: isLangLoading } = useLanguage();
  const [vokabeln, setVokabeln] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [wasTooSoon, setWasTooSoon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [error, setError] = useState('');
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [stats, setStats] = useState(getUserStats());
  const [info, setInfo] = useState(null);
  const [pendingUpdate, setPendingUpdate] = useState(false);
  const [isArchiveMode, setIsArchiveMode] = useState(false);
  const [disableTooSoon, setDisableTooSoon] = useState(false);
  const inputRef = useRef(null);
  
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
  const [isSupported, setIsSupported] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognition = useRef(null);

  const loadVokabeln = useCallback(async (archive = false) => {
    if (!selectedLanguage) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setIsArchiveMode(archive);
    const all = await getVocabulary(selectedLanguage);
    
    let toLearn = [];
    if (archive) {
      // Archiv-Modus: Zufällige 20 gelerne Vokabeln (Status 5)
      toLearn = all
        .filter(v => v.status === 5)
        .sort(() => Math.random() - 0.5)
        .slice(0, 20);
    } else {
      // Normaler Modus: Alles unter Status 5
      toLearn = all
        .filter(v => v.status < 5)
        .sort((a, b) => a.status - b.status);
    }
    
    setVokabeln(toLearn);
    
    // Stats aus den Vokabeln berechnen
    setStats(calculateStatsFromVocabulary(all));

    // Superadmin Einstellungen laden
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('disable_too_soon')
        .eq('id', user.id)
        .maybeSingle();
      if (profile) {
        setDisableTooSoon(profile.disable_too_soon);
      }
    }
    
    setCurrentIndex(0);
    setIsCorrect(null);
    setAnswer('');
    setSessionCompleted(false);
    setWrongAnswers([]);
    setLoading(false);
  }, [selectedLanguage]);

  useEffect(() => {
    loadVokabeln();
    
    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognition.current = new SpeechRecognition();
      recognition.current.lang = selectedLanguage === 'es' ? 'es-ES' : selectedLanguage === 'en' ? 'en-US' : 'de-DE'; // Basic mapping
      recognition.current.interimResults = false;
      recognition.current.continuous = false;

      recognition.current.onstart = () => setIsListening(true);
      recognition.current.onend = () => setIsListening(false);
      const normalizeTranscript = (text) => {
        return text.charAt(0).toLowerCase() + text.slice(1);
      };

      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          if (transcript) setAnswer(normalizeTranscript(transcript));
        }
      };
      recognition.current.onerror = (event) => {
        console.error(LEARNING.MIC_ERROR, event.error);
        setIsListening(false);
        // Fallback: Wenn Fehler (z.B. no-speech), Modus nicht hart beenden
      };
    }
  }, [loadVokabeln, selectedLanguage, LEARNING.MIC_ERROR]);

  useEffect(() => {
    if (isCorrect === null && !loading && !sessionCompleted && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, isCorrect, loading, sessionCompleted]);

  useEffect(() => {
    if (info) {
      const timer = setTimeout(() => setInfo(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [info]);

  // Automatischer Start des Mikrofons
  useEffect(() => {
    if (isMicEnabled && isCorrect === null && !loading && !sessionCompleted && recognition.current && !isListening) {
      try {
        recognition.current.start();
      } catch {
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
      setError(LEARNING.MIC_ERROR);
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
      // Play success sound
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        const playTone = (freq, time, duration) => {
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(freq, time); 
          gainNode.gain.setValueAtTime(0.1, time);
          gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
          oscillator.start(time);
          oscillator.stop(time + duration);
        };

        if (current.status === 4 && !wasTooSoon) {
          // Triple tone for learned
          playTone(440, audioCtx.currentTime, 0.1);
          playTone(554.37, audioCtx.currentTime + 0.15, 0.1);
          playTone(659.25, audioCtx.currentTime + 0.3, 0.15);
        } else {
          // Single tone for correct
          playTone(440, audioCtx.currentTime, 0.1);
        }
      } catch (e) {
        console.error('Audio play failed:', e);
      }
    } else {
      setWrongAnswers(prev => [...prev, current]);
    }

    setIsCorrect(correct);
    
    let isLearned = false;

    // Datenbank im Hintergrund aktualisieren
    if (correct) {
      setPendingUpdate(true);
    }
    
    try {
      const { updated, tooSoon } = await updateVocabularyStatus(current.id, correct);
      
      // Sync mit Backend-Ergebnis (berücksichtigt disableTooSoon automatisch)
      setWasTooSoon(tooSoon); 
      
      // Lokal aktualisieren für Animation und Stats
      if (updated) {
        setVokabeln(prev => prev.map(v => v.id === current.id ? updated : v));

        if (correct) {
          setStats(updateStudyStats());
        }

        // Eine Vokabel gilt NUR als gelernt, wenn sie Status 5 erreicht hat
        if (updated.status === 5) {
          isLearned = true;
        }
      }
    } catch (err) {
      console.error(LEARNING.UPDATE_FAILED, err);
    } finally {
      setPendingUpdate(false);
    }
    
    setTimeout(() => {
      if (currentIndex < vokabeln.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setAnswer('');
        setIsCorrect(null);
        setWasTooSoon(false);
      } else {
        setSessionCompleted(true);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#41A8BF', '#26A653', '#ffffff']
        });
      }
    }, isLearned ? 1500 : 2000); 
  };

  if (loading || isLangLoading) {
    return (
      <div className="flex items-center justify-center flex-1 h-full bg-background">
        <p className="text-text-secondary">{LEARNING.LOADING_VOKABELN}</p>
      </div>
    );
  }

  if (sessionCompleted || vokabeln.length === 0 || !selectedLanguage) {
    if ((vokabeln.length === 0 || !selectedLanguage) && !sessionCompleted) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 h-full p-6 text-center">
          <div className="p-6 mb-8 rounded-full bg-primary/10 animate-bounce-in">
            <BookOpen size={60} className="text-primary" />
          </div>
          <h2 className="mb-4 text-3xl font-black text-text-main">{LEARNING.ONBOARDING_TITLE}</h2>
          <p className="max-w-sm mb-10 text-text-secondary">
            {LEARNING.ONBOARDING_SUBTITLE}
          </p>

          <div className="grid w-full max-w-md grid-cols-2 gap-4">
            {COMMON.PREDEFINED_LANGUAGES.map((lang) => {
              const isAdded = availableLanguages.some(al => al.code === lang.code);
              return (
                <button
                  key={lang.code}
                  onClick={async () => {
                    if (!isAdded) {
                      await addLanguage(lang);
                    }
                    await changeLanguage(lang.code);
                    navigate('/overview');
                  }}
                  className="flex flex-col items-center gap-3 p-6 transition-all border shadow-sm bg-surface border-border-light rounded-[32px] hover:border-primary/50 hover:shadow-md active:scale-95"
                >
                  <span className="text-4xl">{lang.flag}</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-text-main">{lang.name}</span>
                    <span className="text-[10px] uppercase tracking-widest text-text-muted">{lang.code}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center flex-1 h-full py-6 overflow-hidden text-center">
        <div className="flex flex-col items-center px-6 mb-8">
          <div className="p-6 mb-6 rounded-full bg-success-light animate-bounce-in">
            <CheckCircle2 size={60} className="text-success" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-text-main">
            {sessionCompleted ? LEARNING.SESSION_COMPLETED : LEARNING.ALL_LEARNED}
          </h2>
          <p className="max-w-sm mb-8 text-text-secondary">
            {sessionCompleted 
              ? LEARNING.SESSION_STATS(vokabeln.length, wrongAnswers.length)
              : LEARNING.EMPTY_STATE}
          </p>
          
          <div className="flex flex-col w-full max-w-xs gap-3">
            <button 
              onClick={() => loadVokabeln(false)}
              className="px-8 py-4 font-bold text-white transition-colors shadow-md bg-primary rounded-2xl hover:bg-primary/90"
            >
              {vokabeln.length === 0 ? LEARNING.REFRESH : LEARNING.NEW_SESSION}
            </button>
            
            <button
              onClick={() => loadVokabeln(true)}
              className="mt-8 text-sm font-medium transition-colors text-text-secondary hover:text-primary"
            >
              {LEARNING.ARCHIVE_REPEAT}
            </button>
          </div>
        </div>

        {sessionCompleted && wrongAnswers.length > 0 && (
          <div className="flex flex-col items-center w-full mt-4">
            <div className="flex items-center self-start gap-2 px-6 mb-4 md:self-center">
              <AlertCircle size={20} className="text-error" />
              <h3 className="text-sm font-bold tracking-wider uppercase text-text-main">{LEARNING.ERRORS_OVERVIEW}</h3>
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
                    <span className="text-[10px] font-bold tracking-widest uppercase text-text-muted mb-1 block">{COMMON.DEUTSCH}</span>
                    <p className="mb-4 text-xl font-bold text-text-main">{item.german}</p>
                    
                    <div className="pt-4 border-t border-border-light">
                      <span className="text-[10px] font-bold tracking-widest uppercase text-success mb-1 block">{LEARNING.RIGHT_ANSWER}</span>
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
    <div className="flex flex-col flex-1 w-full h-full max-w-2xl p-4 pb-32 mx-auto md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-8 h-8 text-primary" />
          <h1 className="hidden text-xl font-bold text-primary sm:block">
            {isArchiveMode ? UI_STRINGS.LEARNING.TITLE_ARCHIVE : UI_STRINGS.LEARNING.TITLE}
          </h1>
          {isArchiveMode && (
            <div className="px-2 py-0.5 rounded-full bg-success/10 border border-success/20">
              <span className="text-[10px] font-bold text-success uppercase">{UI_STRINGS.OVERVIEW.ARCHIVE_TAG}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <button 
            onClick={() => setInfo({ title: UI_STRINGS.LEARNING.STREAK_INFO_TITLE, text: UI_STRINGS.LEARNING.STREAK_INFO_TEXT })}
            className="flex items-center gap-1 px-3 py-1.5 text-orange-600 transition-transform border border-orange-100 rounded-full bg-orange-50 active:scale-95 shadow-sm"
          >
            <Flame size={16} fill="currentColor" />
            <span className="text-sm font-bold">{stats.streak}</span>
          </button>
        </div>
      </div>

      {info && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-sm animate-bounce-in">
          <div className="p-4 text-white border shadow-xl bg-text-main rounded-2xl border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Flame size={16} className="text-orange-400" fill="currentColor" />
              <span className="text-xs font-bold tracking-widest uppercase opacity-70">{info.title}</span>
            </div>
            <p className="text-sm font-medium">{info.text}</p>
          </div>
        </div>
      )}

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
          className={cn(
            "relative flex flex-col items-center p-10 text-center border shadow-sm border-border-light bg-surface rounded-3xl animate-slide-in-top",
            current.status === 5 && isCorrect === true && "animate-fly-away animate-learned-success"
          )}
        >
          <div className="absolute px-3 py-1 border rounded-full top-4 right-4 border-border-light bg-background/50">
            <p className="text-[10px] font-bold text-text-muted">{currentIndex + 1} / {vokabeln.length}</p>
          </div>
          <span className="mb-2 text-xs font-bold tracking-widest uppercase text-text-muted">{UI_STRINGS.COMMON.DEUTSCH}</span>
          <h2 className="text-4xl font-bold text-text-main">{current.german}</h2>
          
          {isCorrect === false && (
            <div className="w-full pt-6 mt-6 border-t border-border-light animate-bounce-in">
              <span className="mb-2 text-xs font-bold tracking-widest uppercase text-error">{UI_STRINGS.LEARNING.RIGHT_ANSWER}</span>
              <h3 className="text-3xl font-bold text-error">{current.spanish}</h3>
            </div>
          )}

          {current.status < 5 && (
            <div className="flex gap-2 mt-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "w-4 h-4 rounded-full border transition-all duration-500",
                    current.status >= i ? "bg-primary border-primary" : "bg-transparent border-primary-light",
                    current.status === i && isCorrect === true && !wasTooSoon && !pendingUpdate && "animate-status-pop"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleCheck} className="flex flex-col flex-1">
        <label className="mb-2 ml-1 text-sm font-medium text-text-main">{UI_STRINGS.COMMON.FOREIGN_LANG}</label>
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            autoFocus
            className={cn(
              "flex-1 bg-surface border p-4 rounded-2xl text-xl shadow-sm focus:outline-none focus:ring-2 transition-all",
              isCorrect === true ? "border-success text-success bg-success-light" : 
              isCorrect === false ? "border-error text-error bg-error-light" : 
              "border-border text-text-main focus:ring-primary/20"
            )}
            placeholder={isListening ? UI_STRINGS.LEARNING.LISTENING_PLACEHOLDER : UI_STRINGS.LEARNING.INPUT_PLACEHOLDER}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={isCorrect !== null}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
          />
          
          { isCorrect === null && (
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
          )}
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
                {wasTooSoon ? UI_STRINGS.LEARNING.TOO_SOON_MSG : UI_STRINGS.LEARNING.STATUS_UP_MSG}
              </p>
            </div>
          )}
        

        <button
          type="submit"
          disabled={isCorrect !== null}
          className="flex items-center justify-center gap-2 p-4 mt-8 mb-6 font-bold text-white transition-colors shadow-md bg-primary rounded-2xl hover:bg-primary/90 disabled:opacity-50 disabled:bg-text-muted"
        >
          <span>{!answer && isCorrect === null ? UI_STRINGS.LEARNING.DONT_KNOW_BUTTON : UI_STRINGS.LEARNING.CHECK_BUTTON}</span>
          <ArrowRight size={20} />
        </button>
      </form>
    </div>
  );
}
