import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getVocabulary, updateVocabularyStatus } from '../store/vocabularyStore';
import { updateStudyStats, getUserStats, calculateStatsFromVocabulary } from '../store/userStore';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { CheckCircle2, BookOpen, ArrowRight, Mic, MicOff, AlertCircle, Volume2, Flame, GraduationCap, X, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useUiLanguage } from '../context/UiLanguageContext';
import { STORAGE_KEYS } from '../lib/storage';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function Learning() {
  const { strings: UI_STRINGS } = useUiLanguage();
  const { LEARNING, COMMON } = UI_STRINGS;
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedLanguage, availableLanguages, addLanguage, changeLanguage, loading: isLangLoading } = useLanguage();
  const selectedLanguageName = availableLanguages.find(l => l.code === selectedLanguage)?.name || COMMON.FOREIGN_LANG;
  const [user, setUser] = useState(null);
  const [vokabeln, setVokabeln] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [infinitiveAnswer, setInfinitiveAnswer] = useState('');
  const [verbAnswers, setVerbAnswers] = useState({
    yo: '',
    tu: '',
    el: '',
    nosotros: '',
    vosotros: '',
    ellos: ''
  });
  const [isCorrect, setIsCorrect] = useState(null);
  const [accentWarning, setAccentWarning] = useState(false);
  const [isNextDisabled, setIsNextDisabled] = useState(false);
  const [wasTooSoon, setWasTooSoon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [error, setError] = useState('');
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [sessionFinishedCount, setSessionFinishedCount] = useState(0);
  const [learnedThisSession, setLearnedThisSession] = useState([]); // IDs von Wörtern die in dieser Session Status 5 erreicht haben
  const [stats, setStats] = useState({ streak: 0, lastStudyDate: null, studyHistory: [] });
  const [info, setInfo] = useState(null);
  const [pendingUpdate, setPendingUpdate] = useState(false);
  const [isArchiveMode, setIsArchiveMode] = useState(false);
  const [disableTooSoon, setDisableTooSoon] = useState(false);
  const [autoProceed, setAutoProceed] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTO_PROCEED);
    return saved !== null ? saved === 'true' : true;
  });
  const [nextLanguageToLearn, setNextLanguageToLearn] = useState(null);
  const inputRef = useRef(null);
  const mainScrollRef = useRef(null);
  const submitButtonRef = useRef(null);

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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognition = useRef(null);
  const audioRef = useRef(null);

  const handleSpeak = async (text) => {
    if (!text || isSpeaking) return;
    setIsSpeaking(true);
    setError('');

    try {
      const apiKey = import.meta.env.VITE_HYPEREAL_KEY;
      if (!apiKey) {
        throw new Error('API Key missing');
      }

      const response = await fetch('https://api.hypereal.cloud/api/v1/audio/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'minimax-speech-02',
          input: {
            text: text,
            format: 'mp3'
          }
        }),
      });

      const data = await response.json();
      
      if (data.outputUrl || (data.data && data.data[0] && data.data[0].url)) {
        const url = data.outputUrl || data.data[0].url;
        if (audioRef.current) {
          audioRef.current.pause();
        }
        audioRef.current = new Audio(url);
        audioRef.current.onended = () => setIsSpeaking(false);
        audioRef.current.play();
      } else {
        throw new Error('No audio URL received');
      }
    } catch (err) {
      console.error('Speech error:', err);
      setError('Fehler bei der Sprachausgabe');
      setIsSpeaking(false);
    }
  };

  // Fetch current user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        setStats(getUserStats(user.id));
      }
    });
  }, []);

  // Check for next available language to learn today
  useEffect(() => {
    async function checkNextLanguage() {
      if (sessionCompleted && user && availableLanguages.length > 1) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // Find other languages
        const otherLangs = availableLanguages.filter(l => l.code !== selectedLanguage);
        
        for (const lang of otherLangs) {
          // Check if this language has words left to learn (status < 5)
          const { data: wordsLeft, error: countError } = await supabase
            .from('vocabulary')
            .select('id')
            .eq('user_id', user.id)
            .eq('language', lang.code)
            .lt('status', 5)
            .limit(1);

          if (!countError && wordsLeft && wordsLeft.length > 0) {
            // Check if this language has already been studied today
            const { data: studiedToday, error: studyError } = await supabase
              .from('vocabulary')
              .select('id')
              .eq('user_id', user.id)
              .eq('language', lang.code)
              .gte('lastReviewed', todayStart.toISOString())
              .limit(1);

            if (!studyError && (!studiedToday || studiedToday.length === 0)) {
              // Found a language that has words to learn and wasn't studied today
              setNextLanguageToLearn(lang);
              break;
            }
          }
        }
      }
    }
    checkNextLanguage();
  }, [sessionCompleted, user, availableLanguages, selectedLanguage]);

  const getSessionKey = useCallback(() => {
    if (!selectedLanguage || !user) return null;
    return `${STORAGE_KEYS.LEARNING_SESSION(selectedLanguage)}_${user.id}`;
  }, [selectedLanguage, user]);

  const loadVokabeln = useCallback(async (archive = false, ignoreSaved = false, archiveMode = 'random', lang = selectedLanguage) => {
    if (!lang) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setVokabeln([]); // Vokabeln leeren um Stale-Daten zu vermeiden
    setWrongAnswers([]);
    setSessionFinishedCount(0);
    setLearnedThisSession([]);

    const { data: { user } } = await supabase.auth.getUser();
    const sessionKey = user ? `${STORAGE_KEYS.LEARNING_SESSION(lang)}_${user.id}` : null;

    if (!ignoreSaved && sessionKey) {
      const saved = localStorage.getItem(sessionKey);
      if (saved) {
        try {
          const { 
            vokabeln: savedVokabeln, 
            currentIndex: savedIndex, 
            isArchiveMode: savedArchive, 
            wrongAnswers: savedWrong, 
            sessionFinishedCount: savedFinished,
            learnedThisSession: savedLearned,
            timestamp: savedTimestamp
          } = JSON.parse(saved);

          // Session nur wiederherstellen, wenn sie jünger als 12 Stunden ist
          const isRecentlyStarted = savedTimestamp && (Date.now() - savedTimestamp < 12 * 60 * 60 * 1000);

          if (isRecentlyStarted && savedVokabeln && savedVokabeln.length > 0 && savedIndex < savedVokabeln.length) {
            // Validierung: Passt die gespeicherte Session zur gewählten Sprache?
            if (savedVokabeln[0].language === lang) {
              setVokabeln(savedVokabeln);
              setCurrentIndex(savedIndex);
              setIsArchiveMode(savedArchive);
              setWrongAnswers(savedWrong || []);
              setSessionFinishedCount(savedFinished || 0);
              setLearnedThisSession(savedLearned || []);
              
              const all = await getVocabulary(lang);
              setStats(calculateStatsFromVocabulary(all));
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.error("Failed to restore session", e);
        }
      }
    }

    setIsArchiveMode(archive);
    const all = await getVocabulary(lang);
    
    let toLearn = [];
    if (archive) {
      // Archiv-Modus: Filtered by status 5
      const archived = all.filter(v => v.status === 5);
      
      if (archiveMode === 'last50') {
        toLearn = archived
          .sort((a, b) => new Date(b.lastReviewed || b.created_at) - new Date(a.lastReviewed || a.created_at))
          .slice(0, 50);
      } else if (archiveMode === 'all') {
        toLearn = archived
          .sort(() => Math.random() - 0.5)
          .slice(0, 100); // Limit to 100 for performance
      } else {
        // Default: random 20
        toLearn = archived
          .sort(() => Math.random() - 0.5)
          .slice(0, 20);
      }
    } else {
      // Normaler Modus: Alles unter Status 5
      toLearn = all
        .filter(v => v.status < 5)
        .sort((a, b) => a.status - b.status);
    }
    
    setVokabeln(toLearn);
    
    // Stats aus den Vokabeln berechnen
    setStats(calculateStatsFromVocabulary(all));

    // Einstellungen laden
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('disable_too_soon')
        .eq('id', user.id)
        .maybeSingle();
      if (profile) {
        setDisableTooSoon(profile.disable_too_soon || false);
      }
    }
    
    setCurrentIndex(0);
    setIsCorrect(null);
    setAccentWarning(false);
    setAnswer('');
    setSessionCompleted(false);
    setWrongAnswers([]);
    setSessionFinishedCount(0);
    setLearnedThisSession([]);
    setLoading(false);
  }, [selectedLanguage]);

  // Save session state
  useEffect(() => {
    const sessionKey = getSessionKey();
    if (vokabeln.length > 0 && !sessionCompleted && !loading && sessionKey) {
      // Sicherstellen, dass wir keine Session speichern, deren Vokabeln nicht zur aktuellen Sprache passen
      if (vokabeln[0].language === selectedLanguage) {
        localStorage.setItem(sessionKey, JSON.stringify({
          vokabeln,
          currentIndex,
          isArchiveMode,
          wrongAnswers,
          sessionFinishedCount,
          learnedThisSession,
          timestamp: JSON.parse(localStorage.getItem(sessionKey))?.timestamp || Date.now()
        }));
      }
    }
  }, [vokabeln, currentIndex, isArchiveMode, wrongAnswers, sessionFinishedCount, learnedThisSession, sessionCompleted, loading, getSessionKey, selectedLanguage]);

  // Clear session state
  useEffect(() => {
    const sessionKey = getSessionKey();
    if (sessionCompleted && sessionKey) {
      localStorage.removeItem(sessionKey);
    }
  }, [sessionCompleted, getSessionKey]);

  useEffect(() => {
    if (selectedLanguage) {
      const isArchiveFromState = location.state?.archive;
      const archiveModeFromState = location.state?.archiveMode || 'random';
      
      if (isArchiveFromState) {
        loadVokabeln(true, true, archiveModeFromState, selectedLanguage);
        navigate(location.pathname, { replace: true, state: {} });
      } else {
        loadVokabeln(false, false, 'random', selectedLanguage);
      }
    }
  }, [selectedLanguage, loadVokabeln]);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognition.current = new SpeechRecognition();
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
  }, [selectedLanguage, LEARNING.MIC_ERROR]);

  // Update recognition language based on current word direction
  useEffect(() => {
    if (recognition.current && vokabeln.length > 0) {
      const current = vokabeln[currentIndex];
      if (!current) return;
      
      let isVerb = false;
      try {
        const parsed = JSON.parse(current.spanish);
        isVerb = !!(parsed && parsed.isVerb);
      } catch (e) {}
      
      const isPassive = !isVerb && current.status < 2;
      
      if (isPassive) {
        recognition.current.lang = 'de-DE';
      } else {
        const langMap = {
          es: 'es-ES',
          en: 'en-US',
          fr: 'fr-FR',
          it: 'it-IT',
          pt: 'pt-PT',
          ru: 'ru-RU',
          tr: 'tr-TR',
          pl: 'pl-PL',
          nl: 'nl-NL'
        };
        recognition.current.lang = langMap[selectedLanguage] || 'en-US';
      }
    }
  }, [currentIndex, vokabeln, selectedLanguage]);

  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto'
      });
    }
  }, [currentIndex, sessionCompleted]);

  useEffect(() => {
    if (isCorrect !== null && submitButtonRef.current) {
      submitButtonRef.current.focus({ preventScroll: true });
    }
  }, [isCorrect]);

  useEffect(() => {
    if (isCorrect === null && !loading && !sessionCompleted && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, [currentIndex, isCorrect, loading, sessionCompleted]);

  useEffect(() => {
    if (vokabeln.length > 0 && !sessionCompleted && !loading) {
      const current = vokabeln[currentIndex];
      let isVerb = false;
      try {
        const parsed = JSON.parse(current.spanish);
        isVerb = !!(parsed && parsed.isVerb);
      } catch (e) {}

      if (isVerb) {
        setIsNextDisabled(true);
        const timer = setTimeout(() => {
          setIsNextDisabled(false);
        }, 2000);
        return () => clearTimeout(timer);
      } else {
        setIsNextDisabled(false);
      }
    }
  }, [currentIndex, vokabeln, sessionCompleted, loading]);

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
    
    // Stoppen wenn eine Antwort geprüft wird ODER Mikrofon deaktiviert wurde
    if ((isCorrect !== null || !isMicEnabled) && isListening && recognition.current) {
      recognition.current.stop();
    }
  }, [currentIndex, isMicEnabled, isCorrect, loading, sessionCompleted, isListening]);

  const handleMicPress = () => {
    setError('');
    if (!recognition.current) {
      setError(LEARNING.MIC_ERROR);
      return;
    }

    if (isMicEnabled && isListening) {
      recognition.current.stop();
    }

    setIsMicEnabled(!isMicEnabled);
  };

  const getReflexiveLabel = (key) => {
    const map = {
      yo: `${UI_STRINGS.OVERVIEW.YO} me`,
      tu: `${UI_STRINGS.OVERVIEW.TU} te`,
      el: `${UI_STRINGS.OVERVIEW.EL} se`,
      nosotros: `${UI_STRINGS.OVERVIEW.NOSOTROS} nos`,
      vosotros: `${UI_STRINGS.OVERVIEW.VOSOTROS} os`,
      ellos: `${UI_STRINGS.OVERVIEW.ELLOS} se`
    };
    return map[key] || key;
  };

  const normalizeForComparison = (str) => {
    if (!str) return '';
    return str.trim().toLowerCase().replace(/[?¿!¡.,:;]/g, '');
  };

  const normalizeForAccentCheck = (str) => {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[?¿!¡.,:;]/g, '');
  };

  const handleNext = useCallback(() => {
    if (currentIndex < vokabeln.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setAnswer('');
      setInfinitiveAnswer('');
      setVerbAnswers({
        yo: '',
        tu: '',
        el: '',
        nosotros: '',
        vosotros: '',
        ellos: ''
      });
      setIsCorrect(null);
      setAccentWarning(false);
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
  }, [currentIndex, vokabeln.length]);

  const handleCheck = async (e) => {
    if (e) e.preventDefault();
    if (isCorrect !== null) {
      handleNext();
      return;
    }

    const current = vokabeln[currentIndex];
    
    let isVerb = false;
    let parsedVerb = null;
    try {
      parsedVerb = JSON.parse(current.spanish);
      isVerb = !!(parsedVerb && parsedVerb.isVerb);
    } catch (e) {}

    const isPassive = !isVerb && current.status < 2;

    let correct = false;
    let onlyAccentWrong = false;

    if (isVerb) {
      const isInfCorrect = normalizeForComparison(infinitiveAnswer) === normalizeForComparison(parsedVerb.infinitive);
      const areFormsCorrect = Object.keys(parsedVerb.forms).every(key => 
        normalizeForComparison(verbAnswers[key]) === normalizeForComparison(parsedVerb.forms[key])
      );
      correct = isInfCorrect && areFormsCorrect;

      if (!correct) {
        const infMatch = normalizeForAccentCheck(infinitiveAnswer) === normalizeForAccentCheck(parsedVerb.infinitive);
        const formsMatch = Object.keys(parsedVerb.forms).every(key => 
          normalizeForAccentCheck(verbAnswers[key]) === normalizeForAccentCheck(parsedVerb.forms[key])
        );
        if (infMatch && formsMatch) {
          onlyAccentWrong = true;
        }
      }
    } else {
      const target = isPassive ? current.german : current.spanish;
      correct = normalizeForComparison(answer) === normalizeForComparison(target);
      if (!correct && normalizeForAccentCheck(answer) === normalizeForAccentCheck(target)) {
        onlyAccentWrong = true;
      }
    }

    if (onlyAccentWrong && !accentWarning) {
      setAccentWarning(true);
      setInfo({ 
        title: LEARNING.ACCENT_WARNING_TITLE, 
        text: LEARNING.ACCENT_WARNING_TEXT 
      });
      return;
    }
    
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
      setWrongAnswers(prev => [...prev, { 
        item: current, 
        userAnswer: isVerb ? { infinitive: infinitiveAnswer, forms: { ...verbAnswers } } : answer 
      }]);
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
          setStats(updateStudyStats(user?.id));
        }

        // Eine Vokabel gilt NUR als gelernt, wenn sie Status 5 erreicht hat
        // Wir prüfen ob sie es in DIESER Session zum ersten mal erreicht hat
        if (updated.status === 5 && current.status < 5 && !learnedThisSession.includes(current.id)) {
          isLearned = true;
          setSessionFinishedCount(prev => prev + 1);
          setLearnedThisSession(prev => [...prev, current.id]);
        }
      }
    } catch (err) {
      console.error(LEARNING.UPDATE_FAILED, err);
    } finally {
      setPendingUpdate(false);
    }
    
    if (correct && autoProceed) {
      setTimeout(() => {
        handleNext();
      }, isLearned ? 1500 : 1200); 
    }
  };

  if (loading || isLangLoading) {
    return (
      <div className="flex items-center justify-center flex-1 h-full bg-background">
        <p className="text-text-secondary">{LEARNING.LOADING_VOKABELN}</p>
      </div>
    );
  }

  if (sessionCompleted || vokabeln.length === 0 || !selectedLanguage) {
    if ((vokabeln.length === 0 || !selectedLanguage) && !sessionCompleted && !loading && !isLangLoading) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 h-full p-6 text-center">
          <div className="p-6 mb-8 rounded-full bg-primary/10 animate-bounce-in">
            <BookOpen size={64} className="text-primary" />
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
      <div ref={mainScrollRef} className="flex flex-col items-center flex-1 h-full py-10 pb-32 overflow-y-auto text-center no-scrollbar">
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

          {sessionCompleted && (
            <div className="grid w-full max-w-sm grid-cols-3 gap-3 mb-10">
              <div className="bg-surface border border-border-light rounded-[24px] p-4 flex flex-col items-center shadow-sm">
                <span className="text-2xl font-black text-text-main">{vokabeln.length}</span>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{LEARNING.SESSION_STATS_PRACTICED}</span>
              </div>
              {!isArchiveMode && (
                <div className="bg-surface border border-border-light rounded-[24px] p-4 flex flex-col items-center shadow-sm">
                  <span className="text-2xl font-black text-success">{sessionFinishedCount}</span>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{LEARNING.SESSION_STATS_FINISHED}</span>
                </div>
              )}
              <div className={cn(
                  "bg-surface border border-border-light rounded-[24px] p-4 flex flex-col items-center shadow-sm",
                  isArchiveMode && "col-span-2"
                )}>
                <span className="text-2xl font-black text-primary">{vokabeln.length - wrongAnswers.length}</span>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{LEARNING.SESSION_STATS_KNOWN}</span>
              </div>
            </div>
          )}
          
          <div className="flex flex-col w-full max-w-xs gap-3">
            <button 
              onClick={() => loadVokabeln(false, true, 'random', selectedLanguage)}
              className="px-8 py-4 font-bold text-white transition-colors shadow-md bg-primary rounded-2xl hover:bg-primary/90"
            >
              {vokabeln.length === 0 ? LEARNING.REFRESH : LEARNING.NEW_SESSION}
            </button>

            {nextLanguageToLearn && (
              <button
                onClick={async () => {
                  await changeLanguage(nextLanguageToLearn.code);
                  loadVokabeln(false, true, 'random', nextLanguageToLearn.code);
                  setSessionCompleted(false);
                  setNextLanguageToLearn(null);
                }}
                className="flex items-center justify-center gap-3 px-8 py-4 font-bold transition-all border shadow-sm text-primary border-primary/20 bg-primary/5 rounded-2xl hover:bg-primary/10 active:scale-95"
              >
                <span className="text-2xl">{nextLanguageToLearn.flag}</span>
                <span>{LEARNING.NEXT_LANGUAGE(nextLanguageToLearn.name)}</span>
                <ArrowRight size={20} />
              </button>
            )}

            {vokabeln.length === 0 && !loading && (
              <button
                onClick={() => loadVokabeln(true, true, 'random', selectedLanguage)}
                className="mt-8 text-sm font-medium transition-colors text-text-secondary hover:text-primary"
              >
                {LEARNING.ARCHIVE_REPEAT}
              </button>
            )}
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
                {wrongAnswers.map((wrong, idx) => {
                  const item = wrong.item;
                  const userAnswer = wrong.userAnswer;
                  let isVerb = false;
                  let parsed = null;
                  try {
                    parsed = JSON.parse(item.spanish);
                    isVerb = !!(parsed && parsed.isVerb);
                  } catch (e) {}

                  return (
                    <div 
                      key={`wrong-${idx}`}
                      className="flex-shrink-0 w-[340px] md:w-[380px] p-6 bg-surface border border-error-light rounded-[32px] shadow-sm snap-center text-left animate-fade-in-up"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      <span className="text-[10px] font-black tracking-widest uppercase text-text-muted mb-1 block">{COMMON.DEUTSCH}</span>
                      <p className="mb-4 text-xl font-bold leading-tight break-word text-text-main">{item.german}</p>
                      
                      {!isVerb ? (
                        <div className="space-y-4">
                          <div className="pt-3 border-t border-border-light">
                            <span className="text-[10px] font-bold tracking-widest uppercase text-error mb-1 block">{LEARNING.USER_ANSWER}</span>
                            <p className="text-lg font-bold line-through break-word text-error/70 opacity-70">{userAnswer || '---'}</p>
                          </div>
                          <div className="pt-1">
                            <span className="text-[10px] font-bold tracking-widest uppercase text-success mb-1 block">{LEARNING.RIGHT_ANSWER}</span>
                            <p className="text-2xl font-black break-word text-success">{item.spanish}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-3 space-y-4 border-t border-border-light">
                          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            {/* Infinitiv Header */}
                            <div className="col-span-2 pb-2 border-b border-border-light/50">
                               <span className="text-[10px] font-bold tracking-widest uppercase text-text-muted mb-1 block">{UI_STRINGS.OVERVIEW.INFINITIVE_LABEL}</span>
                               <div className="flex items-center gap-2">
                                 <span className="text-sm font-bold line-through break-word text-error opacity-60">{userAnswer.infinitive || '---'}</span>
                                 <ArrowRight size={12} className="text-text-muted shrink-0" />
                                 <span className="text-base font-black break-word text-success">{parsed.infinitive}</span>
                               </div>
                            </div>

                            {Object.entries(parsed.forms).map(([key, correctValue]) => {
                              const userVal = userAnswer.forms[key];
                              const isMatch = userVal?.trim().toLowerCase() === correctValue?.trim().toLowerCase();
                              return (
                                <div key={key} className="flex flex-col min-w-0">
                                  <span className="text-[9px] font-bold tracking-widest uppercase text-text-muted mb-1 truncate">
                                    {parsed.isReflexive ? getReflexiveLabel(key) : UI_STRINGS.OVERVIEW[key.toUpperCase()]}
                                  </span>
                                  <div className="flex flex-col p-2 border rounded-lg bg-slate-50/50 border-border-light/30">
                                    {!isMatch && (
                                      <span className="text-[11px] font-bold text-error line-through opacity-60 mb-1 break-word">
                                        {userVal || '---'}
                                      </span>
                                    )}
                                    <span className={cn(
                                      "text-sm font-black break-word",
                                      isMatch ? "text-text-main opacity-30" : "text-success"
                                    )}>{correctValue}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const current = vokabeln[currentIndex] || { german: '', spanish: '', status: 0 };
  let isVerb = false;
  try {
    const parsed = JSON.parse(current.spanish);
    isVerb = !!(parsed && parsed.isVerb);
  } catch (e) {}

  const isPassive = !isVerb && current.status < 2;

  return (
    <div className="flex flex-col flex-1 w-full h-full max-w-2xl mx-auto overflow-hidden pt-[env(safe-area-inset-top)]">
      <form onSubmit={handleCheck} className="flex flex-col flex-1 overflow-hidden">
        <div ref={mainScrollRef} className="flex-1 p-4 pb-32 overflow-y-auto no-scrollbar md:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-primary" />
              <h1 className="hidden text-xl font-bold text-primary sm:block">
                {isArchiveMode ? UI_STRINGS.LEARNING.TITLE_ARCHIVE : UI_STRINGS.LEARNING.TITLE}
              </h1>
              {isArchiveMode && (
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => loadVokabeln(false, true, 'random', selectedLanguage)}
                    className="flex items-center gap-1 px-2 py-1 transition-colors border rounded-lg bg-slate-100 hover:bg-slate-200 text-text-muted border-slate-200"
                    title={UI_STRINGS.COMMON.CLOSE}
                  >
                    <X size={12} />
                    <span className="text-[10px] font-bold uppercase">{UI_STRINGS.COMMON.CLOSE}</span>
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <button 
                type="button"
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
              key={current.id}
              className={cn(
                "relative flex flex-col items-center p-10 text-center border shadow-sm border-border-light bg-surface rounded-3xl animate-slide-in-top",
                current.status === 5 && isCorrect === true && "animate-fly-away animate-learned-success",
                loading && "opacity-50 animate-pulse"
              )}
            >
            {!loading && (
             <>
              <div className="absolute flex items-center gap-4 top-4 left-6 right-4">
                {current.status < 5 && (
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-2 h-2 rounded-full border transition-all duration-500",
                          current.status >= i ? "bg-primary border-primary" : "bg-transparent border-primary-light",
                          current.status === i && isCorrect === true && !wasTooSoon && !pendingUpdate && "animate-status-pop"
                        )}
                      />
                    ))}
                  </div>
                )}
                <div className="px-3 py-1 ml-auto border rounded-full border-border-light bg-background/50">
                  <p className="text-[10px] font-bold text-text-muted">{currentIndex + 1} / {vokabeln.length}</p>
                </div>
              </div>
              <span className="mb-2 text-xs font-bold tracking-widest uppercase text-text-muted">
                {isPassive ? selectedLanguageName : UI_STRINGS.COMMON.DEUTSCH}
              </span>
              <div className="flex items-center justify-center gap-3">
                <h2 className="text-4xl font-bold text-text-main break-word">
                  {isPassive ? (
                    (() => {
                      try {
                        const parsed = JSON.parse(current.spanish);
                        return parsed.infinitive || current.spanish;
                      } catch (e) {
                        return current.spanish;
                      }
                    })()
                  ) : current.german}
                </h2>
                {isPassive && (
                  <button
                    onClick={() => {
                      let textToSpeak = current.spanish;
                      try {
                        const parsed = JSON.parse(current.spanish);
                        textToSpeak = parsed.infinitive || current.spanish;
                      } catch (e) {}
                      handleSpeak(textToSpeak);
                    }}
                    disabled={isSpeaking}
                    className="p-2 transition-all rounded-full hover:bg-primary/10 text-primary active:scale-95 disabled:opacity-50"
                  >
                    {isSpeaking ? <Loader2 size={24} className="animate-spin" /> : <Volume2 size={24} />}
                  </button>
                )}
              </div>
              
              {current.sentence && isCorrect !== null && (
                <p className="max-w-xs mt-4 text-sm italic font-medium text-center text-text-secondary/60 animate-fade-in">
                  "{current.sentence}"
                </p>
              )}
              
              {isCorrect === false && (
                <div className="w-full pt-6 mt-6 border-t border-border-light animate-bounce-in">
                  {(() => {
                    try {
                      const parsed = JSON.parse(current.spanish);
                      if (parsed && parsed.isVerb) {
                        return (
                          <div className="space-y-4">
                            <span className="mb-2 text-xs font-bold tracking-widest uppercase text-error">{UI_STRINGS.LEARNING.RIGHT_ANSWER}</span>
                            <div className="relative p-3 text-left border rounded-lg bg-error/5 border-error/10">
                              <span className="text-[10px] uppercase font-bold text-error/60 block">{UI_STRINGS.OVERVIEW.CONJUGATED_LABEL}</span>
                              {(infinitiveAnswer || '').trim().toLowerCase() !== (parsed.infinitive || '').trim().toLowerCase() && (
                                <div className="break-word">
                                  <span className="block mb-1 text-sm font-bold line-through text-error/60">{infinitiveAnswer || '---'}</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between gap-2 break-word">
                                <span className="text-lg font-bold text-error">{parsed.infinitive}</span>
                                {!isPassive && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSpeak(parsed.infinitive);
                                    }}
                                    disabled={isSpeaking}
                                    className="p-1 transition-all rounded-full hover:bg-error/10 text-error active:scale-95 disabled:opacity-50"
                                  >
                                    {isSpeaking ? <Loader2 size={16} className="animate-spin" /> : <Volume2 size={16} />}
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(parsed.forms).map(([key, value]) => (
                                <div key={key} className="relative p-2 text-left border rounded-lg bg-error/5 border-error/10">
                                  <span className="text-[10px] uppercase font-bold text-error/60 block">
                                    {parsed.isReflexive ? getReflexiveLabel(key) : UI_STRINGS.OVERVIEW[key.toUpperCase()]}
                                  </span>
                                  {(verbAnswers[key] || '').trim().toLowerCase() !== (value || '').trim().toLowerCase() && (
                                    <div className="break-word">
                                      <span className="text-[11px] font-bold text-error/60 line-through block">{verbAnswers[key] || '---'}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between gap-1 break-word">
                                    <span className="text-sm font-bold text-error">{value}</span>
                                    {!isPassive && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSpeak(value);
                                        }}
                                        className="p-1 transition-all rounded-full hover:bg-error/10 text-error active:scale-90"
                                      >
                                        <Volume2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                    } catch (e) {}
                    return (
                      <>
                        <div className="mb-4 text-left">
                          <span className="mb-1 text-[10px] font-bold tracking-widest uppercase text-error/60 block">{LEARNING.USER_ANSWER}</span>
                          <div className="break-word">
                            <p className="text-lg font-bold line-through text-error/70">{answer || '---'}</p>
                          </div>
                        </div>
                        <span className="mb-2 text-xs font-bold tracking-widest uppercase text-error">{UI_STRINGS.LEARNING.RIGHT_ANSWER}</span>
                        <div className="flex items-center justify-center gap-3 break-word">
                          <h3 className="text-3xl font-bold text-error">{isPassive ? current.german : current.spanish}</h3>
                          {!isPassive && (
                            <button
                              onClick={() => handleSpeak(current.spanish)}
                              disabled={isSpeaking}
                              className="p-2 transition-all rounded-full hover:bg-error/10 text-error active:scale-95 disabled:opacity-50"
                            >
                              {isSpeaking ? <Loader2 size={20} className="animate-spin" /> : <Volume2 size={20} />}
                            </button>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              </>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <label className="mb-2 ml-1 text-sm font-medium text-text-main">
              {isPassive ? UI_STRINGS.COMMON.DEUTSCH : selectedLanguageName}
            </label>
            
            {(() => {
              try {
                const parsed = JSON.parse(current.spanish);
                if (parsed && parsed.isVerb) {
                  return (
                    <div className="mb-4 space-y-4">
                      <div>
                        <span className="block mb-1 ml-1 text-[10px] font-bold tracking-widest uppercase text-text-muted">{UI_STRINGS.OVERVIEW.CONJUGATED_LABEL}</span>
                        {isCorrect === null ? (
                          <input
                            ref={inputRef}
                            className={cn(
                              "w-full bg-surface border p-4 rounded-2xl text-xl shadow-sm focus:outline-none focus:ring-2 transition-all border-border text-text-main focus:ring-primary/20"
                            )}
                            value={infinitiveAnswer}
                            onChange={(e) => setInfinitiveAnswer(e.target.value)}
                            autoComplete="off"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck="false"
                          />
                        ) : (
                          <div className={cn(
                            "w-full bg-surface border p-4 rounded-2xl text-xl shadow-sm transition-all break-word",
                            isCorrect === true ? "border-success text-success bg-success-light" : 
                            isCorrect === false && (infinitiveAnswer || '').trim().toLowerCase() !== (parsed.infinitive || '').trim().toLowerCase() 
                              ? "border-error text-error bg-error-light" : 
                            isCorrect === false && (infinitiveAnswer || '').trim().toLowerCase() === (parsed.infinitive || '').trim().toLowerCase()
                              ? "border-success text-success bg-success-light/30" :
                            "border-border text-text-main"
                          )}>
                            {infinitiveAnswer || '---'}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { key: 'yo', label: parsed.isReflexive ? getReflexiveLabel('yo') : UI_STRINGS.OVERVIEW.YO },
                          { key: 'tu', label: parsed.isReflexive ? getReflexiveLabel('tu') : UI_STRINGS.OVERVIEW.TU },
                          { key: 'el', label: parsed.isReflexive ? getReflexiveLabel('el') : UI_STRINGS.OVERVIEW.EL },
                          { key: 'nosotros', label: parsed.isReflexive ? getReflexiveLabel('nosotros') : UI_STRINGS.OVERVIEW.NOSOTROS },
                          { key: 'vosotros', label: parsed.isReflexive ? getReflexiveLabel('vosotros') : UI_STRINGS.OVERVIEW.VOSOTROS },
                          { key: 'ellos', label: parsed.isReflexive ? getReflexiveLabel('ellos') : UI_STRINGS.OVERVIEW.ELLOS },
                        ].map((f) => (
                          <div key={f.key}>
                            <span className="block mb-1 ml-1 text-[10px] font-bold tracking-widest uppercase text-text-muted">{f.label}</span>
                            {isCorrect === null ? (
                              <input
                                className={cn(
                                  "w-full bg-surface border p-3 rounded-xl text-base shadow-sm focus:outline-none focus:ring-2 transition-all border-border text-text-main focus:ring-primary/20"
                                )}
                                value={verbAnswers[f.key]}
                                onChange={(e) => setVerbAnswers(prev => ({ ...prev, [f.key]: e.target.value }))}
                                autoComplete="off"
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck="false"
                              />
                            ) : (
                              <div className={cn(
                                "w-full bg-surface border p-3 rounded-xl text-base shadow-sm transition-all break-word",
                                isCorrect === true ? "border-success text-success bg-success-light" : 
                                isCorrect === false && (verbAnswers[f.key] || '').trim().toLowerCase() !== (parsed.forms[f.key] || '').trim().toLowerCase() 
                                  ? "border-error text-error bg-error-light" : 
                                isCorrect === false && (verbAnswers[f.key] || '').trim().toLowerCase() === (parsed.forms[f.key] || '').trim().toLowerCase()
                                  ? "border-success text-success bg-success-light/30" :
                                "border-border text-text-main"
                              )}>
                                {verbAnswers[f.key] || '---'}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Submit Button direkt unter den Feldern für Verben */}
                      <div className="mt-6">
                        {isCorrect === true && (
                          <div className="h-6 mb-2 text-center">
                            <p className="text-sm font-bold text-success animate-bounce-in">
                              {wasTooSoon ? UI_STRINGS.LEARNING.TOO_SOON_MSG : UI_STRINGS.LEARNING.STATUS_UP_MSG}
                            </p>
                          </div>
                        )}
                        <button
                          ref={submitButtonRef}
                          type="submit"
                          disabled={isNextDisabled && isCorrect === null}
                          className={cn(
                            "flex items-center justify-center gap-2 w-full p-4 font-black text-white transition-all shadow-lg active:scale-[0.98] rounded-2xl bg-primary hover:bg-primary-dark",
                            isNextDisabled && isCorrect === null && "opacity-50 grayscale"
                          )}
                        >
                          <span className="text-lg">
                            {isCorrect !== null 
                              ? UI_STRINGS.LEARNING.NEXT_BUTTON 
                              : (isNextDisabled ? `...` : (!answer && !infinitiveAnswer ? UI_STRINGS.LEARNING.DONT_KNOW_BUTTON : UI_STRINGS.LEARNING.CHECK_BUTTON))
                            }
                          </span>
                          <ArrowRight size={22} className={cn(isCorrect === null && !isNextDisabled && "animate-pulse")} />
                        </button>
                      </div>
                    </div>
                  );
                }
              } catch (e) {}

              return (
                <div className="flex items-center gap-3">
                  {isCorrect === null ? (
                    <input
                      ref={inputRef}
                      className={cn(
                        "flex-1 bg-surface border p-4 rounded-2xl text-xl shadow-sm focus:outline-none focus:ring-2 transition-all border-border text-text-main focus:ring-primary/20"
                      )}
                      placeholder={isListening ? UI_STRINGS.LEARNING.LISTENING_PLACEHOLDER : UI_STRINGS.LEARNING.INPUT_PLACEHOLDER}
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      autoComplete="off"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                    />
                  ) : (
                    <div className={cn(
                      "flex-1 bg-surface border p-4 rounded-2xl text-xl shadow-sm transition-all break-word",
                      isCorrect === true ? "border-success text-success bg-success-light" : "border-error text-error bg-error-light"
                    )}>
                      {answer || '---'}
                    </div>
                  )}
                  
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
              );
            })()}
            
            {error && (
              <div className="flex items-center gap-2 p-3 mt-4 bg-error/10 text-error rounded-xl">
                <AlertCircle size={18} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
          </div>
          
          {/* Spacer für Abstand zwischen Input und Sticky Button */}
          <div className="h-12 shrink-0" />
        </div>

        {!isVerb && (
          <div className="px-4 pt-6 pb-4 border-t border-border-light">
            {isCorrect === true && (
              <div className="h-6 mb-2 text-center">
                <p className="text-sm font-bold text-success animate-bounce-in">
                  {wasTooSoon ? UI_STRINGS.LEARNING.TOO_SOON_MSG : UI_STRINGS.LEARNING.STATUS_UP_MSG}
                </p>
              </div>
            )}
            
            <button
              ref={submitButtonRef}
              type="submit"
              disabled={isNextDisabled && isCorrect === null}
              className={cn(
                "flex items-center justify-center gap-2 w-full p-4 font-black text-white transition-all shadow-lg active:scale-[0.98] rounded-2xl bg-primary hover:bg-primary-dark",
                isNextDisabled && isCorrect === null && "opacity-50 grayscale"
              )}
            >
              <span className="text-lg">
                {isCorrect !== null 
                  ? UI_STRINGS.LEARNING.NEXT_BUTTON 
                  : (isNextDisabled ? `...` : (!answer && !infinitiveAnswer ? UI_STRINGS.LEARNING.DONT_KNOW_BUTTON : UI_STRINGS.LEARNING.CHECK_BUTTON))
                }
              </span>
              <ArrowRight size={22} className={cn(isCorrect === null && !isNextDisabled && "animate-pulse")} />
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
