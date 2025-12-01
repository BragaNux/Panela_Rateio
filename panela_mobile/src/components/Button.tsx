import React, { useRef } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: any;
  textStyle?: any;
  icon?: React.ReactNode;
};

export default function Button({ title, onPress, variant = 'primary', disabled, loading, style, textStyle, icon }: Props){
  const isDisabled = !!disabled || !!loading;
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => {
    if (isDisabled) return;
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  };
  
  if (variant === 'outline'){
    return (
    <TouchableOpacity onPress={onPress} disabled={isDisabled} style={style} activeOpacity={0.7} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.outline, isDisabled && styles.disabled, { transform: [{ scale }] }] }>
      {loading ? <ActivityIndicator color="#059669" /> : (
        <View style={styles.contentContainer}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.text, styles.outlineText, textStyle]}>{title}</Text>
        </View>
      )}
      </Animated.View>
    </TouchableOpacity>
  );
  }
  
  // Botão primário com gradiente
  return (
    <TouchableOpacity onPress={onPress} disabled={isDisabled} activeOpacity={0.8} style={style} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={{ transform: [{ scale }] }}>
      <LinearGradient
        colors={['#059669', '#16a34a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, isDisabled && styles.disabled]}
      >
        {loading ? <ActivityIndicator color="#ffffff" /> : (
          <View style={styles.contentContainer}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text style={[styles.text, styles.primaryText, textStyle]}>{title}</Text>
          </View>
        )}
      </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradient: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', shadowColor: 'rgba(5, 150, 105, 0.1)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  outline: { borderWidth: 2, borderColor: '#059669', backgroundColor: '#f0fdf4', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center' },
  text: { fontSize: 16, fontWeight: '600' },
  primaryText: { color: '#ffffff' },
  outlineText: { color: '#059669' },
  disabled: { opacity: 0.5 },
  contentContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  iconContainer: { marginRight: 8 },
});
