import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';

interface ExpenseCardProps {
  description: string;
  amount: number;
  payerName: string;
  date: string;
  onPress: () => void;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({
  description,
  amount,
  payerName,
  date,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.amount}>R$ {amount.toFixed(2)}</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.payer}>Pago por {payerName}</Text>
        <Text style={styles.date}>{date}</Text>
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
  description: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary.main,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payer: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  date: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
});