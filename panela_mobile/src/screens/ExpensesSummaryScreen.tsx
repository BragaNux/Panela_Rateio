import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../components/Card';
import Button from '../components/Button';
import { api } from '../services/api';
import { colors } from '../constants/colors';
import { formatCurrency } from '../utils/formatters';
import { ArrowLeft } from 'lucide-react-native';
import { useAuthStore } from '../store/auth';

interface Member {
  userId: string;
  status: string;
  joinedAt: string;
}

interface BalanceItem {
  usuarioId: string;
  nome?: string;
  saldo: number;
}

export default function ExpensesSummaryScreen(){
  const route = useRoute();
  const navigation = useNavigation();
  const { groupId } = route.params as { groupId: string };
  const { user } = useAuthStore();
  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [membersById, setMembersById] = useState<Record<string, { nome: string; chavePix?: string }>>({});
  const [paidSet, setPaidSet] = useState<Record<string, boolean>>({});
  const [receivedSet, setReceivedSet] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, mres] = await Promise.all([
        api.get(`/reports/group/${groupId}/summary`),
        api.get(`/groups/${groupId}/members`),
      ]);
      const resumo = res.data;
      const membersArr = (mres.data || []) as any[];
      setMembers(membersArr as any);
      const map: Record<string, { nome: string; chavePix?: string }> = {};
      membersArr.forEach((mm: any) => {
        const uid = String(mm.UserId ?? mm.userId ?? mm.id);
        const nome = String(mm.Nome ?? mm.nome ?? uid);
        const chavePix = mm.ChavePix ?? mm.chavePix;
        map[uid] = { nome, chavePix };
      });
      setMembersById(map);
      const tx = Array.isArray(resumo.TransacoesSimplificadas) ? resumo.TransacoesSimplificadas : [];
      setTransactions(tx);
      let saldosArray: BalanceItem[] = Object.values(resumo.Saldos).map((s: any) => ({ usuarioId: s.UserId, nome: s.UserNome, saldo: Number(s.Saldo) }));
      const hasMovement = saldosArray.some(s => s.saldo !== 0);
      if (!hasMovement) {
        const rb = await api.get(`/reports/group/${groupId}/balances`);
        const dict: Record<string, number> = rb.data || {};
        // Mapear nomes via resumo (já tem UserNome)
        const nomePorId: Record<string, string> = {};
        Object.values(resumo.Saldos).forEach((s: any) => { nomePorId[String(s.UserId)] = s.UserNome; });
        saldosArray = Object.entries(dict).map(([uid, saldo]) => ({ usuarioId: uid, nome: nomePorId[uid] || uid, saldo: Number(saldo) }));
      }
      setBalances(saldosArray);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);
  useFocusEffect(
    React.useCallback(() => {
      loadData();
      return () => {};
    }, [groupId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getMemberName = (userId: string) => {
    const item = balances.find(b => b.usuarioId === userId);
    return item?.nome || userId;
  };

  const positivos = balances.filter(b => b.saldo > 0);
  const negativos = balances.filter(b => b.saldo < 0);

  const meId = String(user?.id ?? '');
  const devoPagar = transactions.filter(t => String(t.DevedorId ?? t.devedorId) === meId);
  const vouReceber = transactions.filter(t => String(t.CredorId ?? t.credorId) === meId);

  const togglePaid = (t: any) => {
    const key = `${String(t.DevedorId ?? t.devedorId)}->${String(t.CredorId ?? t.credorId)}`;
    setPaidSet(prev => ({ ...prev, [key]: !prev[key] }));
  };
  const toggleReceived = (t: any) => {
    const key = `${String(t.DevedorId ?? t.devedorId)}->${String(t.CredorId ?? t.credorId)}`;
    setReceivedSet(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getPixForCredor = (credorId: string) => membersById[String(credorId)]?.chavePix;
  const getNameById = (id: string) => membersById[String(id)]?.nome ?? balances.find(b => b.usuarioId === id)?.nome ?? id;

  const emeraldGradient = ['#059669', '#10b981'] as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <LinearGradient colors={emeraldGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={20} color="#ffffff" />
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Resumo de Rateio</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary.main]} />}
      >

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Você deve pagar</Text>
        {devoPagar.length === 0 ? (
          <Text style={styles.empty}>Nenhum pagamento pendente</Text>
        ) : (
          devoPagar.map((t, idx) => {
            const credorId = String(t.CredorId ?? t.credorId);
            const valor = Number(t.Valor ?? t.valor ?? 0);
            const nomeCredor = getNameById(credorId);
            const pix = getPixForCredor(credorId);
            const key = `${String(t.DevedorId ?? t.devedorId)}->${credorId}`;
            const marcado = !!paidSet[key];
            return (
              <View key={idx} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{nomeCredor}</Text>
                  <Text style={styles.negative}>- {formatCurrency(Math.abs(valor))}</Text>
                  {pix ? (
                    <Text selectable style={{ color: colors.text.secondary, marginTop: 4 }}>PIX: {pix}</Text>
                  ) : (
                    <Text style={{ color: '#d97706', marginTop: 4 }}>PIX não informado</Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <TouchableOpacity onPress={() => pix ? Alert.alert('Chave PIX', String(pix)) : Alert.alert('PIX', 'Não informado')} style={{ paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginBottom: 8 }}>
                    <Text style={{ color: colors.text.primary }}>Copiar PIX</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => togglePaid(t)} style={{ paddingVertical: 6, paddingHorizontal: 12, backgroundColor: marcado ? colors.success.light : colors.background.primary, borderWidth: 1, borderColor: marcado ? colors.success.main : colors.border, borderRadius: 8 }}>
                    <Text style={{ color: marcado ? colors.success.dark : colors.text.primary }}>{marcado ? 'Pago' : 'Eu paguei'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Você vai receber</Text>
        {vouReceber.length === 0 ? (
          <Text style={styles.empty}>Nenhum recebimento pendente</Text>
        ) : (
          vouReceber.map((t, idx) => {
            const devedorId = String(t.DevedorId ?? t.devedorId);
            const valor = Number(t.Valor ?? t.valor ?? 0);
            const nomeDevedor = getNameById(devedorId);
            const pix = user?.chavePix;
            const key = `${devedorId}->${String(t.CredorId ?? t.credorId)}`;
            const marcado = !!receivedSet[key];
            return (
              <View key={idx} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{nomeDevedor}</Text>
                  <Text style={styles.positive}>+ {formatCurrency(Math.abs(valor))}</Text>
                  {pix ? (
                    <Text selectable style={{ color: colors.text.secondary, marginTop: 4 }}>Sua PIX: {pix}</Text>
                  ) : (
                    <Text style={{ color: '#d97706', marginTop: 4 }}>Sua PIX não informada</Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <TouchableOpacity onPress={() => pix ? Alert.alert('Sua chave PIX', String(pix)) : Alert.alert('PIX', 'Não informada')} style={{ paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginBottom: 8 }}>
                    <Text style={{ color: colors.text.primary }}>Copiar PIX</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => toggleReceived(t)} style={{ paddingVertical: 6, paddingHorizontal: 12, backgroundColor: marcado ? colors.success.light : colors.background.primary, borderWidth: 1, borderColor: marcado ? colors.success.main : colors.border, borderRadius: 8 }}>
                    <Text style={{ color: marcado ? colors.success.dark : colors.text.primary }}>{marcado ? 'Recebido' : 'Recebi'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Transações simplificadas do grupo</Text>
        {transactions.length === 0 ? (
          <Text style={styles.empty}>Nenhuma transação simplificada</Text>
        ) : (
          transactions.map((t, idx) => {
            const devedorId = String(t.DevedorId ?? t.devedorId);
            const credorId = String(t.CredorId ?? t.credorId);
            const valor = Number(t.Valor ?? t.valor ?? 0);
            const devedorNome = getNameById(devedorId);
            const credorNome = getNameById(credorId);
            const pixCredor = getPixForCredor(credorId);
            return (
              <View key={idx} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{devedorNome} → {credorNome}</Text>
                  <Text style={styles.negative}>- {formatCurrency(Math.abs(valor))}</Text>
                  {pixCredor ? (
                    <Text selectable style={{ color: colors.text.secondary, marginTop: 4 }}>PIX do recebedor: {pixCredor}</Text>
                  ) : (
                    <Text style={{ color: '#d97706', marginTop: 4 }}>PIX do recebedor não informada</Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <TouchableOpacity onPress={() => pixCredor ? Alert.alert('PIX do recebedor', String(pixCredor)) : Alert.alert('PIX', 'Não informada')} style={{ paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 8 }}>
                    <Text style={{ color: colors.text.primary }}>Copiar PIX</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </Card>

      <Button title="Voltar" onPress={() => navigation.goBack()} style={styles.footerBack} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingVertical: 20, elevation: 4 },
  headerContent: { maxWidth: 896, alignSelf: 'center', width: '100%' },
  backButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginBottom: 12, alignSelf: 'flex-start' },
  backButtonText: { color: '#ffffff', fontSize: 16, marginLeft: 8 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#ffffff' },
  container: { padding: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text.secondary, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  name: { fontSize: 14, color: colors.text.primary },
  negative: { fontSize: 14, color: '#dc2626', fontWeight: '600' },
  positive: { fontSize: 14, color: colors.secondary.main, fontWeight: '600' },
  empty: { fontSize: 14, color: colors.text.muted },
  footerBack: { marginTop: 8 }
});
