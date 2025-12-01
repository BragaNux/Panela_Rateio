import React, { useRef, useState } from 'react';
import { TextInput, View, Text, StyleSheet, Animated } from 'react-native';

type Props = {
  value?: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  label?: string;
  error?: string;
  style?: any;
  keyboardType?: string;
  autoCapitalize?: string;
};

export default function Input({ value, onChangeText, placeholder, secureTextEntry, label, error, style, keyboardType, autoCapitalize }: Props){
  const focus = useRef(new Animated.Value(0)).current;
  const [isFocused, setIsFocused] = useState(false);
  const shadow = focus.interpolate({ inputRange: [0, 1], outputRange: [4, 10] });
  const border = focus.interpolate({ inputRange: [0, 1], outputRange: ['rgba(209,213,219,1)', '#10b981'] });
  const onFocus = () => { setIsFocused(true); Animated.timing(focus, { toValue: 1, duration: 160, useNativeDriver: false }).start(); };
  const onBlur = () => { setIsFocused(false); Animated.timing(focus, { toValue: 0, duration: 160, useNativeDriver: false }).start(); };
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Animated.View style={[styles.inputWrapper, { shadowRadius: shadow, borderColor: border }] }>
        <TextInput 
          value={value} 
          onChangeText={onChangeText} 
          placeholder={placeholder} 
          secureTextEntry={secureTextEntry} 
          placeholderTextColor={colors.text.muted} 
          style={[styles.input, error && styles.inputError, style]} 
          keyboardType={keyboardType as any}
          autoCapitalize={autoCapitalize as any}
          multiline={false}
          numberOfLines={1}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {isFocused ? <Animated.View style={{ position:'absolute', left: 10, top: 10, right: 10, bottom: 10, borderRadius: 10, borderWidth: 0.5, borderColor: 'rgba(16,185,129,0.25)', opacity: focus }} /> : null}
      </Animated.View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

import { colors } from '../constants/colors';

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  label: { fontSize: 14, color: colors.text.secondary, marginBottom: 8, fontWeight: '600' },
  inputWrapper: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: colors.background.input,
  },
  input: {
    paddingHorizontal: 16,
    height: 52,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
    textAlignVertical: 'center',
  },
  inputError: { 
    borderColor: colors.error.main,
    shadowColor: colors.error.light,
  },
  error: { fontSize: 12, color: colors.error.main, marginTop: 6, fontWeight: '500' },
});
