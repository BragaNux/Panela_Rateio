import React, { useEffect, useState } from 'react';
import { View, Text, Alert, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';
import Input from '../components/Input';
import Button from '../components/Button';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { useToast } from '../hooks/useToast';

export default function AddMemberScreen(){
  const route: any = useRoute(); const nav: any = useNavigation();
  const { groupId } = route.params as any;
  const { showToast, ToastContainer } = useToast();
  const [usuarioIdOuEmail, setUsuarioIdOuEmail] = useState('');
  const [friends, setFriends] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const normalizeFriend = (f: any) => ({
    id: f.Id ?? f.id,
    nome: f.Nome ?? f.nome ?? '',
    email: f.Email ?? f.email ?? '',
  });

  const normalizeMember = (m: any) => ({
    userId: m.UserId ?? m.userId,
    nome: m.Nome ?? m.nome ?? '',
    email: m.Email ?? m.email ?? '',
  });

  const load = async () => {
    setLoading(true);
    try{
      const [fRes, mRes] = await Promise.all([
        api.get('/friends/list'),
        api.get(`/groups/${groupId}/members`),
      ]);
      const fs = Array.isArray(fRes.data) ? fRes.data.map(normalizeFriend) : [];
      const ms = Array.isArray(mRes.data) ? mRes.data.map(normalizeMember) : [];
      setFriends(fs);
      setMembers(ms);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [groupId]);
  useFocusEffect(
    React.useCallback(() => {
      load();
      return () => {};
    }, [groupId])
  );
  const salvar = async () => {
    try{
      let userId = usuarioIdOuEmail;
      if (usuarioIdOuEmail.includes('@')){
        const res = await api.get(`/users/search`, { params: { email: usuarioIdOuEmail } });
        userId = res.data.id;
      }
      await api.post(`/groups/${groupId}/members`, { userId });
      showToast('Membro adicionado com sucesso!', 'success');
      setTimeout(() => nav.goBack(), 1200);
    } catch(err: any){
      showToast(err?.response?.data?.message || 'Não foi possível adicionar membro', 'error');
    }
  };

  const adicionarPorId = async (userId: string) => {
    try{
      setAddingId(userId);
      await api.post(`/groups/${groupId}/members`, { userId });
      const nome = friends.find(f => f.id === userId)?.nome || 'Amigo';
      showToast(`${nome} adicionado ao grupo`, 'success');
      await load();
    } catch(err: any){
      showToast(err?.response?.data?.message || 'Não foi possível adicionar membro', 'error');
    } finally {
      setAddingId(null);
    }
  };
  const emerald = ['#059669', '#10b981'] as const;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <LinearGradient colors={emerald} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>Adicionar Membro</Text>
      </LinearGradient>
      <ScrollView style={{ padding: 16 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: colors.text.primary }}>ID ou e-mail</Text>
          <Input value={usuarioIdOuEmail} onChangeText={setUsuarioIdOuEmail} placeholder="ID ou email do usuário" autoCapitalize="none" keyboardType="default" />
          <View style={{ height: 16 }} />
          <Button title="Adicionar" onPress={salvar} />
        </View>

        <View style={{ height: 16 }} />

        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
          <View style={{ flexDirection:'row', alignItems:'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary, flex: 1 }}>Seus amigos</Text>
            {loading && (
              <ActivityIndicator color={colors.primary.main} />
            )}
          </View>
          {(() => {
            const memberIds = new Set(members.map(m => String(m.userId)));
            const disponiveis = friends.filter(f => !memberIds.has(String(f.id)));
            if (disponiveis.length === 0) {
              return (
                <Text style={{ fontSize: 14, color: colors.text.secondary }}>Nenhum amigo disponível para adicionar.</Text>
              );
            }
            return disponiveis.map(f => (
              <View key={f.id} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical: 8 }}>
                <View style={{ flexDirection:'row', alignItems:'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor:'#059669', alignItems:'center', justifyContent:'center', marginRight: 12 }}>
                    <Text style={{ color:'#fff', fontWeight:'700' }}>{String(f.nome || '').charAt(0).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.primary }}>{f.nome}</Text>
                    <Text style={{ fontSize: 13, color: colors.text.secondary }}>{f.email}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => adicionarPorId(f.id)} disabled={addingId === f.id} style={{ backgroundColor:'#10b981', paddingVertical:8, paddingHorizontal:12, borderRadius:10, opacity: addingId === f.id ? 0.6 : 1 }}>
                  <Text style={{ color:'#fff', fontWeight:'700' }}>{addingId === f.id ? 'Adicionando...' : 'Adicionar'}</Text>
                </TouchableOpacity>
              </View>
            ));
          })()}
        </View>
      </ScrollView>
      <ToastContainer />
    </SafeAreaView>
  );
}
