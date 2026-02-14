import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList,  
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  getVocabulary, 
  deleteVocabularyItem, 
  addVocabularyItem, 
  updateVocabularyItem 
} from '../store/vocabularyStore';
import { BookOpen, Plus, Search, X, Edit2, Trash2, AlertCircle, PlusCircle } from 'lucide-react-native';
import { Colors, Spacing, Shadows } from '../constants/Theme';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

export default function Overview() {
  const [vokabeln, setVokabeln] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Form State
  const [german, setGerman] = useState('');
  const [spanish, setSpanish] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  const loadVokabeln = useCallback(async () => {
    const all = await getVocabulary();
    setVokabeln(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadVokabeln();
  }, [loadVokabeln]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setGerman('');
    setSpanish('');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setGerman(item.german);
    setSpanish(item.spanish);
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    setError('');
    if (!german.trim() || !spanish.trim()) {
      setError('Bitte beide Felder ausfüllen');
      return;
    }

    setFormLoading(true);
    try {
      if (editingItem) {
        await updateVocabularyItem(editingItem.id, german.trim(), spanish.trim());
      } else {
        await addVocabularyItem(german.trim(), spanish.trim());
      }
      setIsModalOpen(false);
      loadVokabeln();
    } catch (e) {
      setError('Konnte Vokabel nicht speichern');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePress = (id) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      try {
        await deleteVocabularyItem(itemToDelete);
        loadVokabeln();
        setIsDeleteModalOpen(false);
      } catch (e) {
        setError('Konnte Vokabel nicht löschen');
      }
    }
  };

  const filteredData = vokabeln.filter(item => 
    item.german.toLowerCase().includes(search.toLowerCase()) || 
    item.spanish.toLowerCase().includes(search.toLowerCase())
  );

  const activeVokabeln = filteredData.filter(item => item.status < 5);
  const archivedVokabeln = filteredData.filter(item => item.status === 5);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => handleOpenEdit(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardGerman}>{item.german}</Text>
        <Text style={styles.cardSpanish}>{item.spanish}</Text>
        
        <View style={styles.statusRow}>
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                item.status > i ? styles.dotActive : styles.dotInactive
              ]}
            />
          ))}
          {item.status === 5 && (
            <View style={styles.archiveBadge}>
              <Text style={styles.archiveText}>ARCHIV</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.cardActions}>
        <TouchableOpacity 
          onPress={() => handleOpenEdit(item)}
          style={styles.editButton}
        >
          <Edit2 size={18} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handleDeletePress(item.id)}
          style={styles.deleteButton}
        >
          <Trash2 size={18} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <BookOpen size={24} color={Colors.primary} />
                <Text style={styles.headerTitle}>Übersicht</Text>
              </View>
            </View>

            <View style={styles.searchContainer}>
              <Search size={20} color={Colors.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Suchen..."
                value={search}
                onChangeText={setSearch}
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </>
        }
        data={[
          ...activeVokabeln.map(item => ({ ...item, type: 'active' })),
          ...(archivedVokabeln.length > 0 ? [{ id: 'archive-header', type: 'header' }] : []),
          ...archivedVokabeln.map(item => ({ ...item, type: 'archived' }))
        ]}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return <Text style={styles.sectionHeader}>Archiv</Text>;
          }
          return renderItem({ item });
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Keine Vokabeln gefunden</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={handleOpenAdd}>
        <Plus size={32} color="#FFF" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsModalOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalContainer}
              >
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      {editingItem ? 'Vokabel bearbeiten' : 'Neue Vokabel'}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => setIsModalOpen(false)}
                      style={styles.closeButton}
                    >
                      <X size={24} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  {error ? (
                    <View style={styles.errorContainer}>
                      <AlertCircle size={20} color={Colors.error} />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Deutsch</Text>
                    <TextInput
                      style={styles.textArea}
                      multiline
                      numberOfLines={3}
                      placeholder="z.B. Apfel"
                      value={german}
                      onChangeText={setGerman}
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Spanisch</Text>
                    <TextInput
                      style={styles.textArea}
                      multiline
                      numberOfLines={3}
                      placeholder="z.B. manzana"
                      value={spanish}
                      onChangeText={setSpanish}
                      textAlignVertical="top"
                    />
                  </View>

                  <TouchableOpacity 
                    style={[styles.submitButton, formLoading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={formLoading}
                  >
                    {formLoading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <PlusCircle size={24} color="#FFF" />
                        <Text style={styles.submitButtonText}>
                          {editingItem ? 'Speichern' : 'Hinzufügen'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <DeleteConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textMain,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: 100,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 32,
    padding: Spacing.lg,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.md,
  },
  cardContent: {
    flex: 1,
  },
  cardGerman: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textMain,
  },
  cardSpanish: {
    fontSize: 15,
    fontStyle: 'italic',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
  archiveBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  archiveText: {
    color: Colors.success,
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  editButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
  },
  deleteButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: Colors.error + '15',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: Colors.primary,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: Spacing.xl,
    paddingTop: Spacing.xl,
    height: Dimensions.get('window').height * 0.75,
    ...Shadows.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textMain,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.borderLight,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMain,
    marginBottom: 8,
    marginLeft: 4,
  },
  textArea: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 16,
    fontSize: 18,
    color: Colors.textMain,
    minHeight: 100,
  },
  submitButton: {
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
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.error + '15',
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
  }
});

import { Dimensions } from 'react-native';
