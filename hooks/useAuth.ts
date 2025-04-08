import { create } from 'zustand';
import { generateVaultId, saveUser, getUsers, findUserByEmail, User } from '@/utils/storage';
import { router } from 'expo-router';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (userData: Omit<User, 'id' | 'vaultId' | 'balance'>) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  signIn: async (userData) => {
    set({ loading: true });
    try {
      // First check if email exists
      const existingUser = await findUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Generate VID first and ensure it's valid
      const vaultId = await generateVaultId();
      if (!vaultId) {
        throw new Error('Failed to generate VID');
      }

      // Create the new user with the generated VID
      const newUser: User = {
        id: uuidv4(),
        vaultId,
        balance: 1000, // Initial balance for new users
        ...userData,
      };

      // Save the user with the complete data
      await saveUser(newUser);
      
      // Update state
      set({ user: newUser, isAuthenticated: true });
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  login: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const users = await getUsers();
      const user = users.find(u => u.email === email);
      if (!user) {
        throw new Error('User not found');
      }
      if (!user.vaultId) {
        throw new Error('Account not properly initialized');
      }
      set({ user, isAuthenticated: true });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  signOut: () => {
    set({ user: null, isAuthenticated: false });
    router.replace('/auth');
  },
  updateUser: (data) => set((state) => ({
    user: state.user ? { ...state.user, ...data } : null,
  })),
}));