import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';
import Input from '../components/Input';
import Button from '../components/Button';
import { api } from '../services/api';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../store/auth';
import { useGroupsStore } from '../store/groups';
import SuccessCheck from '../components/SuccessCheck';
import { useToast } from '../hooks/useToast';

export default function AddExpenseScreen(){
  const route: any = useRoute(); const nav: any = useNavigation();
  const { groupId } = route.params;
  const { user } = useAuthStore();
  const { fetchGroups } = useGroupsStore.getState() as any;
  const { showToast, ToastContainer } = useToast();
  const [descricao, setDescricao] = useState(''); const [valor, setValor] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [mode, setMode] = useState<'equal'|'percentage'|'fixed'>('equal');
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [fixedValues, setFixedValues] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  useEffect(() => {
    (async () => {
      try{
        const r = await api.get(`/groups/${groupId}/members`);
        setMembers(r.data);
      } catch(e){ }
    })();
  }, [groupId]);
  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        try{
          const r = await api.get(`/groups/${groupId}/members`);
          setMembers(r.data);
        } catch(e){ }
      })();
      return () => {};
    }, [groupId])
  );
  const salvar = async () => {
    const total = parseFloat(valor || '0');
    if (!descricao.trim()) { showToast('Descrição obrigatória', 'warning'); return; }
    if (!(total > 0)) { showToast('Informe um valor válido', 'warning'); return; }
    const body: any = { groupId, descricao, valor: total, pagadorNome: user?.nome };
    if (mode === 'equal'){
      const cota = total / Math.max(members.length, 1);
      body.splits = members.map((m: any) => ({ userId: m.UserId ?? m.userId, mode: 'Equal', shareValue: Number(cota.toFixed(2)) }));
    } else if (mode === 'percentage'){
      let soma = 0;
      const splits = members.map((m: any) => {
        const p = parseFloat(percentages[m.UserId ?? m.userId] || '0');
        soma += p;
        const share = (total * p) / 100;
        return { userId: m.UserId ?? m.userId, mode: 'Percentage', shareValue: Number(share.toFixed(2)) };
      });
      if (Math.round(soma) !== 100) { showToast('Percentuais devem somar 100%', 'warning'); return; }
      body.splits = splits;
    } else {
      let soma = 0;
      const splits = members.map((m: any) => {
        const v = parseFloat(fixedValues[m.UserId ?? m.userId] || '0');
        soma += v;
        return { userId: m.UserId ?? m.userId, mode: 'FixedAmount', shareValue: Number(v.toFixed(2)) };
      });
      if (Number(soma.toFixed(2)) !== Number(total.toFixed(2))) { showToast('Soma dos valores deve igualar o total', 'warning'); return; }
      body.splits = splits;
    }
    try {
      await api.post('/expenses', body);
      try { await fetchGroups(); } catch {}
      showToast('Despesa salva com sucesso!', 'success');
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        nav.navigate('Grupo', { id: groupId });
      }, 1000);
    } catch(err: any) {
      showToast(err?.response?.data?.message || 'Erro ao salvar despesa', 'error');
    }
  };
  const emerald = ['#059669', '#10b981'] as const;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <LinearGradient colors={emerald} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>Nova Despesa</Text>
      </LinearGradient>
      <View style={{ padding: 16 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: colors.text.primary }}>Descrição</Text>
          <Input value={descricao} onChangeText={setDescricao} placeholder="Ex.: Carnes para o churrasco" />
          <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8, color: colors.text.primary }}>Valor</Text>
          <Input value={valor} onChangeText={setValor} placeholder="0,00" keyboardType="decimal-pad" />
          <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8, color: colors.text.primary }}>Divisão</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
            {[
              { key: 'equal', label: 'Igual' },
              { key: 'percentage', label: '% por membro' },
              { key: 'fixed', label: 'Valor por membro' },
            ].map((opt: any) => (
              <TouchableOpacity key={opt.key} onPress={() => setMode(opt.key)} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 8 }}>
                <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: '#d1d5db', marginRight: 6, backgroundColor: mode === opt.key ? '#10b981' : '#fff' }} />
                <Text style={{ fontSize: 14, color: colors.text.primary }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {mode === 'percentage' && (
            <View>
              {members.map((m: any) => (
                <View key={m.UserId ?? m.userId} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ flexShrink: 1, marginRight: 8 }}>{m.Nome ?? m.nome}</Text>
                  <View style={{ flex: 1 }}>
                    <Input value={percentages[m.UserId ?? m.userId] || ''} onChangeText={(t) => setPercentages(p => ({ ...p, [m.UserId ?? m.userId]: t }))} placeholder="%" keyboardType="decimal-pad" />
                  </View>
                </View>
              ))}
            </View>
          )}
          {mode === 'fixed' && (
            <View>
              {members.map((m: any) => (
                <View key={m.UserId ?? m.userId} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ flexShrink: 1, marginRight: 8 }}>{m.Nome ?? m.nome}</Text>
                  <View style={{ flex: 1 }}>
                    <Input value={fixedValues[m.UserId ?? m.userId] || ''} onChangeText={(t) => setFixedValues(p => ({ ...p, [m.UserId ?? m.userId]: t }))} placeholder="R$" keyboardType="decimal-pad" />
                  </View>
                </View>
              ))}
            </View>
          )}
          <View style={{ height: 16 }} />
          <Button title="Salvar" onPress={salvar} />
        </View>
        {showSuccess ? (
          <View style={{ position:'absolute', left:0, right:0, top:0, bottom:0, alignItems:'center', justifyContent:'center', backgroundColor:'rgba(0,0,0,0.15)' }}>
            <SuccessCheck />
          </View>
        ) : null}
      </View>
      <ToastContainer />
    </SafeAreaView>
  );
}
