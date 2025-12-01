import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';
import { StatusBadge } from './StatusBadge';

interface GroupCardProps {
  name: string;
  description?: string;
  memberCount: number;
  totalExpense: number;
  finalizado?: boolean;
  finalizadoEm?: string;
  onPress: () => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  name,
  description,
  memberCount,
  totalExpense,
  finalizado = false,
  finalizadoEm,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.name}>{name}</Text>
          <StatusBadge status={finalizado ? 'finalized' : 'active'} size="small" />
        </View>
        <Text style={styles.amount}>R$ {totalExpense.toFixed(2)}</Text>
      </View>
      {description && <Text style={styles.description}>{description}</Text>}
      <View style={styles.footer}>
        <Text style={styles.members}>{memberCount} membros</Text>
        {finalizadoEm && (
          <Text style={styles.finalizedDate}>
            Finalizado em {new Date(finalizadoEm).toLocaleDateString('pt-BR')}
          </Text>
        )}
        <Text style={styles.arrow}>→</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginRight: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary.main,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  members: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  finalizedDate: {
    fontSize: 12,
    color: colors.text.muted,
    marginLeft: 8,
  },
  arrow: {
    fontSize: 16,
    color: colors.text.tertiary,
  },
});