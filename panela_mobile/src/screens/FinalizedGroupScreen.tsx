import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Card } from '../components/Card';
import Button from '../components/Button';
import { api } from '../services/api';
import { colors } from '../constants/colors';

interface Transacao {
  DevedorId: string;
  DevedorNome: string;
  CredorId: string;
  CredorNome: string;
  Valor: number;
}

export default function FinalizedGroupScreen(){
  const route = useRoute();
  const navigation = useNavigation();
  const { groupId } = route.params as { groupId: string };
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [membersById, setMembersById] = useState<Record<string, string>>({});

  const loadData = async () => {
    try {
      const [res, mres] = await Promise.all([
        api.get(`/reports/group/${groupId}/summary`),
        api.get(`/groups/${groupId}/members`),
      ]);
      const membrosArr = (mres.data || []) as any[];
      const nomes: Record<string, string> = {};
      membrosArr.forEach((mm: any) => {
        const uid = String(mm.UserId ?? mm.userId ?? mm.id);
        const nome = String(mm.Nome ?? mm.nome ?? uid);
        nomes[uid] = nome;
      });
      setMembersById(nomes);

      const d = res.data || {};
      let tx: any[] = d.TransacoesSimplificadas ?? d.transacoesSimplificadas ?? [];
      if (!Array.isArray(tx) || tx.length === 0) {
        const fres = await api.get(`/reports/group/${groupId}/simplified-transactions`);
        tx = Array.isArray(fres.data) ? fres.data : [];
      }
      const normalized: Transacao[] = tx.map((t: any) => ({
        DevedorId: String(t.DevedorId ?? t.devedorId),
        DevedorNome: String(t.DevedorNome ?? t.devedorNome ?? nomes[String(t.DevedorId ?? t.devedorId)] ?? 'Desconhecido'),
        CredorId: String(t.CredorId ?? t.credorId),
        CredorNome: String(t.CredorNome ?? t.credorNome ?? nomes[String(t.CredorId ?? t.credorId)] ?? 'Desconhecido'),
        Valor: Number(t.Valor ?? t.valor ?? 0),
      }));
      setTransacoes(normalized);
    } catch (err) {
      setTransacoes([]);
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

  const emerald = ['#059669', '#10b981'] as const;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <LinearGradient colors={emerald} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={20} color="#ffffff" />
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rateio Finalizado</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary.main]} />}
      >

      {transacoes.length === 0 ? (
        <Card>
          <Text style={styles.empty}>Sem transações simplificadas</Text>
        </Card>
      ) : (
        transacoes.map((t, idx) => (
          <Card key={idx} style={styles.txCard}>
            <View style={styles.txRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.txText} numberOfLines={2} ellipsizeMode="tail">
                  <Text style={styles.debtor}>{t.DevedorNome}</Text> deve pagar <Text style={styles.creditor}>{t.CredorNome}</Text>
                </Text>
              </View>
              <Text style={styles.txAmount}>{t.Valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
            </View>
          </Card>
        ))
      )}

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
  empty: { color: '#6b7280' },
  txCard: { marginBottom: 12 },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  txText: { color: '#374151' },
  debtor: { color: '#dc2626', fontWeight: '600' },
  creditor: { color: '#059669', fontWeight: '600' },
  txAmount: { color: '#059669', fontWeight: '700', textAlign: 'right' },
});
