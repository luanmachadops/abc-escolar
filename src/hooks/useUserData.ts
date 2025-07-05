import { useState, useEffect } from 'react';
import { supabase, DatabaseUser, Escola, UserRole } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// Usar os tipos importados do supabase.ts
export type UserData = DatabaseUser;
export type EscolaData = Escola;

export const useUserData = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [escolaData, setEscolaData] = useState<EscolaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setUserData(null);
        setEscolaData(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Buscar dados do usuário na tabela usuarios
        const { data: userDataResult, error: userError } = await supabase
          .from('usuarios')
          .select(`
            *,
            escola:escolas(
              id,
              nome_instituicao,
              cnpj_cpf,
              logradouro,
              numero,
              bairro,
              cep,
              cidade,
              pais,
              telefone,
              email,
              ativo
            )
          `)
          .eq('auth_user_id', user.id)
          .eq('ativo', true)
          .single();

        if (userError) {
          console.error('Erro ao buscar dados do usuário:', userError);
          setError('Erro ao carregar dados do usuário');
          return;
        }

        if (!userDataResult) {
          setError('Usuário não encontrado');
          return;
        }

        setUserData(userDataResult);
        setEscolaData(userDataResult.escola);
      } catch (err) {
        console.error('Erro inesperado ao buscar dados do usuário:', err);
        setError('Erro inesperado ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Função para atualizar dados do usuário
  const updateUserData = async (updates: Partial<DatabaseUser>) => {
    if (!userData) return { error: 'Usuário não encontrado' };

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update(updates)
        .eq('id', userData.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar dados do usuário:', error);
        return { error: 'Erro ao atualizar dados' };
      }

      setUserData(data);
      return { data, error: null };
    } catch (err) {
      console.error('Erro inesperado ao atualizar dados:', err);
      return { error: 'Erro inesperado ao atualizar dados' };
    }
  };

  // Função para verificar permissões
  const hasPermission = (requiredRoles: string[]) => {
    if (!userData) return false;
    return requiredRoles.includes(userData.funcao);
  };

  // Função para verificar se é admin ou secretário
  const isAdminOrSecretary = () => {
    return hasPermission(['admin', 'secretario']);
  };

  // Função para verificar se é professor
  const isProfessor = () => {
    return hasPermission(['professor']);
  };

  // Função para verificar se é aluno
  const isAluno = () => {
    return hasPermission(['aluno']);
  };

  return {
    userData,
    escolaData,
    loading,
    error,
    updateUserData,
    hasPermission,
    isAdminOrSecretary,
    isProfessor,
    isAluno
  };
};