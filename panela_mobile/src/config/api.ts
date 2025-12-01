import { Platform } from 'react-native';
// expo-constants não é obrigatório; simplificar detecção
import { getManualApiUrl } from './api.config';
const manifest: any = undefined;
const isRunningInExpoGo = false;

// Configurações de IP para diferentes cenários
const getApiUrl = () => {
  // OPÇÃO 1: Usar configuração manual (mais confiável para dispositivos físicos)
  // Em produção, defina EXPO_PUBLIC_API_URL e esta opção será desativada automaticamente
  const USE_MANUAL_CONFIG = false;
  if (USE_MANUAL_CONFIG) {
    const manualUrl = getManualApiUrl();
    console.log('🔧 Usando configuração manual:', manualUrl);
    return manualUrl;
  }

  // OPÇÃO 2: Variável de ambiente
  if (process.env.EXPO_PUBLIC_API_URL) {
    let envUrl = process.env.EXPO_PUBLIC_API_URL as string;
    if (Platform.OS === 'android' && envUrl.includes('localhost')) {
      envUrl = envUrl.replace('localhost', '10.0.2.2');
    }
    console.log('🌍 Usando variável de ambiente:', envUrl);
    return envUrl;
  }

  // OPÇÃO 3: Auto-detecção (ajustada para Android emulador)
  if (!isRunningInExpoGo) {
    if (Platform.OS === 'android') {
      console.log('📱 Android emulador sem Expo Go, usando 10.0.2.2');
      return 'http://10.0.2.2:8080/api';
    }
    console.log('📱 Não está no Expo Go, usando localhost');
    return 'http://localhost:8080/api';
  }
  
  // Sem debuggerHost: usar heurística por plataforma
  if (Platform.OS === 'ios') {
    return `http://localhost:8080/api`;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080/api';
  }
  
  // Fallback
  console.log('⚠️ Usando fallback produção');
  return 'https://api.panela.host/api';
};

export const API_URL = getApiUrl();

// Debug detalhado
console.log('🌐 === CONFIGURAÇÃO DA API ===');
console.log('📍 API URL:', API_URL);
console.log('📱 Platform:', Platform.OS);
console.log('📦 Expo Go:', isRunningInExpoGo);
console.log('🌍 EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
console.log('==============================');
