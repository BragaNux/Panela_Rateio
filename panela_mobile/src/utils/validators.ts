export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 6) {
    return { valid: false, message: 'A senha deve ter pelo menos 6 caracteres' };
  }
  return { valid: true };
};

export const validateRequired = (value: string, fieldName: string): { valid: boolean; message?: string } => {
  if (!value || value.trim().length === 0) {
    return { valid: false, message: `${fieldName} é obrigatório` };
  }
  return { valid: true };
};

export const validatePositiveNumber = (value: number): { valid: boolean; message?: string } => {
  if (isNaN(value) || value <= 0) {
    return { valid: false, message: 'O valor deve ser maior que zero' };
  }
  return { valid: true };
};