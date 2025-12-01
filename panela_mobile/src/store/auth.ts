import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setToken } from '../services/api';

export interface User {
  id: string;
  nome: string;
  email: string;
  chavePix?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  register: (nome: string, email: string, password: string, chavePix?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  updateProfile: (nome: string, chavePix: string) => Promise<void>;
  updatePassword: (senhaAtual: string, novaSenha: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  
  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const requestData = { Email: email, Password: password };
      console.log('📤 Enviando login:', requestData);
      const response = await api.post('/auth/login', requestData);
      console.log('✅ Resposta do login:', response.data);
      const { token, user } = response.data;
      
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      setToken(token);
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  register: async (nome: string, email: string, password: string, chavePix?: string) => {
    set({ isLoading: true });
    try {
      // Envia ambos os nomes de campo para compatibilidade com variações do backend
      const requestData = { Nome: nome, Email: email, Password: password, Senha: password, ChavePix: chavePix };
      console.log('📤 Enviando registro:', requestData);
      const response = await api.post('/auth/register', requestData);
      console.log('✅ Resposta do registro:', response.data);
      const { token, user } = response.data;
      
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      setToken(token);
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },
  
  loadStoredAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        setToken(token);
        set({
          user,
          token,
          isAuthenticated: true,
        });
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    }
  },
  
  updateProfile: async (nome: string, chavePix: string) => {
    try {
      const response = await api.put('/auth/profile', { nome, chavePix });
      const updatedUser = response.data.user;
      
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
    } catch (error) {
      throw error;
    }
  },
  
  updatePassword: async (senhaAtual: string, novaSenha: string) => {
    try {
      await api.put('/auth/password', { senhaAtual, novaSenha });
    } catch (error) {
      throw error;
    }
  },
}));
