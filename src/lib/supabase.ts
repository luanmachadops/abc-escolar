import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase usando variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jvlhtutgyskvqpzfwahv.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2bGh0dXRneXNrdnFwemZ3YWh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NzI5MzIsImV4cCI6MjA2NzI0ODkzMn0.neg316iIA7W8rUyUR_Sc2glpjnWuqGanTpw4WLcRWig'
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

// Cliente principal para operações normais
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente admin para operações administrativas (apenas quando service key estiver disponível)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Tipos para autenticação e dados do usuário
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'secretary' | 'teacher' | 'student';
  name: string;
  created_at: string;
}

// Tipos para as tabelas do banco de dados
export type UserRole = 'admin' | 'secretario' | 'professor' | 'aluno';

export interface DatabaseUser {
  id: string;
  auth_user_id: string;
  escola_id: string;
  nome_completo: string;
  email: string;
  telefone?: string;
  funcao: UserRole;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Escola {
  id: string;
  nome_instituicao: string;
  cnpj_cpf: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade: string;
  pais: string;
  telefone?: string;
  email?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// Funções de autenticação
export const authService = {
  // Login
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Cadastro
  async signUp(email: string, password: string, userData: { name: string; role: UserRole }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { data, error }
  },

  // Logout
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Obter usuário atual
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Verificar sessão
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }
}