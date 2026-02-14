import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  TouchableWithoutFeedback 
} from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { Colors, Spacing, Shadows } from '../constants/Theme';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm }) {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.iconContainer}>
                <AlertCircle size={32} color={Colors.error} />
              </View>
              
              <Text style={styles.title}>Vokabel löschen?</Text>
              <Text style={styles.message}>
                Möchtest du diese Vokabel wirklich dauerhaft aus deiner Liste entfernen?
              </Text>

              <View style={styles.footer}>
                <TouchableOpacity 
                  onPress={onClose}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Abbrechen</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={onConfirm}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>Löschen</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 32,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...Shadows.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: Colors.errorLight,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textMain,
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  deleteButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.error,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
