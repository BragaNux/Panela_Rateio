import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../components/Card';
import { colors } from '../constants/colors';
import { useGroups } from '../store/groups';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Button from '../components/Button';
import { useAuthStore } from '../store/auth';

function GroupListItem({ g, nav }: { g: any, nav: any }){
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
  const ativo = !g.finalizado;
  const criadoEmDate = g.criadoEm || g.createdAt;
  const criadoEm = criadoEmDate ? new Date(criadoEmDate).toLocaleDateString('pt-BR') : '';
  const { user } = useAuthStore();
  const isMe = String(g.creatorId ?? '').trim().toLowerCase() === String(user?.id ?? '').trim().toLowerCase();
  return (
    <Animated.View style={{ marginBottom: 12, transform: [{ scale }] }}>
      <TouchableOpacity onPress={() => nav.navigate('Grupo', { id: g.id })} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={0.85}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text.primary }}>{g.nome}</Text>
              {g.descricao ? <Text style={{ color: colors.text.secondary, marginTop: 4 }}>{g.descricao}</Text> : null}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 14, color: ativo ? '#059669' : '#ef4444', fontWeight: '600' }}>{ativo ? 'Ativo' : 'Finalizado'}</Text>
              <Text style={{ fontSize: 12, color: colors.text.secondary }}>Membros: {g.memberCount ?? '-'}</Text>
            </View>
          </View>
          <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, color: colors.text.secondary }}>Criado por: {isMe ? 'Você' : (g.creatorName ?? '—')}</Text>
            <Text style={{ fontSize: 12, color: colors.text.secondary }}>Criado em: {criadoEm}</Text>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function GroupsListScreen(){
  const { grupos, carregar } = useGroups();
  const nav: any = useNavigation();
  useEffect(() => { carregar(); }, []);
  useFocusEffect(
    React.useCallback(() => {
      let stopped = false;
      const refresh = async () => {
        if (!stopped) await carregar();
      };
      refresh();
      const interval = setInterval(refresh, 5000);
      return () => {
        stopped = true;
        clearInterval(interval);
      };
    }, [carregar])
  );
  const emerald = ['#059669', '#10b981'] as const;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <LinearGradient colors={emerald} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>Meus Grupos</Text>
      </LinearGradient>
      <View style={{ padding: 16 }}>
      {grupos.length === 0 ? (
        <Card style={{ padding: 16, alignItems: 'center' }}>
          <Text style={{ color: '#6b7280', marginBottom: 8 }}>Você ainda não tem grupos</Text>
          <Text style={{ color: '#9ca3af', marginBottom: 16, textAlign: 'center' }}>Crie seu primeiro grupo para começar!</Text>
          <Button title="Criar grupo" onPress={() => nav.navigate('CriarGrupo')} />
        </Card>
      ) : grupos.map(g => (
        <GroupListItem key={g.id} g={g} nav={nav} />
      ))}
      </View>
    </SafeAreaView>
  );
}
