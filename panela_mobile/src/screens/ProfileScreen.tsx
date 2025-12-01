import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
// Importa apenas quando necessário para evitar crash se módulo nativo não estiver presente
import { api } from '../services/api';
import { API_URL } from '../config/api';
import { useAuthStore } from '../store/auth';
import { colors } from '../constants/colors';
import { User, Mail, CreditCard, Lock, Camera, Save, ArrowLeft } from 'lucide-react-native';
import Button from '../components/Button';

export default function ProfileScreen({ navigation }: any){
  const { user, updateProfile, updatePassword } = useAuthStore();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [nome, setNome] = useState(user?.nome || '');
  const [chavePix, setChavePix] = useState(user?.chavePix || '');
  
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const defaultAvatar = require('../../assets/logos/default.png');
  useEffect(() => {
    if (user?.id){
      const base = API_URL.replace(/\/api$/, '');
      setAvatarUri(`${base}/avatars/${user.id}.jpg?t=${Date.now()}`);
      setAvatarError(false);
    }
  }, [user?.id]);

  const changePhoto = async () => {
    let ImagePicker: any;
    try {
      ImagePicker = await import('expo-image-picker');
    } catch (e) {
      Alert.alert('Erro', 'Módulo de imagem não disponível neste build');
      return;
    }
    let perm: any;
    try {
      if (typeof ImagePicker.requestMediaLibraryPermissionsAsync === 'function') {
        perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) return;
      }
    } catch (e) {
      Alert.alert('Erro', 'Permissão de mídia indisponível neste build');
      return;
    }
    let res: any;
    try{
      const mediaTypes = ImagePicker?.MediaTypeOptions?.Images ?? undefined;
      if (typeof ImagePicker.launchImageLibraryAsync !== 'function') {
        Alert.alert('Erro', 'Função de galeria indisponível neste build');
        return;
      }
      res = await ImagePicker.launchImageLibraryAsync({ mediaTypes, quality: 0.8 });
    } catch(err){
      Alert.alert('Erro', 'Falha ao abrir galeria de imagens');
      return;
    }
    if (res.canceled) return;
    const asset = res.assets[0];
    const form = new FormData();
    (form as any).append('file', {
      uri: asset.uri,
      name: 'avatar.jpg',
      type: 'image/jpeg',
    });
    try{
      await api.post('/auth/profile/photo', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const base = API_URL.replace(/\/api$/, '');
      setAvatarUri(`${base}/avatars/${user?.id}.jpg?t=${Date.now()}`);
      setAvatarError(false);
    } catch(err){
      Alert.alert('Erro', 'Falha ao enviar foto');
    }
  };

  const handleSaveProfile = async () => {
    if (!nome.trim()) {
      setDialogTitle('Erro');
      setDialogMessage('Nome é obrigatório');
      setDialogVisible(true);
      return;
    }
    
    try {
      await updateProfile(nome, chavePix);
      setIsEditingProfile(false);
      setDialogTitle('Sucesso');
      setDialogMessage('Perfil atualizado com sucesso!');
      setDialogVisible(true);
    } catch (error) {
      setDialogTitle('Erro');
      setDialogMessage('Erro ao atualizar perfil');
      setDialogVisible(true);
    }
  };

  const handleChangePassword = async () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setDialogTitle('Erro');
      setDialogMessage('Preencha todos os campos');
      setDialogVisible(true);
      return;
    }
    
    if (novaSenha !== confirmarSenha) {
      setDialogTitle('Erro');
      setDialogMessage('As senhas não coincidem');
      setDialogVisible(true);
      return;
    }
    
    if (novaSenha.length < 6) {
      setDialogTitle('Erro');
      setDialogMessage('A nova senha deve ter pelo menos 6 caracteres');
      setDialogVisible(true);
      return;
    }
    
    try {
      await updatePassword(senhaAtual, novaSenha);
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setIsChangingPassword(false);
      setDialogTitle('Sucesso');
      setDialogMessage('Senha alterada com sucesso!');
      setDialogVisible(true);
    } catch (error) {
      setDialogTitle('Erro');
      setDialogMessage('Erro ao alterar senha');
      setDialogVisible(true);
    }
  };

  const cancelEdit = () => {
    setNome(user?.nome || '');
    setChavePix(user?.chavePix || '');
    setIsEditingProfile(false);
  };

  const cancelPasswordChange = () => {
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmarSenha('');
    setIsChangingPassword(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#059669', '#10b981']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text.inverse} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <Text style={styles.headerSubtitle}>Gerencie suas informações pessoais</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Foto de Perfil */}
        <View style={styles.profilePhotoSection}>
          <View style={styles.avatarContainer}>
          <Image
            source={avatarError || !avatarUri ? defaultAvatar : { uri: avatarUri }}
            style={styles.avatar}
            onError={() => setAvatarError(true)}
          />
          <TouchableOpacity style={styles.cameraButton} onPress={changePhoto}>
            <Camera size={20} color={colors.primary.main} />
          </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{nome}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Informações Pessoais */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Informações Pessoais</Text>
            {!isEditingProfile && (
              <TouchableOpacity onPress={() => setIsEditingProfile(true)}>
                <Text style={styles.editButton}>Editar</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.formGroup}>
            <View style={styles.labelContainer}>
              <User size={16} color={colors.text.secondary} />
              <Text style={styles.label}>Nome completo</Text>
            </View>
            <TextInput
              value={nome}
              onChangeText={setNome}
              editable={isEditingProfile}
              style={[styles.input, !isEditingProfile && styles.inputDisabled]}
              placeholder="Seu nome completo"
            />
          </View>

          <View style={styles.formGroup}>
            <View style={styles.labelContainer}>
              <Mail size={16} color={colors.text.secondary} />
              <Text style={styles.label}>E-mail</Text>
            </View>
            <TextInput
              value={user?.email}
              editable={false}
              style={[styles.input, styles.inputDisabled]}
            />
            <Text style={styles.helpText}>O e-mail não pode ser alterado</Text>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.labelContainer}>
              <CreditCard size={16} color={colors.text.secondary} />
              <Text style={styles.label}>Chave PIX</Text>
            </View>
            <TextInput
              value={chavePix}
              onChangeText={setChavePix}
              editable={isEditingProfile}
              style={[styles.input, !isEditingProfile && styles.inputDisabled]}
              placeholder="Email, telefone, CPF ou chave aleatória"
            />
          </View>

          {isEditingProfile && (
            <View style={styles.buttonGroup}>
              <TouchableOpacity onPress={cancelEdit} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <Button title="Salvar Alterações" onPress={handleSaveProfile} />
            </View>
          )}
        </View>

        {/* Segurança */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Segurança</Text>
            {!isChangingPassword && (
              <TouchableOpacity onPress={() => setIsChangingPassword(true)}>
                <Text style={styles.editButton}>Alterar senha</Text>
              </TouchableOpacity>
            )}
          </View>

          {isChangingPassword ? (
            <View>
              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Lock size={16} color={colors.text.secondary} />
                  <Text style={styles.label}>Senha atual</Text>
                </View>
                <TextInput
                  value={senhaAtual}
                  onChangeText={setSenhaAtual}
                  secureTextEntry
                  style={styles.input}
                  placeholder="••••••••"
                />
              </View>

              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Lock size={16} color={colors.text.secondary} />
                  <Text style={styles.label}>Nova senha</Text>
                </View>
                <TextInput
                  value={novaSenha}
                  onChangeText={setNovaSenha}
                  secureTextEntry
                  style={styles.input}
                  placeholder="••••••••"
                />
              </View>

              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Lock size={16} color={colors.text.secondary} />
                  <Text style={styles.label}>Confirmar nova senha</Text>
                </View>
                <TextInput
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                  secureTextEntry
                  style={styles.input}
                  placeholder="••••••••"
                />
                {novaSenha && confirmarSenha && novaSenha !== confirmarSenha && (
                  <Text style={styles.errorText}>As senhas não coincidem</Text>
                )}
              </View>

              <View style={styles.buttonGroup}>
                <TouchableOpacity onPress={cancelPasswordChange} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <Button title="Salvar Nova Senha" onPress={handleChangePassword} />
              </View>
            </View>
          ) : (
            <Text style={styles.helpText}>Clique em "Alterar senha" para modificar sua senha de acesso</Text>
          )}
        </View>

        {/* Informações da Conta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações da Conta</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Membro desde:</Text>
            <Text style={styles.infoValue}>Novembro de 2024</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status da conta:</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Ativa</Text>
            </View>
          </View>
        </View>

      </ScrollView>
      <Modal visible={dialogVisible} transparent animationType="fade" onRequestClose={() => setDialogVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text.primary, marginBottom: 12 }}>{dialogTitle}</Text>
            <Text style={{ color: colors.text.secondary, marginBottom: 16 }}>{dialogMessage}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <Button title="OK" onPress={() => setDialogVisible(false)} />
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
  header: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  scrollContent: {
    paddingBottom: 32,
  },
  profilePhotoSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.text.inverse,
    fontSize: 32,
    fontWeight: '700',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: colors.border,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  section: {
    backgroundColor: colors.background.primary,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  editButton: {
    color: colors.primary.main,
    fontSize: 14,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.input,
  },
  inputDisabled: {
    backgroundColor: colors.background.tertiary,
    color: colors.text.muted,
  },
  helpText: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: colors.error.main,
    marginTop: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: colors.success.light,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: colors.success.dark,
    fontSize: 12,
    fontWeight: '600',
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
