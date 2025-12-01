import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../store/auth';
import { api } from '../services/api';
import { Users, UserPlus, UserCheck, UserX, Search, Mail, ArrowLeft, Check, X as XIcon } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { useToast } from '../hooks/useToast';

interface Friend {
  id: string;
  nome: string;
  email: string;
  chavePix?: string;
  friendshipDate: string;
}

interface FriendRequest {
  id: string;
  senderId: string;
  senderNome: string;
  receiverId: string;
  receiverNome: string;
  status: string;
  createdAt: string;
}

interface User {
  id: string;
  nome: string;
  email: string;
  chavePix?: string;
}

export default function FriendsScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { showToast, ToastContainer } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [inviting, setInviting] = useState(false);
  const [isSelfEmail, setIsSelfEmail] = useState(false);

  const fetchFriends = async () => {
    try {
      const response = await api.get('/friends/list');
      setFriends(response.data);
    } catch (error) {
      console.error('Erro ao buscar amigos:', error);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await api.get('/friends/pending-requests');
      setPendingRequests(response.data);
    } catch (error) {
      console.error('Erro ao buscar solicitações pendentes:', error);
    }
  };

  const fetchSentRequests = async () => {
    try {
      const response = await api.get('/friends/sent-requests');
      setSentRequests(response.data);
    } catch (error) {
      console.error('Erro ao buscar solicitações enviadas:', error);
    }
  };

  const fetchAvailableUsers = async () => {};

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchFriends(),
      fetchPendingRequests(),
      fetchSentRequests(),
      fetchAvailableUsers(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let stopped = false;
      loadAllData();
      const interval = setInterval(() => {
        if (!stopped) {
          fetchPendingRequests();
        }
      }, 5000);
      return () => {
        stopped = true;
        clearInterval(interval);
      };
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const handleSearchUser = async (email: string) => {
    setSearchEmail(email);
    const typed = email.trim().toLowerCase();
    const me = String(user?.email || '').trim().toLowerCase();
    if (!typed) { setFoundUser(null); setIsSelfEmail(false); return; }
    if (typed === me) { setFoundUser(null); setIsSelfEmail(true); return; }
    try{
      const res = await api.get('/users/search', { params: { email } });
      const u = res.data;
      const uEmail = String(u?.email || u?.Email || '').trim().toLowerCase();
      setIsSelfEmail(!!uEmail && uEmail === me);
      setFoundUser(uEmail === me ? null : u);
    } catch(err){
      setFoundUser(null);
      setIsSelfEmail(false);
    }
  };

  const sendFriendRequest = async () => {
    if (!searchEmail) {
      showToast('Digite um e-mail para enviar convite.', 'warning');
      return;
    }
    if (isSelfEmail) {
      showToast('Você não pode enviar convite para seu próprio e-mail.', 'warning');
      return;
    }

    try {
      setInviting(true);
      await api.post('/friends/requests', {
        receiverEmail: searchEmail,
      });
      
      showToast('Solicitação de amizade enviada com sucesso!', 'success');
      setSearchEmail('');
      setFoundUser(null);
      setShowSearch(false);
      fetchSentRequests();
    } catch (error: any) {
      const message: string =
        error?.response?.data?.message?.toString?.() ||
        (typeof error?.message === 'string' ? error.message : '') ||
        'Não foi possível enviar a solicitação.';
      const normalized = /An Error occurred while saving the entity changes/i.test(message)
        ? 'Erro no servidor ao salvar o convite. Tente novamente mais tarde.'
        : message;
      showToast(normalized, 'error');
    }
    finally {
      setInviting(false);
    }
  };

  const respondToRequest = async (requestId: string, accept: boolean) => {
    try {
      if (accept) {
        await api.put(`/friends/requests/${requestId}/accept`);
      } else {
        await api.put(`/friends/requests/${requestId}/reject`);
      }
      
      showToast(accept ? 'Solicitação aceita!' : 'Solicitação recusada!', 'success');
      loadAllData();
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Não foi possível responder à solicitação.', 'error');
    }
  };

  const removeFriend = async (friendId: string) => {
    Alert.alert(
      'Remover Amigo',
      'Tem certeza que deseja remover este amigo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
                onPress: async () => {
                  try {
                    await api.delete(`/friends/remove/${friendId}`);
                    Alert.alert('Sucesso', 'Amigo removido com sucesso!');
                    fetchFriends();
                  } catch (error: any) {
                    Alert.alert('Erro', error.response?.data?.message || 'Não foi possível remover o amigo.');
                  }
                },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ToastContainer />
      <LinearGradient colors={['#f0fdf4', '#dcfce7']} style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />
        }
      >
        {/* Header */}
        <LinearGradient colors={['#059669', '#16a34a']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <ArrowLeft size={20} color="#ffffff" />
              <Text style={styles.backButtonText}>Voltar</Text>
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Meus Amigos</Text>
              <Text style={styles.headerSubtitle}>Adicione amigos para facilitar o rateio de despesas</Text>
            </View>
            
            <TouchableOpacity
              style={styles.addFriendButton}
              onPress={() => setShowSearch(!showSearch)}
            >
              <UserPlus size={20} color="#ffffff" />
              <Text style={styles.addFriendButtonText}>Adicionar Amigo</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.content}>
          {/* Search Form */}
          {showSearch && (
            <View style={styles.searchSection}>
              <View style={styles.searchHeader}>
                <Search size={20} color="#374151" />
                <Text style={styles.searchTitle}>Buscar usuário por e-mail</Text>
              </View>
              
              <View style={styles.searchInputContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Digite o e-mail do usuário"
                  placeholderTextColor="#9ca3af"
                  value={searchEmail}
                  onChangeText={handleSearchUser}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {searchEmail && !foundUser && (
                <Text style={styles.notFoundText}>Nenhum usuário encontrado com este e-mail</Text>
              )}
              {isSelfEmail && (
                <Text style={styles.notFoundText}>Você não pode enviar convite para seu próprio e-mail</Text>
              )}

              {foundUser && (
                <View style={styles.foundUserCard}>
                  <View style={styles.foundUserInfo}>
                    <View style={styles.foundUserAvatar}>
                      <Text style={styles.foundUserAvatarText}>
                        {foundUser.nome.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.foundUserDetails}>
                      <Text style={styles.foundUserName}>{foundUser.nome}</Text>
                      <Text style={styles.foundUserEmail}>{foundUser.email}</Text>
                    </View>
                    <Check size={20} color="#059669" />
                  </View>
                </View>
              )}

              <View style={styles.searchActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowSearch(false);
                    setSearchEmail('');
                    setFoundUser(null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.sendInviteButton, (!foundUser || inviting || isSelfEmail) && styles.disabledButton]}
                  onPress={sendFriendRequest}
                  disabled={!foundUser || inviting || isSelfEmail}
                >
                  <Text style={styles.sendInviteButtonText}>{inviting ? 'Enviando...' : 'Enviar Convite'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Received Invitations */}
          {pendingRequests.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Mail size={20} color="#374151" />
                <Text style={styles.sectionTitle}>Convites Recebidos ({pendingRequests.length})</Text>
              </View>
              
              {pendingRequests.map(request => (
                <View key={request.id} style={styles.invitationCard}>
                  <View style={styles.invitationInfo}>
                    <View style={styles.invitationAvatar}>
                      <Text style={styles.invitationAvatarText}>
                        {request.senderNome.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.invitationDetails}>
                      <Text style={styles.invitationName}>{request.senderNome}</Text>
                      <Text style={styles.invitationEmail}>{request.senderNome}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.invitationActions}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => respondToRequest(request.id, true)}
                    >
                      <Check size={16} color="#ffffff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => respondToRequest(request.id, false)}
                    >
                      <XIcon size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Sent Invitations */}
          {sentRequests.filter(r => r.status === 'pendente').length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Convites Enviados ({sentRequests.filter(r => r.status === 'pendente').length})</Text>
              
              {sentRequests.filter(r => r.status === 'pendente').map(request => (
                <View key={request.id} style={styles.sentInvitationCard}>
                  <View style={styles.sentInvitationInfo}>
                    <View style={styles.sentInvitationAvatar}>
                      <Text style={styles.sentInvitationAvatarText}>
                        {request.receiverNome.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.sentInvitationDetails}>
                      <Text style={styles.sentInvitationName}>{request.receiverNome}</Text>
                      <Text style={styles.sentInvitationEmail}>{request.receiverNome}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Pendente</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Friends List */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Users size={20} color="#374151" />
              <Text style={styles.sectionTitle}>Amigos ({friends.length})</Text>
            </View>
            
            {friends.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyStateIcon}>
                  <Users size={40} color="#9ca3af" />
                </View>
                <Text style={styles.emptyStateTitle}>Você ainda não tem amigos adicionados</Text>
                <Text style={styles.emptyStateSubtitle}>Adicione amigos para facilitar a criação de grupos de rateio</Text>
              </View>
            ) : (
              <View style={styles.friendsGrid}>
                {friends.map(friend => (
                  <TouchableOpacity key={friend.id} style={styles.friendCard} activeOpacity={0.85} onPress={() => (navigation as any).navigate('AmigoDetalhe', { friendId: friend.id })}>
                    <View style={styles.friendCardContent}>
                      <View style={styles.friendAvatar}>
                        <Text style={styles.friendAvatarText}>
                          {friend.nome.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.friendInfo}>
                        <Text style={styles.friendName}>{friend.nome}</Text>
                        <Text style={styles.friendEmail}>{friend.email}</Text>
                        {friend.chavePix && (
                          <Text style={styles.friendPix}>PIX: {friend.chavePix}</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingTop: 32,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#d1fae5',
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addFriendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  content: {
    maxWidth: 896,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 32,
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
  searchSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  searchInputContainer: {
    marginBottom: 16,
  },
  searchInput: {
    width: '100%',
    height: 50,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#374151',
  },
  notFoundText: {
    color: '#d97706',
    fontSize: 14,
    marginTop: 8,
  },
  foundUserCard: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
  },
  foundUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foundUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  foundUserAvatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  foundUserDetails: {
    flex: 1,
  },
  foundUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  foundUserEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  searchActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    marginRight: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  sendInviteButton: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  sendInviteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  invitationCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  invitationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  invitationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  invitationAvatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  invitationDetails: {
    flex: 1,
  },
  invitationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  invitationEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  invitationActions: {
    flexDirection: 'row',
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  rejectButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sentInvitationCard: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sentInvitationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sentInvitationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6b7280',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sentInvitationAvatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  sentInvitationDetails: {
    flex: 1,
  },
  sentInvitationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  sentInvitationEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    backgroundColor: '#fffbeb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#d97706',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  friendsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  friendCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    width: '48%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  friendCardContent: {
    alignItems: 'center',
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  friendAvatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  friendInfo: {
    alignItems: 'center',
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
    textAlign: 'center',
  },
  friendEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  friendPix: {
    fontSize: 12,
    color: '#059669',
    textAlign: 'center',
  },
});
