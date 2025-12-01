import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Input from '../components/Input';
import Button from '../components/Button';
import { useGroups } from '../store/groups';
import { api } from '../services/api';
import { useAuthStore } from '../store/auth';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useToast } from '../hooks/useToast';
import { colors, gradients } from '../constants/colors';
import { ArrowLeft, Check } from 'lucide-react-native';

export default function CreateGroupScreen(){
  const { criar } = useGroups();
  const navigation: any = useNavigation();
  const route: any = useRoute();
  const preselectFriendId: string | undefined = route?.params?.preselectFriendId;
  const { showToast, ToastContainer } = useToast();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [friends, setFriends] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      try{
        const r = await api.get('/friends/list');
        const list = r.data || [];
        setFriends(list);
        if (preselectFriendId) {
          const exists = (list || []).some((f: any) => String(f.id) === String(preselectFriendId));
          if (exists) setSelected(s => ({ ...s, [String(preselectFriendId)]: true }));
        }
      }catch{}
    })();
  }, [preselectFriendId]);
  useFocusEffect(
    React.useCallback(() => {
      let stopped = false;
      const refresh = async () => {
        try {
          const r = await api.get('/friends/list');
          const list = r.data || [];
          if (!stopped) {
            setFriends(list);
            if (preselectFriendId) {
              const exists = (list || []).some((f: any) => String(f.id) === String(preselectFriendId));
              if (exists) setSelected(s => ({ ...s, [String(preselectFriendId)]: true }));
            }
          }
        } catch {}
      };
      refresh();
      return () => { stopped = true; };
    }, [preselectFriendId])
  );
  const emeraldGradient = ['#059669', '#10b981'] as const;

  const onCreate = async () => {
    const nomeTrim = nome.trim();
    const descTrim = descricao.trim();
    if (!nomeTrim){
      showToast('Informe o nome do grupo', 'warning');
      return;
    }
    try{
      const membrosUserIds = Object.keys(selected).filter(id => selected[id]);
      await criar(nomeTrim, descTrim, membrosUserIds);
      showToast('Grupo criado com sucesso!', 'success');
      navigation.navigate('Grupos');
    } catch(err: any){
      showToast(err?.message || 'Erro ao criar grupo', 'error');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <LinearGradient
        colors={emeraldGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 28 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}>
            <ArrowLeft size={20} color="#ffffff" />
            <Text style={{ color: '#fff', fontSize: 16, marginLeft: 8 }}>Voltar</Text>
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>Criar Novo Grupo</Text>
          <View style={{ width: 48 }} />
        </View>
      </LinearGradient>

      <View style={{ padding: 16 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: colors.text.primary }}>Nome do grupo</Text>
          <Input value={nome} onChangeText={setNome} placeholder="Ex.: Churrasco do Fim de Semana" />

          <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8, color: colors.text.primary }}>Descrição (opcional)</Text>
          <Input value={descricao} onChangeText={setDescricao} placeholder="Breve descrição" />

          <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8, color: colors.text.primary }}>Adicionar amigos</Text>
          {friends.length === 0 ? (
            <Text style={{ color: '#6b7280' }}>Você ainda não tem amigos adicionados</Text>
          ) : (
            friends.map((f) => (
              <TouchableOpacity key={f.id} onPress={() => setSelected(s => ({ ...s, [f.id]: !s[f.id] }))} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
                <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: '#d1d5db', marginRight: 8, backgroundColor: selected[f.id] ? '#10b981' : '#fff', alignItems: 'center', justifyContent: 'center' }}>
                  {selected[f.id] ? <Check size={14} color="#fff" /> : null}
                </View>
                <Text style={{ fontSize: 14, color: colors.text.primary }}>{(f.nome || f.email)} <Text style={{ color: '#6b7280' }}>({f.email})</Text></Text>
              </TouchableOpacity>
            ))
          )}

          <View style={{ height: 16 }} />
          <Button title="CRIAR GRUPO" onPress={onCreate} />
        </View>
        <ToastContainer />
      </View>
    </SafeAreaView>
  );
}
