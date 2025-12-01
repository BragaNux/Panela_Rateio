import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBadge } from '../components/StatusBadge';
import Button from '../components/Button';
import { Card } from '../components/Card';
import { api } from '../services/api';
import { API_URL } from '../config/api';
import { colors } from '../constants/colors';
import { formatCurrency } from '../utils/formatters';
import { Users, Plus, DollarSign, Lock, ArrowLeft, Download } from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '../store/auth';
import { useToast } from '../hooks/useToastSimple';
import PanelaLoader from '../components/PanelaLoader';

interface Member {
  id: string;
  nome: string;
  email: string;
  chavePix?: string;
}

interface Expense {
  id: string;
  descricao: string;
  valor: number;
  pagadorId: string;
  pagadorNome: string;
  data: string;
  participantesCount: number;
}

interface Group {
  id: string;
  nome: string;
  descricao?: string;
  finalizado: boolean;
  finalizadoEm?: string;
  membros: string[];
  criadoPor: string;
  criadoEm: string;
}

export default function GroupDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { id } = route.params as { id: string };
  
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [finalizeLoading, setFinalizeLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState(false);
  const { showToast, ToastContainer } = useToast();

  const scrollY = useRef(new Animated.Value(0)).current;
  const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);
  const headerTranslate = scrollY.interpolate({ inputRange: [0, 150], outputRange: [0, -24], extrapolate: 'clamp' });
  const headerScale = scrollY.interpolate({ inputRange: [0, 150], outputRange: [1, 0.98], extrapolate: 'clamp' });

  const loadGroupData = async () => {
    setLoading(true);
    try {
      const [groupRes, membersRes, expensesRes] = await Promise.all([
        api.get(`/groups/${id}`),
        api.get(`/groups/${id}/members`),
        api.get(`/expenses/group/${id}`),
      ]);
      
      setGroup(groupRes.data);
      const mappedMembers: Member[] = (membersRes.data as any[]).map((m: any) => ({ id: m.userId, nome: m.nome, email: m.email, chavePix: m.chavePix }));
      setMembers(mappedMembers);
      const mappedExpenses: Expense[] = expensesRes.data.map((e: any) => ({
        id: e.id,
        descricao: e.descricao,
        valor: e.amount,
        pagadorId: e.payerId,
        pagadorNome: e.pagadorNome,
        data: e.date,
        participantesCount: e.participantesCount ?? 0
      }));
      setExpenses(mappedExpenses);
    } catch (error) {
      console.error('Erro ao carregar dados do grupo:', error);
      showToast('Não foi possível carregar os dados do grupo', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroupData();
  }, [id]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      loadGroupData();
    });
    return unsub;
  }, [navigation, id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroupData();
    setRefreshing(false);
  };

  const handleFinalizeGroup = () => {
    if (expenses.length === 0) {
      showToast('Adicione pelo menos uma despesa antes de finalizar o grupo.', 'warning');
      return;
    }
    setShowFinalizeDialog(true);
  };

  const handleGeneratePdf = async () => {
    try {
      const { token } = useAuthStore.getState();
      const url = `${API_URL}/reports/group/${id}/pdf`;
      const FS: any = FileSystem as any;
      const baseDir = FS.cacheDirectory || FS.documentDirectory || '';
      const fileUri = `${baseDir}relatorio-grupo-${id}.pdf`;

      const headers: any = { Accept: 'application/pdf' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const download = await FileSystem.downloadAsync(url, fileUri, { headers });

      if ((download as any).status && (download as any).status >= 400) {
        throw new Error(`Falha ao baixar PDF (status ${download.status})`);
      }

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(download.uri);
      } else {
        Alert.alert('PDF salvo', `Arquivo: ${download.uri}`);
      }
      showToast('PDF gerado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      const message = (error as any)?.message || 'Erro desconhecido';
      showToast(`Não foi possível gerar o PDF: ${message}`, 'error');
    }
  };

  const handleAiSummary = async () => {
    try {
      setAiLoading(true);
      const res = await api.get(`/ai/group/${id}/summary`, {
        params: { model: 'gemini-3-pro-preview' }
      });
      setAiSummary(res.data?.summary || '');
      showToast('Resumo de IA gerado', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Não foi possível gerar o resumo por IA', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  if (!group) {
    return (
      <View style={styles.loadingContainer}>
        <PanelaLoader />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ToastContainer />
      <AnimatedGradient colors={['#059669', '#16a34a']} style={[styles.header, { transform: [{ translateY: headerTranslate }, { scale: headerScale }] }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={20} color="#ffffff" />
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{group.nome}</Text>
            <Text style={styles.headerSubtitle}>
              {group.finalizado ? 'Grupo Finalizado' : 'Grupo Ativo'}
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            <StatusBadge status={group.finalizado ? 'finalized' : 'active'} />
          </View>
        </View>
      </AnimatedGradient>

      <Animated.ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />
        }
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      >
        {/* Group Info */}
        <Card style={styles.groupInfoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Descrição:</Text>
            <Text style={styles.infoValue}>{group.descricao || 'Sem descrição'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Criado em:</Text>
            <Text style={styles.infoValue}>
              {new Date(group.criadoEm).toLocaleDateString('pt-BR')}
            </Text>
          </View>
          {group.finalizadoEm && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Finalizado em:</Text>
              <Text style={styles.infoValue}>
                {new Date(group.finalizadoEm).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          )}
        </Card>

        {/* Members Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={20} color="#374151" />
            <Text style={styles.sectionTitle}>Membros ({members.length})</Text>
          </View>
          
          {members.map((member) => (
            <Card key={member.id} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {member.nome.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberDetails}>
                  <Text style={styles.memberName}>{member.nome}</Text>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                  {member.chavePix && (
                    <Text style={styles.memberPix}>PIX: {member.chavePix}</Text>
                  )}
                </View>
              </View>
            </Card>
          ))}
          
          {!group.finalizado && (
            <Button
              title="Adicionar Membro"
              onPress={() => navigation.navigate('Membro', { groupId: id })}
              style={styles.addButton}
              icon={<Plus size={20} color="#ffffff" />}
            />
          )}
        </View>

        {/* Expenses Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <DollarSign size={20} color="#374151" />
            <Text style={styles.sectionTitle}>Despesas ({expenses.length})</Text>
          </View>
          
          {expenses.map((expense) => (
            <Swipeable key={expense.id} renderRightActions={() => (
              <View style={styles.swipeActions}>
                <TouchableOpacity style={styles.swipeOpenButton} onPress={() => navigation.navigate('DespesaDetalhe', { expense, finalizado: group.finalizado })}>
                  <Text style={styles.swipeButtonText}>Abrir</Text>
                </TouchableOpacity>
                {!group.finalizado && (
                  <TouchableOpacity style={styles.swipeDeleteButton} onPress={() => { setExpenseToDelete(expense); setShowDeleteDialog(true); }}>
                    <Text style={styles.swipeButtonText}>Excluir</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}>
              <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('DespesaDetalhe', { expense, finalizado: group.finalizado })}>
                  <Card style={styles.expenseCard}>
                    <View style={styles.expenseHeader}>
                      <Text style={styles.expenseDescription}>{expense.descricao}</Text>
                      <Text style={styles.expenseAmount}>R$ {expense.valor.toFixed(2)}</Text>
                    </View>
                    <View style={styles.expenseDetails}>
                      <Text style={styles.expenseDetail}>Pago por: {expense.pagadorNome}</Text>
                      <Text style={styles.expenseDetail}>Data: {new Date(expense.data).toLocaleDateString('pt-BR')}</Text>
                      <Text style={styles.expenseDetail}>Dividido entre {expense.participantesCount} pessoa(s)</Text>
                    </View>
                  </Card>
              </TouchableOpacity>
            </Swipeable>
          ))}

          {!group.finalizado && (
            <Button
              title="Adicionar Despesa"
              onPress={() => navigation.navigate('Despesa', { groupId: id })}
              style={styles.addButton}
              icon={<Plus size={20} color="#ffffff" />}
            />
          )}
        </View>

        {/* Finalize Section */}
        {!group.finalizado && (
          <View style={styles.finalizeSection}>
            <Button
              title="Finalizar Grupo"
              onPress={handleFinalizeGroup}
              style={styles.finalizeButton}
              icon={<Lock size={20} color="#ffffff" />}
              disabled={expenses.length === 0}
            />
            {expenses.length === 0 && (
              <Text style={styles.finalizeHint}>
                Adicione pelo menos uma despesa antes de finalizar o grupo.
              </Text>
            )}
          </View>
        )}

        {/* PDF Generation */}
        {group.finalizado && (
          <View style={styles.pdfSection}>
            <Button
              title="Gerar PDF do Rateio"
              onPress={handleGeneratePdf}
              style={styles.pdfButton}
              icon={<Download size={20} color="#ffffff" />}
            />
            <Button
              title={aiLoading ? 'Gerando resumo...' : 'Resumo IA'}
              onPress={handleAiSummary}
              style={styles.pdfButton}
            />
            <Button
              title="Ver Resumo de Rateio"
              onPress={() => navigation.navigate('Resumo', { groupId: id })}
              style={styles.pdfButton}
            />
            <Button
              title="Ver Transações Simplificadas"
              onPress={() => navigation.navigate('Finalizado', { groupId: id })}
              style={styles.pdfButton}
            />
            {aiSummary ? (
              <Card style={{ marginTop: 12 }}>
                <Text style={{ color: colors.text.primary, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Resumo IA</Text>
                <Text style={{ color: colors.text.secondary }}>{aiSummary}</Text>
              </Card>
            ) : null}
          </View>
        )}
      </Animated.ScrollView>

      <Modal visible={showFinalizeDialog} transparent animationType="fade" onRequestClose={() => setShowFinalizeDialog(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Lock size={20} color="#059669" />
              <Text style={{ marginLeft: 8, fontSize: 18, fontWeight: '700', color: colors.text.primary }}>Finalizar Grupo</Text>
            </View>
            <Text style={{ color: colors.text.secondary, marginBottom: 16 }}>
              Tem certeza que deseja finalizar este grupo? Após a finalização, não será mais possível adicionar despesas ou membros. O grupo ficará disponível apenas para visualização do rateio final.
            </Text>
            <View style={styles.modalActions}>
              <Button title="Cancelar" variant="outline" onPress={() => setShowFinalizeDialog(false)} />
              <Button title={finalizeLoading ? 'Finalizando...' : 'Sim, Finalizar'} onPress={async () => {
                try {
                  setFinalizeLoading(true);
                  await api.put(`/groups/${id}/finalize`);
                  setShowFinalizeDialog(false);
                  showToast('Grupo finalizado com sucesso!', 'success');
                  await loadGroupData();
                } catch (error: any) {
                  showToast(error?.response?.data?.message || 'Erro ao finalizar grupo', 'error');
                } finally {
                  setFinalizeLoading(false);
                }
              }} />
            </View>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={showDeleteDialog} transparent animationType="fade" onRequestClose={() => setShowDeleteDialog(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View style={styles.modalCard}>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text.primary }}>Remover despesa</Text>
            </View>
            <Text style={{ color: colors.text.secondary, marginBottom: 16 }}>
              Deseja remover esta despesa? Esta ação não pode ser desfeita.
            </Text>
            <View style={styles.modalActions}>
              <Button title="Cancelar" variant="outline" onPress={() => setShowDeleteDialog(false)} />
              <Button title={deletingExpense ? 'Removendo...' : 'Remover'} onPress={async () => {
                if (!expenseToDelete) { setShowDeleteDialog(false); return; }
                try {
                  setDeletingExpense(true);
                  await api.delete(`/expenses/${expenseToDelete.id}`);
                  setExpenses(prev => prev.filter(e => e.id !== expenseToDelete.id));
                  showToast('Despesa removida', 'success');
                  setShowDeleteDialog(false);
                  setExpenseToDelete(null);
                } catch (err) {
                  showToast('Erro ao remover despesa', 'error');
                } finally {
                  setDeletingExpense(false);
                }
              }} />
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    maxWidth: 896,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 8,
  },
  headerTitleContainer: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#d1fae5',
  },
  headerActions: {
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  groupInfoCard: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  memberCard: {
    marginBottom: 12,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  memberPix: {
    fontSize: 12,
    color: '#059669',
  },
  expenseCard: {
    marginBottom: 12,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  expenseDetails: {
    marginTop: 8,
  },
  expenseDetail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  swipeActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  swipeOpenButton: {
    backgroundColor: '#10b981',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  swipeDeleteButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  swipeButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  addButton: {
    marginTop: 16,
  },
  finalizeSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  finalizeButton: {
    marginBottom: 8,
  },
  finalizeHint: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  pdfSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  pdfButton: {
    marginBottom: 8,
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
