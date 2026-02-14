import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { getVocabulary } from '../store/vocabularyStore';
import { 
  User, 
  Mail, 
  Lock, 
  LogOut, 
  BarChart3, 
  Save, 
  CheckCircle, 
  ChevronRight 
} from 'lucide-react-native';
import { Colors, Spacing, Shadows } from '../constants/Theme';
import PasswordModal from '../components/PasswordModal';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, learned: 0, inProgress: 0 });

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUserData();
    fetchStats();
  }, []);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      setFullName(user.user_metadata?.full_name || '');
      setEmail(user.email || '');
    }
  };

  const fetchStats = async () => {
    const all = await getVocabulary();
    setStats({
      total: all.length,
      learned: all.filter(v => v.status === 5).length,
      inProgress: all.filter(v => v.status < 5 && v.status > 0).length,
    });
    setLoading(false);
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const updates = {
        data: { full_name: fullName }
      };

      if (email !== user.email) {
        updates.email = email;
      }

      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;

      setMessage({ type: 'success', text: 'Profil erfolgreich aktualisiert!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={ styles.scrollContent }>
          <View style={styles.header}>
            <User size={24} color={Colors.primary} />
            <Text style={styles.headerTitle}>Profil & Einstellungen</Text>
          </View>

          {/* Statistik Card */}
          <View style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <BarChart3 size={20} color={Colors.primary} />
              <Text style={styles.statsTitle}>Statistik</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={[styles.statsItem, { backgroundColor: Colors.primary + '10' }]}>
                <Text style={[styles.statsValue, { color: Colors.primary }]}>{stats.total}</Text>
                <Text style={styles.statsLabel}>Gesamt</Text>
              </View>
              <View style={[styles.statsItem, { backgroundColor: Colors.success + '10' }]}>
                <Text style={[styles.statsValue, { color: Colors.success }]}>{stats.learned}</Text>
                <Text style={styles.statsLabel}>Gelernt</Text>
              </View>
              <View style={[styles.statsItem, { backgroundColor: Colors.textSecondary + '10' }]}>
                <Text style={[styles.statsValue, { color: Colors.textSecondary }]}>{stats.inProgress}</Text>
                <Text style={styles.statsLabel}>Offen</Text>
              </View>
            </View>
          </View>

          {/* Profile Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <View style={styles.inputWrapper}>
                <User size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Dein Name"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-Mail</Text>
              <View style={styles.inputWrapper}>
                <Mail size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="deine@email.de"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setIsPasswordModalOpen(true)}
              style={styles.passwordButton}
            >
              <View style={styles.passwordButtonLeft}>
                <View style={styles.lockIconContainer}>
                  <Lock size={18} color={Colors.primary} />
                </View>
                <Text style={styles.passwordButtonText}>Passwort ändern</Text>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            {message.text && (
              <View style={[
                styles.messageContainer,
                message.type === 'success' ? styles.messageSuccess : styles.messageError
              ]}>
                {message.type === 'success' && <CheckCircle size={20} color={Colors.success} />}
                <Text style={[
                  styles.messageText,
                  message.type === 'success' ? { color: Colors.success } : { color: Colors.error }
                ]}>
                  {message.text}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleUpdateProfile}
              disabled={saving}
              style={[styles.saveButton, saving && styles.buttonDisabled]}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Save size={20} color="#FFF" />
                  <Text style={styles.saveButtonText}>Änderungen speichern</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            <LogOut size={20} color={Colors.error} />
            <Text style={styles.logoutButtonText}>Abmelden</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <PasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statsCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 32,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textMain,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statsItem: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 20,
    alignItems: 'center',
  },
  statsValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statsLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  form: {
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMain,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    ...Shadows.sm,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.textMain,
  },
  passwordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 16,
    marginTop: Spacing.sm,
    ...Shadows.sm,
  },
  passwordButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lockIconContainer: {
    padding: 8,
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
  },
  passwordButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textMain,
  },
  messageContainer: {
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  messageSuccess: {
    backgroundColor: Colors.success + '15',
  },
  messageError: {
    backgroundColor: Colors.error + '15',
  },
  messageText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    gap: 10,
    marginTop: Spacing.md,
    ...Shadows.md,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 18,
    borderRadius: 20,
    backgroundColor: Colors.error + '15',
    marginTop: Spacing.xxl,
  },
  logoutButtonText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: 'bold',
  }
});
