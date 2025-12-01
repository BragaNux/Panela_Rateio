import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import DashboardScreen from '../screens/DashboardScreen';
import GroupsListScreen from '../screens/GroupsListScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import GroupDetailScreen from '../screens/GroupDetailScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import ExpensesSummaryScreen from '../screens/ExpensesSummaryScreen';
import FinalizedGroupScreen from '../screens/FinalizedGroupScreen';
import AddMemberScreen from '../screens/AddMemberScreen';
import RateioScreen from '../screens/RateioScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FriendsScreen from '../screens/FriendsScreen';
import FriendDetailScreen from '../screens/FriendDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import { useAuthStore } from '../store/auth';
import { Home, Users, PlusCircle, User, PercentCircle } from 'lucide-react-native';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function MainTabs(){
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false, tabBarShowLabel: true }}>
      <Tabs.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="Grupos"
        component={GroupsListScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Users color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="CriarGrupo"
        component={CreateGroupScreen}
        options={{
          title: 'Criar Grupo',
          tabBarIcon: ({ color, size }) => <PlusCircle color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="Amigos"
        component={FriendsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <User color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="Rateio"
        component={RateioScreen}
        options={{
          tabBarIcon: ({ color, size }) => <PercentCircle color={color as string} size={size} />,
        }}
      />
    </Tabs.Navigator>
  );
}

export function RootNavigator(){
  const { token } = useAuthStore();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!token ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Registro" component={RegisterScreen} />
          <Stack.Screen name="EsqueciSenha" component={ForgotPasswordScreen} options={{ title: 'Esqueci a Senha' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Grupo" component={GroupDetailScreen} />
          <Stack.Screen 
            name="DespesaDetalhe" 
            component={require('../screens/ExpenseDetailScreen').default}
            options={{
              animation: 'fade',
            }}
          />
          <Stack.Screen name="Despesa" component={AddExpenseScreen} />
          <Stack.Screen name="Resumo" component={ExpensesSummaryScreen} />
          <Stack.Screen name="Finalizado" component={FinalizedGroupScreen} />
          <Stack.Screen name="Membro" component={AddMemberScreen} />
          <Stack.Screen name="Perfil" component={ProfileScreen} options={{ title: 'Meu Perfil' }} />
          <Stack.Screen name="AmigoDetalhe" component={FriendDetailScreen} />
          <Stack.Screen name="Notificacoes" component={NotificationsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
