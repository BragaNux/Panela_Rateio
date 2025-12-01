import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../components/Input';
import Button from '../components/Button';
import { colors } from '../constants/colors';
import { Mail, ArrowLeft, Check } from 'lucide-react-native';
import { api } from '../services/api';

export default function ForgotPasswordScreen({ navigation }: any){
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [code, setCode] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');

  const handleSubmit = async () => {
    if (!email){
      setDialogTitle('Erro');
      setDialogMessage('Por favor, informe seu email');
      setDialogVisible(true);
      return;
    }
    setLoading(true);
    try{
      await api.post('/auth/forgot-password', { Email: email });
      setEnviado(true);
    } catch(error){
      setDialogTitle('Erro');
      setDialogMessage('Erro ao enviar email de recuperação');
      setDialogVisible(true);
    } finally{
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!code.trim() || !novaSenha.trim()){
      setDialogTitle('Erro');
      setDialogMessage('Informe o código e a nova senha');
      setDialogVisible(true);
      return;
    }
    if (novaSenha !== confirmar){
      setDialogTitle('Erro');
      setDialogMessage('As senhas não coincidem');
      setDialogVisible(true);
      return;
    }
    setLoading(true);
    try{
      await api.post('/auth/reset-password', { Email: email, Code: code, NovaSenha: novaSenha });
      setDialogTitle('Sucesso');
      setDialogMessage('Senha redefinida com sucesso');
      setDialogVisible(true);
    } catch(error){
      setDialogTitle('Erro');
      setDialogMessage('Código inválido ou expirado');
      setDialogVisible(true);
    } finally{
      setLoading(false);
    }
  };

  const handleNavigateToLogin = () => {
    navigation.navigate('Login');
  };

  if (enviado) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <View style={styles.formContainer}>
              <Text style={{ fontSize: 18, color: colors.text.primary, fontWeight: '700', marginBottom: 12 }}>Redefinir senha</Text>
              <Text style={{ color: colors.text.secondary, marginBottom: 16 }}>Enviamos um código para {email}. Informe abaixo para criar sua nova senha.</Text>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Código recebido</Text>
                <Input value={code} onChangeText={setCode} placeholder="123456" keyboardType="number-pad" />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Nova senha</Text>
                <Input value={novaSenha} onChangeText={setNovaSenha} placeholder="••••••••" secureTextEntry />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Confirmar nova senha</Text>
                <Input value={confirmar} onChangeText={setConfirmar} placeholder="••••••••" secureTextEntry />
              </View>

              <Button title="Redefinir senha" onPress={handleReset} loading={loading} />
              <TouchableOpacity onPress={() => { setEnviado(false); setCode(''); setNovaSenha(''); setConfirmar(''); }} style={{ alignSelf: 'center', marginTop: 12 }}>
                <Text style={{ color: colors.primary.main, fontWeight: '600' }}>Voltar</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
        <Modal visible={dialogVisible} transparent animationType="fade" onRequestClose={() => setDialogVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text.primary, marginBottom: 12 }}>{dialogTitle}</Text>
              <Text style={{ color: colors.text.secondary, marginBottom: 16 }}>{dialogMessage}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                <TouchableOpacity onPress={() => {
                  const goingToLogin = dialogTitle === 'Sucesso' && dialogMessage.includes('Senha redefinida');
                  setDialogVisible(false);
                  if (goingToLogin) navigation.navigate('Login');
                }} style={{ paddingVertical:12, paddingHorizontal:16, backgroundColor: colors.primary.main, borderRadius: 12 }}>
                  <Text style={{ color:'#fff', fontWeight:'700' }}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

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

          {/* Logo e título */}
          <View style={styles.headerContainer}>
            <Image 
              source={require('../../assets/logos/panela_icon_sem_fundo_com_texto.png')} 
              style={styles.logo} 
              resizeMode="contain" 
            />
            <Text style={styles.title}>Esqueceu sua senha?</Text>
            <Text style={styles.subtitle}>
              Digite seu email e enviaremos um link para redefinir sua senha
            </Text>
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

            {/* Botão Enviar */}
            <Button 
              title="Enviar link de recuperação" 
              onPress={handleSubmit} 
              loading={loading}
              style={styles.submitButton}
            />

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
      <Modal visible={dialogVisible} transparent animationType="fade" onRequestClose={() => setDialogVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text.primary, marginBottom: 12 }}>{dialogTitle}</Text>
            <Text style={{ color: colors.text.secondary, marginBottom: 16 }}>{dialogMessage}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <TouchableOpacity onPress={() => {
                const goingToLogin = dialogTitle === 'Sucesso' && dialogMessage.includes('Senha redefinida');
                setDialogVisible(false);
                if (goingToLogin) navigation.navigate('Login');
              }} style={{ paddingVertical:12, paddingHorizontal:16, backgroundColor: colors.primary.main, borderRadius: 12 }}>
                <Text style={{ color:'#fff', fontWeight:'700' }}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  
  // Header
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 200,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Formulário
  formContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: 24,
    padding: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldContainer: {
    marginBottom: 16,
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
  
  // Botão enviar
  submitButton: {
    marginBottom: 8,
  },
  
  // Estado de sucesso
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successTitle: {
    fontSize: 24,
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emailText: {
    fontWeight: '600',
    color: colors.primary.main,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
});
