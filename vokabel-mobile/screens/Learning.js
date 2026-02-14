import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getVocabulary, updateVocabularyStatus } from '../store/vocabularyStore';
import { 
  CheckCircle2, 
  GraduationCap, 
  ArrowRight, 
  Mic, 
  MicOff, 
  Volume2 
} from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { Colors, Spacing, Shadows } from '../constants/Theme';

// Safe Import of Native Module
let useSpeechRecognitionEvent;
let SpeechRecognition;
try {
  const SpeechModule = require('expo-speech-recognition');
  useSpeechRecognitionEvent = SpeechModule.useSpeechRecognitionEvent;
  SpeechRecognition = SpeechModule.SpeechRecognition;
} catch (e) {
  console.log("Speech Recognition native module not available");
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
  
  const [isListening, setIsListening] = useState(false);

  // Speech Recognition Events
  if (useSpeechRecognitionEvent) {
    useSpeechRecognitionEvent('start', () => setIsListening(true));
    useSpeechRecognitionEvent('end', () => setIsListening(false));
    useSpeechRecognitionEvent('result', (event) => {
      if (event.results[0]?.transcript) {
        setAnswer(event.results[0].transcript);
      }
    });
    useSpeechRecognitionEvent('error', (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    });
  }

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
  }, [loadVokabeln]);

  const handleMicPress = async () => {
    if (!SpeechRecognition) {
      setError('Spracherkennung benötigt einen Development Build.');
      return;
    }

    if (isListening) {
      SpeechRecognition.stop();
    } else {
      const result = await SpeechRecognition.requestPermissionsAsync();
      if (!result.granted) {
        setError('Mikrofon-Berechtigung verweigert.');
        return;
      }
      SpeechRecognition.start({ lang: 'es-ES' });
    }
  };

  const handleSpeak = (text) => {
    Speech.speak(text, { language: 'es-ES' });
  };

  const handleCheck = async () => {
    if (isCorrect !== null) return;
    if (isListening && SpeechRecognition) SpeechRecognition.stop();

    const current = vokabeln[currentIndex];
    const correct = answer.trim().toLowerCase() === current.spanish.trim().toLowerCase();
    
    if (!correct) {
      setWrongAnswers(prev => [...prev, current]);
    }

    setIsCorrect(correct);
    
    try {
      const { updated, tooSoon } = await updateVocabularyStatus(current.id, correct);
      setWasTooSoon(tooSoon);
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
    }, 2000);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Lade Vokabeln...</Text>
      </View>
    );
  }

  if (sessionCompleted || vokabeln.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <View style={styles.successIconContainer}>
            <CheckCircle2 size={60} color={Colors.success} />
          </View>
          <Text style={styles.title}>
            {sessionCompleted ? 'Session beendet!' : 'Alles gelernt!'}
          </Text>
          <Text style={styles.subtitle}>
            {sessionCompleted 
              ? `Du hast ${vokabeln.length} Vokabeln gelernt.${wrongAnswers.length > 0 ? ` Dabei gab es ${wrongAnswers.length} Fehler.` : ''}`
              : 'Alle Vokabeln sind im Archiv.'}
          </Text>
          
          <TouchableOpacity 
            onPress={loadVokabeln}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>
              {vokabeln.length === 0 ? 'Aktualisieren' : 'Neue Session'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const current = vokabeln[currentIndex];
  const remainingCount = vokabeln.length - currentIndex - 1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <GraduationCap size={28} color={Colors.primary} />
          <Text style={styles.headerTitle}>Lernen</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{currentIndex + 1} / {vokabeln.length}</Text>
        </View>
      </View>

      <View style={styles.stackWrapper}>
        {/* Card Stack Background Layers */}
        {[1, 2, 3, 4].reverse().map((i) => {
          if (i > remainingCount) return null;
          return (
            <View 
              key={`stack-${i}`}
              style={[
                styles.cardStackLayer,
                { 
                  top: i * -8,
                  transform: [{ scale: 1 - i * 0.04 }],
                  opacity: 1 - i * 0.2,
                  zIndex: -i
                }
              ]}
            />
          );
        })}

        {/* Current Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Deutsch</Text>
            <TouchableOpacity onPress={() => handleSpeak(current.spanish)}>
              <Volume2 size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={styles.germanText}>{current.german}</Text>
          
          {isCorrect === false && (
            <View style={styles.solutionContainer}>
              <Text style={styles.solutionLabel}>Lösung</Text>
              <Text style={styles.spanishText}>{current.spanish}</Text>
            </View>
          )}

          <View style={styles.statusDots}>
            {[1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  current.status > i ? styles.dotActive : styles.dotInactive
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Spanische Übersetzung</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              isCorrect === true && styles.inputSuccess,
              isCorrect === false && styles.inputError
            ]}
            placeholder={isListening ? "Höre zu..." : "Hier schreiben..."}
            value={answer}
            onChangeText={setAnswer}
            editable={isCorrect === null}
            autoCapitalize="none"
          />
          
          <TouchableOpacity 
            style={[styles.micButton, isListening && styles.micButtonActive]}
            onPress={handleMicPress}
          >
            {isListening ? <MicOff size={24} color="#FFF" /> : <Mic size={24} color={Colors.primary} />}
          </TouchableOpacity>
        </View>

        {(isCorrect === true || error) && (
          <View style={styles.feedbackContainer}>
            {isCorrect === true && (
              <Text style={styles.feedbackSuccess}>
                {wasTooSoon ? 'Richtig! (kein +1 Status wegen 12h Regel)' : 'Sehr gut! +1 Status'}
              </Text>
            )}
            {error && (
              <Text style={styles.feedbackError}>{error}</Text>
            )}
          </View>
        )}

        <TouchableOpacity
          onPress={handleCheck}
          disabled={isCorrect !== null}
          style={[styles.checkButton, isCorrect !== null && styles.buttonDisabled]}
        >
          <Text style={styles.checkButtonText}>
            {!answer && isCorrect === null ? 'Ich weiß es nicht' : 'Prüfen'}
          </Text>
          <ArrowRight size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  loadingText: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  badge: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  stackWrapper: {
    position: 'relative',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,

  },
  cardStackLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 32,
    ...Shadows.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 32,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.sm,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  germanText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.textMain,
    textAlign: 'center',
  },
  solutionContainer: {
    width: '100%',
    paddingTop: Spacing.lg,
    marginTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    alignItems: 'center',
  },
  solutionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.error,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  spanishText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.error,
  },
  statusDots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.xl,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dotInactive: {
    backgroundColor: 'transparent',
    borderColor: Colors.primaryLight,
  },
  inputSection: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textMain,
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 16,
    fontSize: 20,
    color: Colors.textMain,
    ...Shadows.sm,
  },
  inputSuccess: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
    color: Colors.success,
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
    color: Colors.error,
  },
  micButton: {
    backgroundColor: Colors.primaryLight,
    padding: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonActive: {
    backgroundColor: Colors.error,
  },
  checkButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    marginTop: Spacing.xl,
    gap: 8,
    ...Shadows.md,
  },
  checkButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.textMuted,
  },
  feedbackContainer: {
    marginTop: 12,
    minHeight: 20,
  },
  feedbackSuccess: {
    textAlign: 'center',
    color: Colors.success,
    fontWeight: '500',
  },
  feedbackError: {
    textAlign: 'center',
    color: Colors.error,
    fontSize: 12,
  },
  successIconContainer: {
    backgroundColor: Colors.successLight,
    padding: 24,
    borderRadius: 60,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textMain,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 300,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    ...Shadows.md,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
