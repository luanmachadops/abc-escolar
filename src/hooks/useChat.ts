import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from './useUserData';
import { notifications } from '@mantine/notifications';

export interface ChatUser {
  id: string;
  nome_completo: string;
  email: string;
  funcao: 'admin' | 'secretario' | 'professor' | 'aluno';
  avatar_url?: string;
}

export interface Conversation {
  id: string;
  titulo?: string;
  tipo: 'individual' | 'grupo' | 'turma';
  criado_por: string;
  turma_id?: string;
  created_at: string;
  updated_at: string;
  participantes: ChatUser[];
  ultima_mensagem?: {
    id: string;
    conteudo: string;
    remetente_nome: string;
    created_at: string;
  };
  mensagens_nao_lidas: number;
}

export interface Message {
  id: string;
  conversa_id: string;
  remetente_id: string;
  remetente_nome: string;
  remetente_avatar?: string;
  conteudo: string;
  tipo: 'texto' | 'arquivo' | 'imagem';
  arquivo_url?: string;
  criado_em: string;
  lida: boolean;
}

export const useChat = () => {
  const { user } = useAuth();
  const { userData } = useUserData();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<ChatUser[]>([]);

  // Carregar usuários disponíveis para chat
  const loadUsers = useCallback(async () => {
    // Verificar se o usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('Chat - Usuário não autenticado, pulando busca de usuários');
      return;
    }
    
    if (!userData?.escola_id) {
      console.log('Chat - Escola não identificada, pulando busca de usuários');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome_completo, email, funcao')
        .eq('escola_id', userData.escola_id)
        .eq('ativo', true)
        .neq('id', userData.id);

      if (error) {
        console.error('Erro ao carregar usuários do chat:', error);
        return;
      }
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  }, [userData]);

  // Carregar conversas do usuário
  const loadConversations = useCallback(async () => {
    // Verificar se o usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('Chat - Usuário não autenticado, pulando busca de conversas');
      return;
    }
    
    if (!userData?.id) {
      console.log('Chat - Dados do usuário não carregados, pulando busca de conversas');
      return;
    }

    setLoading(true);
    try {
      const { data: conversasData, error } = await supabase
        .from('conversas')
        .select(`
          id,
          titulo,
          tipo,
          criado_por,
          turma_id,
          created_at,
          updated_at,
          conversa_participantes!inner(
            usuario_id,
            usuarios(
              id,
              nome_completo,
              email,
              funcao
            )
          )
        `)
        .eq('conversa_participantes.usuario_id', userData.id)
        .eq('conversa_participantes.ativo', true)
        .eq('ativo', true)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar conversas:', error);
        setLoading(false);
        return;
      }

      // Processar conversas e carregar última mensagem + contagem não lidas
      const conversasProcessadas = await Promise.all(
        (conversasData || []).map(async (conversa: any) => {
          // Carregar participantes
          const { data: participantesData } = await supabase
            .from('conversa_participantes')
            .select(`
              usuarios(
                id,
                nome_completo,
                email,
                funcao
              )
            `)
            .eq('conversa_id', conversa.id)
            .eq('ativo', true);

          const participantes = participantesData?.map((p: any) => p.usuarios) || [];

          // Carregar última mensagem
          const { data: ultimaMensagem } = await supabase
            .from('mensagens')
            .select(`
              id,
              conteudo,
              created_at,
              remetente_id
            `)
            .eq('conversa_id', conversa.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Buscar nome do remetente separadamente se houver mensagem
          let remetenteNome = 'Usuário';
          if (ultimaMensagem) {
            const { data: remetenteData } = await supabase
              .from('usuarios')
              .select('nome_completo')
              .eq('id', ultimaMensagem.remetente_id)
              .maybeSingle();
            remetenteNome = remetenteData?.nome_completo || 'Usuário';
          }

          // Contar mensagens não lidas (simplificado)
          const { count: naoLidas } = await supabase
            .from('mensagens')
            .select('id', { count: 'exact' })
            .eq('conversa_id', conversa.id)
            .neq('remetente_id', userData.id);

          return {
            id: conversa.id,
            titulo: conversa.titulo,
            tipo: conversa.tipo,
            criado_por: conversa.criado_por,
            turma_id: conversa.turma_id,
            created_at: conversa.created_at,
            updated_at: conversa.updated_at,
            participantes,
            ultima_mensagem: ultimaMensagem ? {
              id: ultimaMensagem.id,
              conteudo: ultimaMensagem.conteudo,
              remetente_nome: remetenteNome,
              created_at: ultimaMensagem.created_at
            } : undefined,
            mensagens_nao_lidas: naoLidas || 0
          };
        })
      );

      setConversations(conversasProcessadas);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      notifications.show({
        title: 'Erro',
        message: 'Erro ao carregar conversas',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  }, [userData]);

  // Carregar mensagens de uma conversa
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mensagens')
        .select(`
          id,
          conversa_id,
          remetente_id,
          conteudo,
          tipo,
          arquivo_url,
          created_at
        `)
        .eq('conversa_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Buscar nomes dos remetentes
      const remetentesIds = [...new Set((data || []).map((msg: any) => msg.remetente_id))];
      const { data: remetentesData } = await supabase
        .from('usuarios')
        .select('id, nome_completo')
        .in('id', remetentesIds);

      const remetentesMap = new Map(
        (remetentesData || []).map((user: any) => [user.id, user.nome_completo])
      );

      const mensagensProcessadas = (data || []).map((msg: any) => ({
        id: msg.id,
        conversa_id: msg.conversa_id,
        remetente_id: msg.remetente_id,
        remetente_nome: remetentesMap.get(msg.remetente_id) || 'Usuário',
        conteudo: msg.conteudo,
        tipo: msg.tipo,
        arquivo_url: msg.arquivo_url,
        criado_em: msg.created_at,
        lida: false // Será atualizado conforme necessário
      }));

      setMessages(mensagensProcessadas);

      // Marcar mensagens como lidas
      await markMessagesAsRead(conversationId);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      notifications.show({
        title: 'Erro',
        message: 'Erro ao carregar mensagens',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Enviar mensagem
  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!userData?.id || !content.trim()) return;

    try {
      const { data, error } = await supabase
        .from('mensagens')
        .insert({
          conversa_id: conversationId,
          remetente_id: userData.id,
          conteudo: content.trim(),
          tipo: 'texto'
        })
        .select(`
          id,
          conversa_id,
          remetente_id,
          conteudo,
          tipo,
          created_at
        `)
        .single();

      if (error) throw error;

      const novaMensagem: Message = {
        id: data.id,
        conversa_id: data.conversa_id,
        remetente_id: data.remetente_id,
        remetente_nome: userData.nome_completo,
        conteudo: data.conteudo,
        tipo: data.tipo,
        criado_em: data.created_at,
        lida: true
      };

      setMessages(prev => [...prev, novaMensagem]);
      
      // Atualizar lista de conversas
      await loadConversations();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      notifications.show({
        title: 'Erro',
        message: 'Erro ao enviar mensagem',
        color: 'red'
      });
    }
  }, [userData, loadConversations]);

  // Criar nova conversa
  const createConversation = useCallback(async (participantIds: string[], titulo?: string, tipo: 'individual' | 'grupo' = 'individual') => {
    if (!userData?.id) return null;

    try {
      // Para conversa individual, usar função específica
      if (tipo === 'individual' && participantIds.length === 1) {
        const { data, error } = await supabase.rpc('criar_conversa_individual', {
          p_usuario1_id: userData.id,
          p_usuario2_id: participantIds[0]
        });

        if (error) throw error;
        
        await loadConversations();
        return data;
      }

      // Para conversas em grupo
      const { data: conversa, error } = await supabase
        .from('conversas')
        .insert({
          escola_id: userData.escola_id,
          titulo,
          tipo,
          criado_por: userData.id
        })
        .select('id')
        .single();

      if (error) throw error;

      // Adicionar participantes
      const participantes = [userData.id, ...participantIds].map(userId => ({
        conversa_id: conversa.id,
        usuario_id: userId
      }));

      const { error: participantesError } = await supabase
        .from('conversa_participantes')
        .insert(participantes);

      if (participantesError) throw participantesError;

      await loadConversations();
      return conversa.id;
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      notifications.show({
        title: 'Erro',
        message: 'Erro ao criar conversa',
        color: 'red'
      });
      return null;
    }
  }, [userData, loadConversations]);

  // Marcar mensagens como lidas
  const markMessagesAsRead = useCallback(async (conversationId: string) => {
    if (!userData?.id) return;

    try {
      const { data: mensagensNaoLidas } = await supabase
        .from('mensagens')
        .select('id')
        .eq('conversa_id', conversationId)
        .neq('remetente_id', userData.id);

      if (mensagensNaoLidas && mensagensNaoLidas.length > 0) {
        const leituras = mensagensNaoLidas.map(msg => ({
          mensagem_id: msg.id,
          usuario_id: userData.id
        }));

        await supabase
          .from('mensagem_leituras')
          .upsert(leituras, { onConflict: 'mensagem_id,usuario_id' });
      }
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  }, [userData]);

  // Configurar real-time subscriptions
  useEffect(() => {
    if (!userData?.id) return;

    const channel = supabase
      .channel('chat-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens'
        },
        (payload) => {
          if (payload.new.conversa_id === selectedConversationId) {
            loadMessages(selectedConversationId);
          }
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversas'
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData, selectedConversationId, loadMessages, loadConversations]);

  // Carregar dados iniciais
  useEffect(() => {
    if (userData?.id) {
      loadUsers();
      loadConversations();
    }
  }, [userData, loadUsers, loadConversations]);

  // Carregar mensagens quando conversa é selecionada
  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
    } else {
      setMessages([]);
    }
  }, [selectedConversationId, loadMessages]);

  // Filtrar usuários por nível de acesso conforme regras específicas
  const getFilteredUsers = () => {
    if (!userData) return [];
    
    switch (userData.funcao) {
      case 'admin':
      case 'secretario':
        // Admin e secretário podem conversar com todos da escola
        return users;
      case 'professor':
        // Professor pode conversar com admin, secretário e alunos de suas turmas
        return users.filter(user => 
          ['admin', 'secretario'].includes(user.funcao) ||
          (user.funcao === 'aluno' && isAlunoFromProfessorTurmas(user.id))
        );
      case 'aluno':
        // Aluno pode conversar apenas com admin, secretário e professores (conversas individuais)
        // Grupos de turma são automáticos
        return users.filter(user => 
          ['admin', 'secretario', 'professor'].includes(user.funcao)
        );
      default:
        return [];
    }
  };

  // Verificar se aluno faz parte das turmas do professor
  const isAlunoFromProfessorTurmas = (alunoId: string) => {
    // Esta verificação seria feita no backend, aqui é apenas placeholder
    // A lógica real está nas políticas RLS do banco
    return true;
  };

  return {
    conversations,
    messages,
    selectedConversationId,
    setSelectedConversationId,
    users,
    filteredUsers: getFilteredUsers(),
    loading,
    sendMessage,
    createConversation,
    loadConversations,
    markMessagesAsRead
  };
};

export default useChat;