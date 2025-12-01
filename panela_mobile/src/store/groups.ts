import { create } from 'zustand';
import { api } from '../services/api';

export interface Group {
  id: string;
  nome: string;
  descricao?: string;
  creatorId: string;
  createdAt: string;
  finalizado: boolean;
  finalizadoEm?: string;
  memberCount?: number;
  totalExpense?: number;
  creatorName?: string;
}

interface GroupsState {
  groups: Group[];
  currentGroup: Group | null;
  isLoading: boolean;
  
  fetchGroups: () => Promise<void>;
  createGroup: (nome: string, descricao?: string, membrosUserIds?: string[]) => Promise<void>;
  getGroup: (id: string) => Promise<Group>;
  setCurrentGroup: (group: Group | null) => void;
}

export const useGroupsStore = create<GroupsState>((set, get) => ({
  groups: [],
  currentGroup: null,
  isLoading: false,
  
  fetchGroups: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/groups');
      const baseGroups = response.data as Group[];
      const withMetrics = await Promise.all(
        baseGroups.map(async (g: any) => {
          try {
            const [expRes, memRes] = await Promise.all([
              api.get(`/expenses/group/${g.id}`),
              api.get(`/groups/${g.id}/members`),
            ]);
            const totalExpense = (expRes.data || []).reduce((sum: number, e: any) => sum + (e.Amount ?? e.amount ?? 0), 0);
            const memberCount = (memRes.data || []).length;
            const creatorId = g.CreatorId ?? g.creatorId;
            const creatorName = (memRes.data || []).find((m: any) => (m.UserId ?? m.userId) === creatorId)?.Nome ?? undefined;
            return { ...g, totalExpense, memberCount, creatorName } as Group;
          } catch {
            return { ...g } as Group;
          }
        })
      );
      const sorted = [...withMetrics].sort((a, b) => {
        if (a.finalizado === b.finalizado) return 0;
        return a.finalizado ? 1 : -1;
      });
      set({ groups: sorted });
    } catch (error) {
      console.error('Error fetching groups:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  createGroup: async (nome: string, descricao?: string, membrosUserIds?: string[]) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/groups', { Nome: nome, Descricao: descricao, MembrosUserIds: membrosUserIds });
      const newGroup = response.data;
      set((state) => ({ groups: [...state.groups, newGroup] }));
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  getGroup: async (id: string) => {
    try {
      const response = await api.get(`/groups/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting group:', error);
      throw error;
    }
  },
  
  setCurrentGroup: (group: Group | null) => {
    set({ currentGroup: group });
  },
}));

export const useGroups = () => {
  const {
    groups,
    isLoading,
    fetchGroups,
    createGroup,
    getGroup,
    setCurrentGroup
  } = useGroupsStore();
  return {
    grupos: groups,
    carregando: isLoading,
    carregar: fetchGroups,
    criar: createGroup,
    obter: getGroup,
    definirAtual: setCurrentGroup
  };
};
