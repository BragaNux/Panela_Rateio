import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors } from '../constants/colors';
import { api } from '../services/api';
import Button from '../components/Button';

export default function FriendDetailScreen(){
  const route = useRoute();
  const navigation = useNavigation();
  const { friendId } = route.params as any;
  const [friend, setFriend] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizeFriend = (f: any) => ({
    id: f.Id ?? f.id,
    nome: f.Nome ?? f.nome ?? '',
    email: f.Email ?? f.email ?? '',
    chavePix: f.ChavePix ?? f.chavePix ?? '',
    friendshipDate: f.FriendshipDate ?? f.friendshipDate ?? null,
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!friendId) throw new Error('ID do amigo não informado');
      const r = await api.get(`/friends/${friendId}`);
      setFriend(normalizeFriend(r.data));
    } catch (err: any) {
      const message: string =
        err?.response?.data?.message?.toString?.() ||
        (typeof err?.message === 'string' ? err.message : '') ||
        'Não foi possível carregar os detalhes do amigo.';
      setError(message);
      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [friendId]);
  useFocusEffect(
    React.useCallback(() => {
      load();
      return () => {};
    }, [friendId])
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <LinearGradient colors={["#059669","#10b981"]} style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
        <TouchableOpacity onPress={() => (navigation as any).goBack()} style={{ backgroundColor:'rgba(255,255,255,0.2)', paddingHorizontal:16, paddingVertical:8, borderRadius:12, alignSelf:'flex-start' }}>
          <Text style={{ color:'#fff', fontWeight:'600' }}>Voltar</Text>
        </TouchableOpacity>
        <Text style={{ color:'#fff', fontSize:22, fontWeight:'700', marginTop:8 }}>Detalhes do Amigo</Text>
      </LinearGradient>
      <View style={{ padding: 16 }}>
        <View style={styles.card}>
          {loading ? (
            <View style={{ flexDirection:'row', alignItems:'center' }}>
              <ActivityIndicator color={colors.primary.main} />
              <Text style={[styles.meta, { marginLeft: 8 }]}>Carregando...</Text>
            </View>
          ) : friend ? (
            <>
              <View style={{ flexDirection:'row', alignItems:'center', marginBottom: 12 }}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{String(friend.nome || '').charAt(0).toUpperCase()}</Text></View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.name}>{friend.nome}</Text>
                  <Text style={styles.email}>{friend.email}</Text>
                </View>
              </View>
              {friend.chavePix ? <Text style={styles.pix}>PIX: {friend.chavePix}</Text> : null}
              {friend.friendshipDate ? <Text style={styles.meta}>Amigos desde: {new Date(friend.friendshipDate).toLocaleDateString('pt-BR')}</Text> : null}
            </>
          ) : (
            <Text style={styles.meta}>{error || 'Não foi possível carregar'}</Text>
          )}
        </View>
        <Button title="Criar grupo com este amigo" onPress={() => (navigation as any).navigate('Main', { screen: 'CriarGrupo', params: { preselectFriendId: friendId } })} style={{ marginTop: 12 }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor:'#fff', borderRadius:16, padding:16, shadowColor:'#000', shadowOpacity:0.08, shadowRadius:8, elevation:2 },
  avatar: { width:56, height:56, borderRadius:28, backgroundColor:'#059669', alignItems:'center', justifyContent:'center' },
  avatarText: { color:'#fff', fontSize:22, fontWeight:'700' },
  name: { fontSize:18, fontWeight:'700', color: colors.text.primary },
  email: { fontSize:14, color: colors.text.secondary },
  pix: { fontSize:14, color: colors.primary.main, marginTop:8 },
  meta: { fontSize:12, color: colors.text.tertiary, marginTop:8 },
});
