import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { X, Lock, CheckCircle, AlertCircle } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { Colors, Spacing, Shadows } from '../constants/Theme';

export default function PasswordModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError('Die neuen Passwörter stimmen nicht überein.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });

      if (signInError) {
        throw new Error('Das alte Passwort ist nicht korrekt.');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContainer}
            >
              <View style={styles.modalContent}>
                <TouchableOpacity 
                  onPress={onClose}
                  style={styles.closeButton}
                >
                  <X size={20} color={Colors.textSecondary} />
                </TouchableOpacity>

                <View style={styles.header}>
                  <View style={styles.iconContainer}>
                    <Lock size={24} color={Colors.primary} />
                  </View>
                  <Text style={styles.modalTitle}>Passwort ändern</Text>
                </View>

                {success ? (
                  <View style={styles.successContainer}>
                    <View style={styles.successIconCircle}>
                      <CheckCircle size={40} color={Colors.success} />
                    </View>
                    <Text style={styles.successText}>Passwort erfolgreich geändert!</Text>
                  </View>
                ) : (
                  <View style={styles.form}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Altes Passwort</Text>
                      <TextInput
                        style={styles.input}
                        secureTextEntry
                        placeholder="••••••••"
                        value={oldPassword}
                        onChangeText={setOldPassword}
                      />
                    </View>

                    <View style={[styles.inputGroup, styles.borderTop]}>
                      <Text style={styles.label}>Neues Passwort</Text>
                      <TextInput
                        style={styles.input}
                        secureTextEntry
                        placeholder="••••••••"
                        value={newPassword}
                        onChangeText={setNewPassword}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Neues Passwort bestätigen</Text>
                      <TextInput
                        style={styles.input}
                        secureTextEntry
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                      />
                    </View>

                    {error ? (
                      <View style={styles.errorContainer}>
                        <AlertCircle size={16} color={Colors.error} />
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    ) : null}

                    <TouchableOpacity
                      onPress={handleSubmit}
                      disabled={loading}
                      style={[styles.submitButton, loading && styles.buttonDisabled]}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <Text style={styles.submitButtonText}>Passwort aktualisieren</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 32,
    padding: Spacing.xl,
    ...Shadows.md,
  },
  closeButton: {
    position: 'absolute',
    right: 24,
    top: 24,
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.borderLight,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primaryLight + '40',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textMain,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    backgroundColor: Colors.successLight,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  successText: {
    color: Colors.success,
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
  form: {
    gap: Spacing.md,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textMain,
    marginLeft: 4,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: Colors.textMain,
  },
  borderTop: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.errorLight,
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.5,
  }
});
