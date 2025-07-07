import React, { useState } from 'react';
import {
  Box,
  Stack,
  Group,
  Text,
  Avatar,
  TextInput,
  ActionIcon,
  Badge,
  Modal,
  Button,
  ScrollArea,
  Paper,
  Flex
} from '@mantine/core';
import { IconSearch, IconPlus, IconUsers } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { supabase } from '../../lib/supabase';
import { Conversation, ChatUser } from '../../hooks/useChat';

interface ChatSidebarProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  filteredUsers: ChatUser[];
  userData: any;
  loading: boolean;
  loadConversations: () => Promise<void>;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  filteredUsers,
  userData,
  loading,
  loadConversations
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [opened, { open, close }] = useDisclosure(false);

  // Filtrar conversas por termo de busca
  const filteredConversations = conversations.filter(conv =>
    conv.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.participantes?.some(p => 
      p.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Filtrar usuários para nova conversa
  const availableUsers = filteredUsers.filter(user =>
    user.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) &&
    user.id !== userData?.id
  );

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.tipo === 'grupo' || conversation.tipo === 'turma') {
      return conversation.titulo || 'Grupo sem nome';
    }
    
    // Para conversas individuais, mostrar o nome do outro participante
    const otherParticipant = conversation.participantes?.find(
      p => p.id !== userData?.id
    );
    return otherParticipant?.nome_completo || 'Usuário';
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.tipo === 'grupo') {
      return conversation.avatar_url;
    }
    
    const otherParticipant = conversation.participantes?.find(
      p => p.id !== userData?.id
    );
    return otherParticipant?.avatar_url;
  };

  const handleStartConversation = async (user: ChatUser) => {
    // Verificar se já existe uma conversa individual com este usuário
    const existingConversation = conversations.find(conv => 
      conv.tipo === 'individual' && 
      conv.participantes?.some(p => p.id === user.id)
    );
    
    if (existingConversation) {
      onSelectConversation(existingConversation.id);
    } else {
      // Criar nova conversa individual
      try {
        const { data, error } = await supabase.rpc('criar_conversa_individual', {
          p_usuario1_id: userData.id,
          p_usuario2_id: user.id
        });
        
        if (error) throw error;
        
        // Recarregar conversas e selecionar a nova
        await loadConversations();
        if (data) {
          onSelectConversation(data);
        }
      } catch (error) {
        console.error('Erro ao criar conversa:', error);
        notifications.show({
          title: 'Erro',
          message: 'Erro ao criar conversa',
          color: 'red'
        });
      }
    }
    close();
  };

  return (
    <Box h="100%">
      {/* Header */}
      <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Group justify="space-between" mb="md">
          <Text size="xl" fw={700}>
            Conversas
          </Text>
          <ActionIcon
            variant="subtle"
            size="sm"
            onClick={open}
          >
            <IconPlus size={16} />
          </ActionIcon>
        </Group>
        
        {/* Barra de pesquisa */}
        <TextInput
          placeholder="Buscar conversas..."
          leftSection={<IconSearch size={16} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Box>

      {/* Lista de conversas */}
      <ScrollArea style={{ height: 'calc(100% - 120px)' }}>
        <Stack gap={0}>
          {loading ? (
            <Box p="md">
              <Text c="dimmed">Carregando conversas...</Text>
            </Box>
          ) : filteredConversations.length === 0 ? (
            <Box p="md">
              <Text c="dimmed">
                {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
              </Text>
            </Box>
          ) : (
            filteredConversations.map((conversation) => (
              <Paper
                key={conversation.id}
                p="sm"
                style={{
                  cursor: 'pointer',
                  backgroundColor: selectedConversationId === conversation.id ? 'var(--mantine-color-blue-light)' : 'transparent',
                  borderBottom: '1px solid var(--mantine-color-gray-2)'
                }}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <Group wrap="nowrap">
                  <Avatar
                    size="md"
                    name={getConversationName(conversation)}
                    src={getConversationAvatar(conversation)}
                  >
                    {conversation.tipo === 'grupo' && <IconUsers size={16} />}
                  </Avatar>
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Group justify="space-between" align="flex-start">
                      <Text fw={600} truncate>
                        {getConversationName(conversation)}
                        {conversation.tipo === 'grupo' && (
                          <Badge ml="xs" color="blue" size="sm">
                            Grupo
                          </Badge>
                        )}
                        {conversation.tipo === 'turma' && (
                          <Badge ml="xs" color="green" size="sm">
                            Turma
                          </Badge>
                        )}
                      </Text>
                      {conversation.ultima_mensagem?.created_at && (
                        <Text size="xs" c="dimmed">
                          {formatLastMessageTime(conversation.ultima_mensagem.created_at)}
                        </Text>
                      )}
                    </Group>
                    <Text size="sm" c="dimmed" truncate>
                      {conversation.ultima_mensagem?.conteudo || 'Nenhuma mensagem ainda'}
                    </Text>
                  </Box>
                  {conversation.mensagens_nao_lidas > 0 && (
                    <Badge color="green" variant="filled" size="sm">
                      {conversation.mensagens_nao_lidas}
                    </Badge>
                  )}
                </Group>
              </Paper>
            ))
          )}
        </Stack>
      </ScrollArea>

      {/* Modal para nova conversa */}
      <Modal opened={opened} onClose={close} title="Nova Conversa">
        <Stack>
          <TextInput
            placeholder="Buscar usuários..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            mb="md"
          />
          
          <ScrollArea mah={300}>
            <Stack gap="xs">
              {availableUsers.map((user) => (
                <Button
                  key={user.id}
                  variant="subtle"
                  justify="flex-start"
                  fullWidth
                  onClick={() => handleStartConversation(user)}
                >
                  <Group>
                    <Avatar size="sm" name={user.nome_completo} src={user.avatar_url} />
                    <Box>
                      <Text fw={500}>{user.nome_completo}</Text>
                      <Text size="sm" c="dimmed">
                        {user.funcao === 'admin' ? 'Administrador' :
                         user.funcao === 'secretario' ? 'Secretário' :
                         user.funcao === 'professor' ? 'Professor' :
                         user.funcao === 'aluno' ? 'Aluno' : user.funcao}
                      </Text>
                    </Box>
                  </Group>
                </Button>
              ))}
            </Stack>
          </ScrollArea>
          
          {availableUsers.length === 0 && (
            <Text c="dimmed" ta="center">
              {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário disponível'}
            </Text>
          )}
        </Stack>
      </Modal>
    </Box>
  );
};