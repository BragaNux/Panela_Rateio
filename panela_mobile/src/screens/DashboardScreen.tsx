import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../components/Card';
import Button from '../components/Button';
import { MemberAvatar } from '../components/MemberAvatar';
import { StatusBadge } from '../components/StatusBadge';
import { useAuthStore } from '../store/auth';
import { useGroupsStore } from '../store/groups';
import { colors } from '../constants/colors';
import { formatCurrency } from '../utils/formatters';
import { User, Bell } from 'lucide-react-native';
import { useNotificationsStore } from '../store/notifications';
import { useFocusEffect } from '@react-navigation/native';

export default function DashboardScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const { groups, fetchGroups, isLoading } = useGroupsStore();
  const { unreadCount, fetchUnreadCount } = useNotificationsStore();

  useEffect(() => {
    loadData();
    fetchUnreadCount();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let stopped = false;
      const refresh = async () => {
        if (!stopped) await fetchGroups();
      };
      refresh();
      const interval = setInterval(refresh, 5000);
      return () => {
        stopped = true;
        clearInterval(interval);
      };
    }, [fetchGroups])
  );

  const loadData = async () => {
    try {
      await fetchGroups();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao carregar grupos');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao fazer logout');
    }
  };

  const handleNavigateToProfile = () => {
    navigation.navigate('Perfil');
  };

  const totalBalance = groups.reduce((sum, group) => sum + (group.totalExpense || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#059669', '#10b981']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={() => navigation.navigate('Notificacoes')} style={styles.notificationButton}>
                <Bell size={22} color={colors.text.inverse} />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNavigateToProfile} style={styles.profileButton}>
                <User size={24} color={colors.text.inverse} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout}>
                <Text style={styles.logoutText}>Sair</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>
      
      <ScrollView style={styles.content}>
        <Card style={styles.welcomeCard}>
          <View style={styles.welcomeHeader}>
            <MemberAvatar name={user?.nome || ''} size="medium" />
            <View style={styles.welcomeText}>
              <Text style={styles.welcomeTitle}>Olá, {user?.nome}!</Text>
              <Text style={styles.welcomeSubtitle}>Bem-vindo ao PANELA</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total em Rateios</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(totalBalance)}</Text>
          <Text style={styles.balanceSubtitle}>em {groups.length} grupos</Text>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meus Grupos</Text>
          {groups.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>Você ainda não tem grupos</Text>
              <Text style={styles.emptySubtext}>Crie seu primeiro grupo para começar!</Text>
            </Card>
          ) : (
            groups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={styles.groupItem}
                onPress={() => navigation.navigate('Grupo', { id: group.id })}
              >
                <Card>
                  <View style={styles.groupHeader}>
                    <View style={styles.groupTitleContainer}>
                      <Text style={styles.groupName}>{group.nome}</Text>
                      <StatusBadge status={group.finalizado ? 'finalized' : 'active'} size="small" />
                    </View>
                    <Text style={styles.groupAmount}>
                      {formatCurrency(group.totalExpense || 0)}
                    </Text>
                  </View>
                  {group.descricao && (
                    <Text style={styles.groupDescription}>{group.descricao}</Text>
                  )}
                  <View style={styles.groupFooter}>
                    <Text style={styles.groupMembers}>{group.memberCount} membros</Text>
                    {group.finalizadoEm && (
                      <Text style={styles.groupFinalizedDate}>
                        Finalizado em {new Date(group.finalizadoEm).toLocaleDateString('pt-BR')}
                      </Text>
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>

        <Button
          title="Criar Novo Grupo"
          onPress={() => navigation.navigate('CriarGrupo')}
          style={styles.createButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    elevation: 4,
  },
  headerContent: {
    maxWidth: 896,
    alignSelf: 'center',
    width: '100%',
  },
  headerTitle: {
    color: colors.text.inverse,
    fontSize: 24,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  notificationButton: {
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  profileButton: {
    padding: 8,
  },
  logoutText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  welcomeCard: {
    marginBottom: 16,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    marginLeft: 16,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  balanceCard: {
    marginBottom: 24,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary.main,
  },
  balanceSubtitle: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  groupItem: {
    marginBottom: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginRight: 8,
  },
  groupAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary.main,
  },
  groupDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupMembers: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  groupFinalizedDate: {
    fontSize: 12,
    color: colors.text.muted,
  },
  createButton: {
    marginBottom: 32,
  },
});
