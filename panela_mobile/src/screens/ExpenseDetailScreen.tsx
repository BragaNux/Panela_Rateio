import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import Button from '../components/Button';
import { colors } from '../constants/colors';
import { api } from '../services/api';
import { useToast } from '../hooks/useToastSimple';

export default function ExpenseDetailScreen(){
  const route = useRoute();
  const navigation = useNavigation();
  const { expense, finalizado } = route.params as any;
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { showToast, ToastContainer } = useToast();
  useEffect(() => {}, []);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <LinearGradient colors={["#059669", "#10b981"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>Detalhe da Despesa</Text>
      </LinearGradient>
      <View style={{ padding: 16 }}>
        <ToastContainer />
        <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.description}>{expense.descricao}</Text>
              <Text style={styles.amount}>R$ {Number(expense.valor).toFixed(2)}</Text>
            </View>
            <View style={styles.footer}>
              <Text style={styles.detail}>Pago por: {expense.pagadorNome}</Text>
              <Text style={styles.detail}>Data: {new Date(expense.data).toLocaleDateString('pt-BR')}</Text>
              <Text style={styles.detail}>Participantes: {expense.participantesCount}</Text>
            </View>
          </View>
        <View style={{ flexDirection:'row', gap: 12, marginTop: 12 }}>
          <Button title="Voltar" onPress={() => (navigation as any).goBack()} />
          {!finalizado && (
            <TouchableOpacity onPress={() => setShowDeleteDialog(true)} style={{ backgroundColor:'#ef4444', paddingVertical:12, paddingHorizontal:16, borderRadius:12 }}>
              <Text style={{ color:'#fff', fontWeight:'700' }}>{deleting ? 'Removendo...' : 'Excluir'}</Text>
            </TouchableOpacity>
          )}
      </View>
      <Modal visible={showDeleteDialog} transparent animationType="fade" onRequestClose={() => setShowDeleteDialog(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text.primary, marginBottom: 12 }}>Remover despesa</Text>
            <Text style={{ color: colors.text.secondary, marginBottom: 16 }}>Deseja remover esta despesa? Esta ação não pode ser desfeita.</Text>
            <View style={{ flexDirection:'row', justifyContent:'flex-end', gap: 12 }}>
              <TouchableOpacity onPress={() => setShowDeleteDialog(false)} style={{ paddingVertical:12, paddingHorizontal:16, borderWidth:1, borderColor:'#d1d5db', borderRadius:12 }}>
                <Text style={{ color: colors.text.primary, fontWeight:'600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={async () => {
                try {
                  setDeleting(true);
                  await api.delete(`/expenses/${expense.id}`);
                  setShowDeleteDialog(false);
                  showToast('Despesa removida', 'success');
                  (navigation as any).goBack();
                } catch (err) {
                  showToast('Erro ao remover despesa', 'error');
                } finally {
                  setDeleting(false);
                }
              }} style={{ paddingVertical:12, paddingHorizontal:16, backgroundColor:'#ef4444', borderRadius:12 }}>
                <Text style={{ color:'#fff', fontWeight:'700' }}>{deleting ? 'Removendo...' : 'Remover'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  description: { fontSize: 16, fontWeight: '700', color: colors.text.primary, flex: 1, marginRight: 8 },
  amount: { fontSize: 16, fontWeight: '700', color: colors.secondary.main },
  footer: { marginTop: 8 },
  detail: { fontSize: 14, color: colors.text.secondary, marginTop: 4 },
});

 
