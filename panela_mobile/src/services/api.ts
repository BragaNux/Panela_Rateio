import axios from 'axios';
import { API_URL } from '../config/api';

export const api = axios.create({ 
  baseURL: API_URL,
  timeout: 10000, // 10 segundos de timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use(
  (config) => {
    console.log('🚀 Requisição:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Erro na requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas
api.interceptors.response.use(
  (response) => {
    console.log('✅ Resposta:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Erro na resposta:', error.response?.status, error.response?.data);
    console.error('❌ Detalhes do erro:', {
      message: error.message,
      code: error.code,
      config: error.config?.url,
      response: error.response?.data
    });
    
    if (error.code === 'ECONNREFUSED') {
      error.message = '❌ Não foi possível conectar ao servidor. Verifique se o backend está rodando em ' + API_URL;
    } else if (error.code === 'ETIMEDOUT') {
      error.message = '⏰ Tempo limite excedido. Verifique sua conexão com a internet.';
    } else if (!error.response) {
      error.message = '🌐 Erro de conexão. Verifique sua internet e se o servidor está acessível em ' + API_URL;
    } else if (error.response?.status === 0) {
      error.message = '🔌 Não foi possível conectar ao servidor. Verifique o endereço: ' + API_URL;
    }
    
    return Promise.reject(error);
  }
);

export const setToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    console.log('🔑 Token definido');
  } else {
    delete api.defaults.headers.common.Authorization;
    console.log('🔑 Token removido');
  }
};