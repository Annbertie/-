import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

/** 从 profiles 表获取用户额外信息 */
const fetchProfile = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }
  return data as User;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        localStorage.removeItem('user');
        setUser(null);
        return;
      }

      const profile = await fetchProfile(session.user.id);
      if (profile) {
        setUser(profile);
        localStorage.setItem('user', JSON.stringify(profile));
      } else {
        localStorage.removeItem('user');
        setUser(null);
      }
    } catch {
      localStorage.removeItem('user');
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // 监听 auth 状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session) {
          localStorage.removeItem('user');
          setUser(null);
          setLoading(false);
          return;
        }

        const profile = await fetchProfile(session.user.id);
        if (profile) {
          setUser(profile);
          localStorage.setItem('user', JSON.stringify(profile));
        } else {
          localStorage.removeItem('user');
          setUser(null);
        }
        setLoading(false);
      }
    );

    // 初始化：先尝试用缓存的 user 快速显示，再从服务端验证
    const init = async () => {
      const cachedUser = localStorage.getItem('user');
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser) as User);
        } catch {
          // ignore parse error
        }
      }

      // 通过 getSession 验证当前 session 是否有效
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        localStorage.removeItem('user');
        setUser(null);
        setLoading(false);
        return;
      }

      await fetchUser();
      setLoading(false);
    };

    init();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUser]);

  const login = useCallback((token: string, userData: User) => {
    // Supabase 自己管理 session（token），这里只缓存用户信息用于快速显示
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('未登录');

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', session.user.id);

    if (error) throw error;

    await fetchUser();
  }, [fetchUser]);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, updateProfile, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};
