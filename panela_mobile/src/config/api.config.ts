// Configuração manual do IP do backend para desenvolvimento
// Use este arquivo quando o auto-detecção falhar

export const MANUAL_BACKEND_IP = 'api.panela.host';
export const MANUAL_BACKEND_PORT = '';

// Para descobrir seu IP, execute no terminal:
// Windows: ipconfig
// Mac/Linux: ifconfig ou ip a

// Exemplos comuns:
// - 192.168.x.x (rede local WiFi)
// - 10.0.x.x (algumas redes corporativas)
// - 172.16.x.x (outras redes privadas)

export const getManualApiUrl = () => {
  return `https://api.panela.host/api`;
};
