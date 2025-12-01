import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuthStore } from '../store/auth';
import { colors } from '../constants/colors';
import { useToast } from '../hooks/useToastSimple';
import { User, Mail, Lock, CreditCard, ArrowLeft, UserPlus } from 'lucide-react-native';

export default function RegisterScreen({ navigation }: any){
  const { register } = useAuthStore();
  const { showToast, ToastContainer } = useToast();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const nomeTrim = nome.trim();
    const emailTrim = email.trim();
    const senhaTrim = senha.trim();
    if (!nomeTrim || !emailTrim || !senhaTrim){
      showToast('Preencha nome, email e senha', 'error');
      return;
    }
    if (senhaTrim.length < 6){
      showToast('Senha deve ter pelo menos 6 caracteres', 'error');
      return;
    }
    setLoading(true);
    try{
      await register(nomeTrim, emailTrim, senhaTrim, chavePix?.trim() ?? '');
      showToast('Conta criada com sucesso!', 'success');
      navigation.navigate('Login');
    } catch(error: any){
      console.error('Erro no registro:', error);
      
      let errorMessage = 'Erro ao criar conta. Tente novamente.';
      
      if (error.response) {
        // Erro do servidor
        if (error.response.status === 400) {
          // Mostrar erros de validação específicos
          const validationErrors = error.response.data.errors;
          if (validationErrors) {
            const errorMessages = Object.values(validationErrors).flat();
            errorMessage = errorMessages.join('\n') || 'Dados inválidos. Verifique suas informações.';
          } else {
            errorMessage = error.response.data.message || 'Dados inválidos. Verifique suas informações.';
          }
        } else if (error.response.status === 409) {
          errorMessage = 'Este email já está cadastrado.';
        } else if (error.response.status === 500) {
          errorMessage = 'Erro no servidor. Tente novamente mais tarde.';
        }
      } else if (error.request) {
        // Erro de rede
        errorMessage = 'Erro de conexão. Verifique sua internet ou tente novamente.';
      } else {
        // Outro erro
        errorMessage = error.message || 'Erro ao processar sua solicitação.';
      }
      
      showToast(errorMessage, 'error');
    } finally{
      setLoading(false);
    }
  };

  const handleNavigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Botão Voltar */}
          <TouchableOpacity onPress={handleNavigateToLogin} style={styles.backButton}>
            <ArrowLeft size={20} color={colors.text.secondary} />
            <Text style={styles.backButtonText}>Voltar ao login</Text>
          </TouchableOpacity>

          {/* Card principal com logo e formulário */}
          <View style={styles.mainCard}>
            
            {/* Logo e Slogan */}
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/logos/panela_icon_sem_fundo_com_texto.png')} 
                style={styles.logo} 
                resizeMode="contain" 
              />
              <Text style={styles.slogan}>Rateio fácil entre amigos</Text>
            </View>

            {/* Formulário */}
            <View style={styles.formContainer}>
              
              {/* Campo Nome */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Nome completo</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconContainer}>
                    <User size={20} color={colors.text.muted} />
                  </View>
                  <View style={{ position: 'relative', width: '100%' }}>
                    <Input
                      value={nome}
                      onChangeText={setNome}
                      placeholder="Seu nome completo"
                      style={[styles.inputWithIcon, { height: 52, width: '100%' }]}
                    />
                  </View>
                </View>
              </View>

              {/* Campo Email */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>E-mail</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconContainer}>
                    <Mail size={20} color={colors.text.muted} />
                  </View>
                  <View style={{ position: 'relative', width: '100%' }}>
                    <Input
                      value={email}
                      onChangeText={setEmail}
                      placeholder="seu@email.com"
                      style={[styles.inputWithIcon, { height: 52, width: '100%' }]}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              </View>

              {/* Campo Senha */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Senha</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconContainer}>
                    <Lock size={20} color={colors.text.muted} />
                  </View>
                  <View style={{ position: 'relative', width: '100%' }}>
                    <Input
                      value={senha}
                      onChangeText={setSenha}
                      placeholder="••••••••"
                      secureTextEntry
                      style={[styles.inputWithIcon, { height: 52, width: '100%' }]}
                    />
                  </View>
                </View>
              </View>

              {/* Campo Chave PIX */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Chave PIX</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconContainer}>
                    <CreditCard size={20} color={colors.text.muted} />
                  </View>
                  <View style={{ position: 'relative', width: '100%' }}>
                    <Input
                      value={chavePix}
                      onChangeText={setChavePix}
                      placeholder="Email, telefone, CPF ou chave aleatória"
                      style={[styles.inputWithIcon, styles.pixInput]}
                    />
                  </View>
                </View>
                <Text style={styles.fieldHelper}>Para receber pagamentos dos seus amigos</Text>
              </View>

              {/* Botão Criar Conta */}
              <Button 
                title="Criar minha conta" 
                onPress={handleRegister} 
                loading={loading}
                style={styles.registerButton}
                icon={<UserPlus size={20} color="#FFFFFF" />}
              />

            </View>
          </View>

          {/* Link para login */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={handleNavigateToLogin}>
              <Text style={styles.loginLink}>Faça login</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
      <ToastContainer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  
  // Botão voltar
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: colors.text.secondary,
    fontSize: 14,
    marginLeft: 8,
  },
  
  // Card principal
  mainCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 24,
    padding: 32,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  // Logo e slogan
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 240,
    height: 160,
    marginBottom: 8,
  },
  slogan: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Formulário
  formContainer: {
    marginTop: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  fieldHelper: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
  inputIconContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
    top: 16,
  },
  inputWithIcon: {
    paddingLeft: 48,
    marginBottom: 0,
    height: 52,
    width: '100%',
  },
  inputCompact: {
    fontSize: 14,
  },
  pixInput: {
    fontSize: 14,
    height: 56,
    width: '100%',
  },
  
  // Botão criar conta
  registerButton: {
    marginBottom: 8,
  },
  
  // Link para login
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  loginLink: {
    color: colors.primary.main,
    fontSize: 14,
    fontWeight: '600',
  },
});
