import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuthStore } from '../store/auth';
import { colors } from '../constants/colors';
import { useToast } from '../hooks/useToastSimple';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen({ navigation }: any){
  const { login } = useAuthStore();
  const { showToast, ToastContainer } = useToast();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [senhaVisivel, setSenhaVisivel] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha){
      showToast('Preencha todos os campos', 'error');
      return;
    }
    setLoading(true);
    try{
      await login(email, senha);
      showToast('Login realizado com sucesso!', 'success');
    } catch(error: any){
      console.error('Erro no login:', error);
      
      let errorMessage = 'Erro ao fazer login. Tente novamente.';
      
      if (error.response) {
        // Erro do servidor
        if (error.response.status === 401) {
          errorMessage = 'Email ou senha incorretos.';
        } else if (error.response.status === 400) {
          errorMessage = error.response.data.message || 'Dados inválidos.';
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

  const handleNavigateToRegister = () => {
    navigation.navigate('Registro');
  };

  const handleForgotPassword = () => {
    navigation.navigate('EsqueciSenha');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#059669', '#10b981']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Entrar</Text>
          <Text style={styles.headerSubtitle}>Acesse sua conta para gerenciar seus rateios</Text>
        </View>
      </LinearGradient>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
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
                      secureTextEntry={!senhaVisivel}
                      style={[styles.inputWithIcon, { paddingRight: 48 }, { height: 52, width: '100%' }]}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setSenhaVisivel(v => !v)} style={{ position: 'absolute', right: 16, top: 0, height: 52, justifyContent: 'center' }}>
                      {senhaVisivel ? <EyeOff size={20} color={colors.text.muted} /> : <Eye size={20} color={colors.text.muted} />}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Esqueceu a senha */}
              <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordContainer}>
                <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
              </TouchableOpacity>

              {/* Botão Entrar */}
              <Button 
                title="Entrar" 
                onPress={handleLogin} 
                loading={loading}
                style={styles.loginButton}
              />

            </View>
          </View>

          {/* Link para criar conta */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Não tem uma conta? </Text>
            <TouchableOpacity onPress={handleNavigateToRegister}>
              <Text style={styles.registerLink}>Cadastre-se</Text>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    elevation: 4,
  },
  headerContent: {
    maxWidth: 896,
    alignSelf: 'center',
    width: '100%',
  },
  headerTitle: {
    color: colors.text.inverse,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: colors.text.inverse,
    fontSize: 14,
    opacity: 0.9,
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
  
  // Esqueceu senha
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: colors.primary.main,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Botão login
  loginButton: {
    marginBottom: 8,
  },
  
  // Criar conta
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  registerLink: {
    color: colors.primary.main,
    fontSize: 14,
    fontWeight: '600',
  },
});
