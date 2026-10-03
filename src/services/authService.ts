import { User, CurrencyCode } from '../types';
import { StorageService } from './storageService';

export interface RegisterData {
  name: string;
  email: string;
  currency: CurrencyCode;
  monthlyBudget: number;
  avatarUrl?: string;
  bio?: string;
}

export const AuthService = {
  getCurrentUser: (): User => {
    const users = StorageService.getUsers();
    const activeId = StorageService.getActiveUserId();
    const found = users.find((u) => u.id === activeId);
    if (found) return found;
    return users[0];
  },

  switchUser: (userId: string): User | null => {
    const users = StorageService.getUsers();
    const found = users.find((u) => u.id === userId);
    if (found) {
      StorageService.setActiveUserId(userId);
      return found;
    }
    return null;
  },

  registerUser: (data: RegisterData): User => {
    const users = StorageService.getUsers();
    const newId = `user-${Date.now()}`;
    const defaultAvatars = [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    ];

    const newUser: User = {
      id: newId,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      avatarUrl: data.avatarUrl || defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)],
      currency: data.currency,
      theme: 'dark',
      monthlyBudget: Number(data.monthlyBudget) || 2500,
      bio: data.bio?.trim() || 'Gestor de finanzas personales',
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updatedUsers = [...users, newUser];
    StorageService.saveUsers(updatedUsers);
    StorageService.setActiveUserId(newId);

    // Initialize empty records for the new user
    StorageService.saveExpenses(newId, []);
    StorageService.saveIncomes(newId, []);
    StorageService.saveDebts(newId, []);
    StorageService.saveLoans(newId, []);

    return newUser;
  },

  updateProfile: (updatedUser: Partial<User>): User => {
    const current = AuthService.getCurrentUser();
    const merged: User = { ...current, ...updatedUser };
    const users = StorageService.getUsers().map((u) => (u.id === current.id ? merged : u));
    StorageService.saveUsers(users);
    return merged;
  },

  deleteUser: (userId: string): void => {
    let users = StorageService.getUsers().filter((u) => u.id !== userId);
    if (users.length === 0) {
      // Re-seed demo users if last user was deleted
      users = StorageService.getUsers();
    }
    StorageService.saveUsers(users);
    StorageService.setActiveUserId(users[0].id);
  },
};
