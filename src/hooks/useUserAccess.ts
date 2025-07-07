import { useState } from 'react';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { notifications } from '@mantine/notifications';

export interface UserAccessData {
  username?: string;
  password?: string;
  email?: string;
  ficticiousEmail?: string;
  ra?: string;
}

export interface CreateUserAccessParams {
  nome: string;
  email?: string;
  role: 'aluno' | 'professor';
  escola_id: string;
  cpf?: string;
  telefone?: string;
  endereco?: string;
  data_nascimento?: string;
  turma_id?: string; // Para alunos
  disciplinas?: string[]; // Para professores
}

export const useUserAccess = () => {
  const [loading, setLoading] = useState(false);

  // Função para gerar username automático
  const generateUsername = (nome: string, role: 'aluno' | 'professor'): string => {
    const currentYear = new Date().getFullYear();
    const prefix = role === 'aluno' ? 'aluno' : 'prof';
    
    // Normalizar o nome: remover acentos, converter para minúsculas, remover caracteres especiais
    const normalizedName = nome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .toLowerCase()
      .replace(/[^a-z\s]/g, '') // Remove caracteres especiais
      .trim()
      .split(/\s+/) // Divide por espaços
      .filter(part => part.length > 0) // Remove partes vazias
      .slice(0, 2) // Pega no máximo 2 partes do nome para deixar espaço para o timestamp
      .join('.');
    
    // Adicionar timestamp para garantir unicidade
    const timestamp = Date.now().toString().slice(-6); // Últimos 6 dígitos do timestamp
    
    return `${prefix}.${normalizedName}.${currentYear}.${timestamp}`;
  };

  // Função para gerar RA único
  const generateRA = (nomeCompleto: string, anoIngresso?: number): string => {
    const anoAtual = anoIngresso || new Date().getFullYear();
    
    // Extrair iniciais do nome (primeiras letras de cada palavra)
    const iniciais = nomeCompleto
      .toUpperCase()
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 3); // Limitar a 3 caracteres
    
    // Gerar timestamp único
    const timestampSuffix = (Date.now() % 10000).toString().padStart(4, '0');
    
    return `${anoAtual}${iniciais}${timestampSuffix}`;
  };

  // Função para detectar tipo de identificador
  const detectIdentifierType = (identifier: string): 'email' | 'cpf' | 'ra' | 'unknown' => {
    // Remover formatação
    const cleanIdentifier = identifier.replace(/[^\w@.-]/g, '');
    
    // Verificar se é email
    if (/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(cleanIdentifier)) {
      return 'email';
    }
    
    // Verificar se é CPF (11 dígitos)
    if (/^\d{11}$/.test(cleanIdentifier)) {
      return 'cpf';
    }
    
    // Verificar se é RA (formato: AAAAIIIXXXX - ano + iniciais + timestamp)
    if (/^\d{4}[A-Z]{1,3}\d{4}$/.test(cleanIdentifier)) {
      return 'ra';
    }
    
    // Verificar se é número (possível RA simples)
    if (/^\d+$/.test(cleanIdentifier)) {
      return 'ra';
    }
    
    return 'unknown';
  };

  // Função para gerar senha segura
  const generateSecurePassword = (): string => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%&*+-=';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    
    // Garantir pelo menos um caractere de cada tipo
    let password = '';
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Completar com caracteres aleatórios até 12 caracteres
    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Embaralhar a senha
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  // Função para resetar senha de usuário (apenas para administradores)
  const resetUserPassword = async (userId: string, newPassword?: string): Promise<{ success: boolean; password?: string; error?: string }> => {
    setLoading(true);
    
    try {
      // Gerar nova senha se não fornecida
      const password = newPassword || generateSecurePassword();
      
      // Atualizar senha via Supabase Admin API
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId,
        { password }
      );
      
      if (authError) {
        throw new Error(`Erro ao resetar senha: ${authError.message}`);
      }
      
      // Marcar que o usuário precisa alterar a senha no próximo login
      const { error: dbError } = await supabase
        .from('usuarios')
        .update({ primeira_vez: true })
        .eq('auth_user_id', userId);
        
      if (dbError) {
        console.warn('Erro ao marcar primeira_vez:', dbError.message);
        // Não falhar completamente, apenas avisar
      }
      
      notifications.show({
        title: 'Sucesso',
        message: 'Senha resetada com sucesso!',
        color: 'green'
      });
      
      return { success: true, password };
      
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao resetar senha';
      
      notifications.show({
        title: 'Erro',
        message: errorMessage,
        color: 'red'
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Função para alterar senha do próprio usuário
  const changeUserPassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        throw new Error(`Erro ao alterar senha: ${error.message}`);
      }
      
      // Marcar que não é mais primeira vez
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('usuarios')
          .update({ primeira_vez: false })
          .eq('auth_user_id', user.id);
      }
      
      notifications.show({
        title: 'Sucesso',
        message: 'Senha alterada com sucesso!',
        color: 'green'
      });
      
      return { success: true };
      
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao alterar senha';
      
      notifications.show({
        title: 'Erro',
        message: errorMessage,
        color: 'red'
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Função para verificar se é primeira vez do usuário
  const checkFirstTime = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('usuarios')
        .select('primeira_vez')
        .eq('auth_user_id', user.id)
        .single();
        
      if (error || !data) return false;
      
      return data.primeira_vez === true;
    } catch (error) {
      console.error('Erro ao verificar primeira vez:', error);
      return false;
    }
  };

  // Função principal para criar acesso do usuário
  const createUserAccess = async (params: CreateUserAccessParams): Promise<UserAccessData | null> => {
    setLoading(true);
    
    try {
      let email = params.email;
      let username: string | undefined;
      let ficticiousEmail: string | undefined;
      let ra: string | undefined;
      
      // Se não há email, gerar username automático, email fictício e RA (para alunos)
      if (!email) {
        if (params.role === 'aluno') {
          // Para alunos: RA como username
          ra = generateRA(params.nome);
          
          // Verificar se o RA já existe e gerar um novo se necessário
          let raAttempts = 0;
          while (raAttempts < 5) {
            const { data: existingRA } = await supabase
              .from('usuarios')
              .select('id')
              .eq('ra', ra)
              .single();
            
            if (!existingRA) break; // RA disponível
            
            // Gerar novo RA
            raAttempts++;
            ra = generateRA(params.nome);
          }
          
          if (raAttempts >= 5) {
            throw new Error('Não foi possível gerar um RA único após várias tentativas');
          }
          
          // RA é o username para alunos
          username = ra;
          ficticiousEmail = `${ra}@abcescolar.com`;
        } else {
          // Para professores: manter lógica atual
          username = generateUsername(params.nome, params.role);
          ficticiousEmail = `${username}@abcescolar.com`;
        }
        
        email = ficticiousEmail;
        
        // Verificar se o email fictício já existe e gerar um novo se necessário
        let attempts = 0;
        while (attempts < 5) {
          const { data: existingUser } = await supabase
            .from('usuarios')
            .select('id')
            .eq('email', email)
            .single();
          
          if (!existingUser) break; // Email disponível
          
          // Gerar novo username/RA com timestamp diferente
          attempts++;
          if (params.role === 'aluno') {
            ra = generateRA(params.nome);
            username = ra;
            ficticiousEmail = `${ra}@abcescolar.com`;
          } else {
            username = generateUsername(params.nome, params.role);
            ficticiousEmail = `${username}@abcescolar.com`;
          }
          email = ficticiousEmail;
        }
        
        if (attempts >= 5) {
          throw new Error('Não foi possível gerar um email único após várias tentativas');
        }
      }
      
      const password = generateSecurePassword();
      
      // Criar usuário via Supabase Auth (usando admin se disponível, senão signup normal)
      let authData, authError;
      
      if (supabaseAdmin) {
        // Usar admin API se service key estiver disponível
        const result = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            nome: params.nome,
            role: params.role,
            escola_id: params.escola_id,
            username: username || undefined,
            is_ficticious_email: !!ficticiousEmail
          }
        });
        authData = result.data;
        authError = result.error;
      } else {
        // Fallback para signup normal (desenvolvimento local)
        const result = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nome: params.nome,
              role: params.role,
              escola_id: params.escola_id,
              username: username || undefined,
              is_ficticious_email: !!ficticiousEmail
            }
          }
        });
        authData = result.data;
        authError = result.error;
      }
      
      if (authError) {
        // Tratar erros específicos do Supabase Auth
        let errorMessage = 'Erro ao criar usuário';
        
        if (authError.message.includes('User already registered')) {
          errorMessage = 'Este email já está cadastrado no sistema';
        } else if (authError.message.includes('Invalid email')) {
          errorMessage = 'Formato de email inválido';
        } else if (authError.message.includes('Password')) {
          errorMessage = 'Erro na geração da senha';
        } else {
          errorMessage = `Erro ao criar usuário: ${authError.message}`;
        }
        
        throw new Error(errorMessage);
      }
      
      if (!authData.user) {
        throw new Error('Usuário não foi criado corretamente');
      }
      
      // Inserir dados na tabela usuarios
      const { data: usuarioData, error: dbError } = await supabase
        .from('usuarios')
        .insert({
          auth_user_id: authData.user.id,
          nome_completo: params.nome,
          email: email, // Email fictício ou real
          funcao: params.role,
          escola_id: params.escola_id,
          telefone: params.telefone || null,
          ra: ra || null, // RA gerado para alunos
          ativo: true,
          primeira_vez: true // Marcar como primeira vez para forçar alteração de senha
        })
        .select()
        .single();
      
      if (dbError) {
        // Se falhar ao inserir na tabela, tentar deletar o usuário criado
        await supabase.auth.admin.deleteUser(authData.user.id);
        
        // Tratar erros específicos do banco
        let errorMessage = 'Erro ao salvar dados do usuário';
        
        if (dbError.message.includes('duplicate key') || dbError.message.includes('unique')) {
          if (dbError.message.includes('email')) {
            errorMessage = 'Este email já está cadastrado no sistema';
          } else {
            errorMessage = 'Dados duplicados encontrados';
          }
        } else if (dbError.message.includes('check_email_format')) {
          errorMessage = 'Formato de email inválido';
        } else if (dbError.message.includes('foreign key')) {
          errorMessage = 'Erro de referência: verifique se a escola e turma existem';
        } else {
          errorMessage = `Erro ao salvar dados: ${dbError.message}`;
        }
        
        throw new Error(errorMessage);
      }
      
      if (!usuarioData) {
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error('Erro ao obter dados do usuário criado');
      }
      
      // Se for aluno, associar à turma
      if (params.role === 'aluno' && params.turma_id) {
        const { error: turmaError } = await supabase
          .from('aluno_turmas')
          .insert({
            aluno_id: usuarioData.id, // Usar o ID da tabela usuarios, não do auth
            turma_id: params.turma_id
          });
        
        if (turmaError) {
          console.warn('Erro ao associar aluno à turma:', turmaError.message);
          // Não falhar completamente, apenas avisar
        }
      }
      
      // Se for professor, associar às disciplinas
      // Nota: Por enquanto, vamos apenas criar o professor sem associações específicas
      // As associações com disciplinas e turmas serão feitas posteriormente na gestão de turmas
      if (params.role === 'professor' && params.disciplinas && params.disciplinas.length > 0) {
        console.log('Professor criado. Disciplinas serão associadas posteriormente:', params.disciplinas);
        // TODO: Implementar associação com disciplinas quando turmas estiverem definidas
      }
      
      notifications.show({
        title: 'Sucesso',
        message: `${params.role === 'aluno' ? 'Aluno' : 'Professor'} criado com sucesso!`,
        color: 'green'
      });
      
      return {
        username,
        password,
        email: ficticiousEmail || params.email, // Retorna o email fictício se foi gerado, senão o email original
        ficticiousEmail,
        ra
      };
      
    } catch (error) {
      console.error('Erro ao criar acesso:', error);
      notifications.show({
        title: 'Erro',
        message: error instanceof Error ? error.message : 'Erro desconhecido ao criar acesso',
        color: 'red'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    createUserAccess,
    resetUserPassword,
    changeUserPassword,
    checkFirstTime,
    generateUsername,
    generateSecurePassword,
    generateRA,
    detectIdentifierType,
    loading
  };
};