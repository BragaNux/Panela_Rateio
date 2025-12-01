import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../constants/colors';

interface MemberAvatarProps {
  name: string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const MemberAvatar: React.FC<MemberAvatarProps> = ({ name, size = 'medium', style }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeStyles = {
    small: { width: 32, height: 32, borderRadius: 16 },
    medium: { width: 48, height: 48, borderRadius: 24 },
    large: { width: 64, height: 64, borderRadius: 32 },
  };

  const textSizes = {
    small: 12,
    medium: 16,
    large: 20,
  };

  return (
    <View style={[styles.container, sizeStyles[size], style]}>
      <Text style={[styles.text, { fontSize: textSizes[size] }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  text: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
});