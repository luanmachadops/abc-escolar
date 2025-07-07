import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { authService, supabase, UserRole } from '../lib/supabase';
import { useUserAccess } from '../hooks/useUserAccess';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isFirstTime: boolean;
  signIn: (identifier: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, userData: { name: string; role: UserRole }) => Promise<any>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkFirstTime: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const { checkFirstTime: checkFirstTimeHook, detectIdentifierType } = useUserAccess();

  useEffect(() => {
    // Verificar se há uma sessão ativa
    const checkSession = async () => {
      try {
        const session = await authService.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signIn = async (identifier: string, password: string) => {
    try {
      let email = identifier;
      
      // Detectar tipo de identificador
      const identifierType = detectIdentifierType(identifier);
      
      // Se não for email, buscar o email correspondente no banco
      if (identifierType !== 'email') {
        let query = supabase.from('usuarios').select('email');
        
        if (identifierType === 'cpf') {
          query = query.eq('cpf', identifier.replace(/[^\d]/g, ''));
        } else if (identifierType === 'ra') {
          query = query.eq('ra', identifier);
        } else {
          // Tentar buscar por RA ou CPF se tipo for desconhecido
          const cleanIdentifier = identifier.replace(/[^\d]/g, '');
          if (cleanIdentifier.length === 11) {
            query = query.eq('cpf', cleanIdentifier);
          } else {
            query = query.eq('ra', identifier);
          }
        }
        
        const { data: userData, error: searchError } = await query.maybeSingle();
        
        if (searchError || !userData) {
          return {
            data: { user: null, session: null },
            error: { message: 'Usuário não encontrado' }
          };
        }
        
        email = userData.email;
      }
      
      // Fazer login com o email encontrado
      const { data, error } = await authService.signIn(email, password);
      
      if (data.user) {
        setUser(data.user);
        // Verificar se é primeira vez após login bem-sucedido
        const firstTime = await checkFirstTimeHook();
        setIsFirstTime(firstTime);
      }
      
      return { data, error };
    } catch (error) {
      console.error('Erro no login:', error);
      return {
        data: { user: null, session: null },
        error: { message: 'Erro interno no sistema de login' }
      };
    }
  };

  const signUp = async (email: string, password: string, userData: { name: string; role: UserRole }) => {
    const { data, error } = await authService.signUp(email, password, userData);
    if (data.user) {
      setUser(data.user);
    }
    return { data, error };
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        const firstTime = await checkFirstTimeHook();
        setIsFirstTime(firstTime);
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
  };

  const checkFirstTime = async (): Promise<boolean> => {
    const firstTime = await checkFirstTimeHook();
    setIsFirstTime(firstTime);
    return firstTime;
  };

  return (
    <AuthContext.Provider value={{ user, loading, isFirstTime, signIn, signUp, signOut, refreshUser, checkFirstTime }}>
      {children}
    </AuthContext.Provider>
  );
};