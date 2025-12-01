import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Input from '../components/Input';
import Button from '../components/Button';
import { api } from '../services/api';
import { colors } from '../constants/colors';
import { ArrowLeft } from 'lucide-react-native';
import { useGroupsStore } from '../store/groups';
import { useFocusEffect } from '@react-navigation/native';
import { API_URL } from '../config/api';

export default function RateioScreen(){
  const [grupoId, setGrupoId] = useState('');
  const [saldos, setSaldos] = useState<any[]>([]);
  const [nomesPorUsuario, setNomesPorUsuario] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const store = useGroupsStore();
  const finalizados = (store.groups || []).filter((g: any) => !!g.finalizado);
  useEffect(() => { store.fetchGroups().catch(() => {}); }, []);
  useFocusEffect(
    React.useCallback(() => {
      store.fetchGroups().catch(() => {});
      return () => {};
    }, [])
  );
  const calcular = async () => {
    if (!grupoId) {
      Alert.alert('Selecione um grupo', 'Escolha um grupo finalizado para calcular o rateio.');
      return;
    }
    setLoading(true);
    setMensagem(null);
    try {
      const [resumoRes, membrosRes] = await Promise.all([
        api.get(`/reports/group/${grupoId}/summary`),
        api.get(`/groups/${grupoId}/members`),
      ]);
      const resumo = resumoRes.data || {};
      const saldosArray = Object.values(resumo.Saldos || {}).map((s: any) => ({ UsuarioId: s.UserId, Saldo: Number(s.Saldo) }));
      setSaldos(saldosArray);
      if (saldosArray.length === 0) {
        setMensagem('Sem dados de rateio para este grupo.');
      }
      const nomes: Record<string, string> = {};
      (membrosRes.data || []).forEach((mm: any) => {
        const uid = mm.UserId ?? mm.userId;
        nomes[uid] = mm.Nome ?? mm.nome ?? uid;
      });
      Object.values(resumo.Saldos || {}).forEach((s: any) => {
        const uid = s.UserId;
        if (!nomes[uid]) nomes[uid] = s.UserNome ?? `Usuário ${uid}`;
      });
      setNomesPorUsuario(nomes);
    } catch (err: any) {
      Alert.alert('Erro ao calcular', err?.message || 'Tente novamente mais tarde.');
      setSaldos([]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <LinearGradient colors={['#059669', '#10b981']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>Rateio</Text>
      </LinearGradient>
      <View style={{ padding: 16 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: colors.text.primary }}>Selecione um grupo finalizado</Text>
        {finalizados.length === 0 ? (
          <Text style={{ color: '#6b7280' }}>Você não possui grupos finalizados</Text>
        ) : (
          finalizados.map((g) => (
            <TouchableOpacity key={g.id} onPress={() => setGrupoId(g.id)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db', marginRight: 8, backgroundColor: grupoId === g.id ? '#10b981' : '#fff' }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600' }}>{g.nome}</Text>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>Membros: {g.memberCount ?? '-'}</Text>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>Total gasto: R$ {(g.totalExpense ?? 0).toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
        <Button title={loading ? 'Calculando...' : 'Calcular'} onPress={calcular} disabled={!grupoId || loading} />
      </View>
      {mensagem ? (
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 12, marginTop: 8, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
          <Text style={{ fontSize: 14, color: colors.text.secondary }}>{mensagem}</Text>
        </View>
      ) : null}
      {saldos.map(s => {
        const usuarioId = s.UsuarioId ?? s.usuarioId;
        const saldo = s.Saldo ?? s.saldo;
        const nome = nomesPorUsuario[usuarioId] ?? `Usuário ${usuarioId}`;
        return (
          <View key={usuarioId} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 12, marginTop: 8, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
            <Text style={{ fontSize: 14, color: colors.text.primary }}>{nome}: {saldo >= 0 ? 'receber' : 'pagar'} R$ {Math.abs(saldo).toFixed(2)}</Text>
          </View>
        );
      })}
      </View>
    </SafeAreaView>
  );
}
