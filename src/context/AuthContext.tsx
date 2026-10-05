import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { db } from '../db';
import type { User } from '../types';
import { generateId, hashPassword, verifyPassword } from '../utils/helpers';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (data: { firstName: string; lastName: string; phone: string; email: string; password: string }) => Promise<string | null>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true, login: async () => null, register: async () => null,
  logout: () => {}, updateProfile: async () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('hissob_user_id');
    if (userId) {
      db.users.get(userId).then(u => {
        if (u) setUser(u);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<string | null> => {
    const found = await db.users.where('email').equals(email).first();
    if (!found) return "Bunday foydalanuvchi topilmadi";
    if (!verifyPassword(password, found.passwordHash)) return "Parol noto'g'ri";
    setUser(found);
    localStorage.setItem('hissob_user_id', found.id);
    return null;
  };

  const register = async (data: { firstName: string; lastName: string; phone: string; email: string; password: string }): Promise<string | null> => {
    const existing = await db.users.where('email').equals(data.email).first();
    if (existing) return "Bu email allaqachon ro'yxatdan o'tgan";
    const user: User = {
      id: generateId(),
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: data.email,
      passwordHash: hashPassword(data.password),
      createdAt: new Date().toISOString()
    };
    await db.users.add(user);
    setUser(user);
    localStorage.setItem('hissob_user_id', user.id);
    return null;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hissob_user_id');
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    await db.users.update(user.id, updated);
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
