import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

interface StatusBadgeProps {
  status: 'active' | 'finalized' | 'pending';
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          text: 'Ativo',
          backgroundColor: colors.success.light,
          textColor: colors.success.main,
        };
      case 'finalized':
        return {
          text: 'Finalizado',
          backgroundColor: colors.warning.light,
          textColor: colors.warning.main,
        };
      case 'pending':
        return {
          text: 'Pendente',
          backgroundColor: colors.warning.light,
          textColor: colors.warning.main,
        };
      default:
        return {
          text: 'Desconhecido',
          backgroundColor: colors.border,
          textColor: colors.text.secondary,
        };
    }
  };

  const config = getStatusConfig();
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
        },
        isSmall && styles.smallContainer,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: config.textColor,
          },
          isSmall && styles.smallText,
        ]}
      >
        {config.text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  smallContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  smallText: {
    fontSize: 10,
  },
});
