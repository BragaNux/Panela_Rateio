import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';
import { useNotificationsStore } from '../store/notifications';
import { Bell, Check } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';

export default function NotificationsScreen({ navigation }: any){
  const { items, loading, fetchNotifications, markRead, fetchUnreadCount } = useNotificationsStore();
  useEffect(() => {
    fetchNotifications();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchNotifications();
      fetchUnreadCount();
      return () => {};
    }, [])
  );

  const handleMarkAll = async () => {
    await markRead();
    await fetchUnreadCount();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#059669", "#10b981"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Notificações</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={handleMarkAll} style={styles.markButton}>
                <Check size={20} color={colors.text.inverse} />
                <Text style={styles.markButtonText}>Marcar todas como lidas</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 32 }}>
        {items.length === 0 && (
          <View style={styles.emptyContainer}>
            <Bell size={28} color={colors.text.secondary} />
            <Text style={styles.emptyText}>Sem notificações no momento</Text>
          </View>
        )}
        {items.map((n) => (
          <View key={n.id} style={[styles.item, !n.isRead && styles.itemUnread]}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemType}>{n.type}</Text>
              <Text style={styles.itemDate}>{new Date(n.createdAt).toLocaleString('pt-BR')}</Text>
            </View>
            <Text style={styles.itemMessage}>{n.message}</Text>
            {!n.isRead && (
              <TouchableOpacity style={styles.itemMark} onPress={async () => { await markRead([n.id]); await fetchUnreadCount(); }}>
                <Text style={styles.itemMarkText}>Marcar como lida</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  header: { paddingHorizontal: 16, paddingVertical: 20, elevation: 4 },
  headerContent: { maxWidth: 896, alignSelf: 'center', width: '100%' },
  headerTitle: { color: colors.text.inverse, fontSize: 24, fontWeight: '700' },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  markButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  markButtonText: { color: colors.text.inverse, fontSize: 14, fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  emptyContainer: { alignItems: 'center', paddingTop: 32 },
  emptyText: { marginTop: 8, color: colors.text.secondary },
  item: { backgroundColor: '#ffffff', borderRadius: 12, padding: 12, marginBottom: 12 },
  itemUnread: { borderWidth: 1, borderColor: colors.primary.main + '55' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  itemType: { fontSize: 12, color: colors.text.tertiary },
  itemDate: { fontSize: 12, color: colors.text.muted },
  itemMessage: { fontSize: 14, color: colors.text.primary },
  itemMark: { alignSelf: 'flex-start', marginTop: 8 },
  itemMarkText: { color: colors.primary.main, fontWeight: '600' },
});
