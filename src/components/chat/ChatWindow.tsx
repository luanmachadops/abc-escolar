import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Stack,
  Group,
  Text,
  Avatar,
  TextInput,
  ActionIcon,
  Flex,
  Badge,
  Textarea,
  Paper,
  ScrollArea
} from '@mantine/core';
import { IconSend, IconPaperclip, IconPhone, IconVideo } from '@tabler/icons-react';
import { Conversation, Message } from '../../hooks/useChat';

interface ChatWindowProps {
  selectedConversationId: string | null;
  messages: Message[];
  onSendMessage: (conversationId: string, content: string) => Promise<void>;
  userData: any;
  conversations: Conversation[];
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  selectedConversationId,
  messages,
  onSendMessage,
  userData,
  conversations
}) => {
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  // Auto scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversationId || sending) return;
    
    setSending(true);
    try {
      await onSendMessage(selectedConversationId, messageText.trim());
      setMessageText('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getConversationName = () => {
    if (!selectedConversation) return '';
    
    if (selectedConversation.tipo === 'grupo') {
      return selectedConversation.nome || 'Grupo sem nome';
    }
    
    const otherParticipant = selectedConversation.participantes?.find(
      p => p.id !== userData?.id
    );
    return otherParticipant?.nome || 'Usuário';
  };

  const getConversationAvatar = () => {
    if (!selectedConversation) return undefined;
    
    if (selectedConversation.tipo === 'grupo') {
      return selectedConversation.avatar_url;
    }
    
    const otherParticipant = selectedConversation.participantes?.find(
      p => p.id !== userData?.id
    );
    return otherParticipant?.avatar_url;
  };

  const getParticipantsCount = () => {
    if (!selectedConversation || selectedConversation.tipo !== 'grupo') return null;
    return selectedConversation.participantes?.length || 0;
  };

  if (!selectedConversationId) {
    return (
      <Flex
        style={{ flex: 1 }}
        align="center"
        justify="center"
        direction="column"
        p="xl"
      >
        <Text size="xl" c="dimmed" mb="sm">
          Selecione uma conversa
        </Text>
        <Text c="gray" ta="center">
          Escolha uma conversa da lista ao lado para começar a conversar
        </Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" h="100%">
      {/* Header da conversa */}
      <Box
        p="md"
        style={{
          borderBottom: '1px solid var(--mantine-color-gray-3)',
          backgroundColor: 'var(--mantine-color-body)'
        }}
      >
        <Group justify="space-between">
          <Group>
            <Avatar
              size="md"
              name={getConversationName()}
              src={getConversationAvatar()}
            />
            <Box>
              <Text fw={700} size="lg">
                {getConversationName()}
                {selectedConversation?.tipo === 'grupo' && (
                  <Badge ml="xs" color="blue" size="sm">
                    Grupo
                  </Badge>
                )}
              </Text>
              {selectedConversation?.tipo === 'grupo' && (
                <Text size="sm" c="dimmed">
                  {getParticipantsCount()} participantes
                </Text>
              )}
            </Box>
          </Group>
          
          <Group gap="xs">
            <ActionIcon variant="subtle" size="sm">
              <IconPhone size={16} />
            </ActionIcon>
            <ActionIcon variant="subtle" size="sm">
              <IconVideo size={16} />
            </ActionIcon>
          </Group>
        </Group>
      </Box>

      {/* Área de mensagens */}
      <ScrollArea
        style={{
          flex: 1,
          backgroundColor: 'var(--mantine-color-gray-0)'
        }}
        p="md"
      >
        <Stack gap="md">
          {messages.length === 0 ? (
            <Flex justify="center" align="center" style={{ minHeight: 200 }}>
              <Text c="dimmed">
                Nenhuma mensagem ainda. Seja o primeiro a enviar uma mensagem!
              </Text>
            </Flex>
          ) : (
            messages.map((message, index) => {
              const isMyMessage = message.remetente_id === userData?.id;
              const showAvatar = !isMyMessage && (
                index === 0 || 
                messages[index - 1].remetente_id !== message.remetente_id
              );
              
              return (
                <Flex
                  key={message.id}
                  justify={isMyMessage ? 'flex-end' : 'flex-start'}
                  align="flex-end"
                >
                  {!isMyMessage && (
                    <Avatar
                      size="sm"
                      name={message.remetente_nome}
                      src={message.remetente_avatar}
                      mr="xs"
                      style={{
                        visibility: showAvatar ? 'visible' : 'hidden'
                      }}
                    />
                  )}
                  
                  <Box style={{ maxWidth: '70%' }}>
                    {!isMyMessage && showAvatar && selectedConversation?.tipo === 'grupo' && (
                      <Text size="xs" c="dimmed" mb={4} ml="sm">
                        {message.remetente_nome}
                      </Text>
                    )}
                    
                    <Paper
                      bg={isMyMessage ? 'blue' : 'white'}
                      c={isMyMessage ? 'white' : 'dark'}
                      px="sm"
                      py="xs"
                      style={{
                        borderRadius: 'var(--mantine-radius-md)',
                        borderBottomRightRadius: isMyMessage ? 'var(--mantine-radius-xs)' : 'var(--mantine-radius-md)',
                        borderBottomLeftRadius: isMyMessage ? 'var(--mantine-radius-md)' : 'var(--mantine-radius-xs)'
                      }}
                    >
                      <Text>{message.conteudo}</Text>
                      <Text
                        size="xs"
                        c={isMyMessage ? 'blue.2' : 'dimmed'}
                        mt={4}
                        ta="right"
                      >
                        {formatMessageTime(message.criado_em)}
                      </Text>
                    </Paper>
                  </Box>
                </Flex>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </Stack>
      </ScrollArea>

      {/* Input de mensagem */}
      <Box
        p="md"
        style={{
          borderTop: '1px solid var(--mantine-color-gray-3)',
          backgroundColor: 'var(--mantine-color-body)'
        }}
      >
        <Group gap="xs">
          <ActionIcon variant="subtle" size="sm">
            <IconPaperclip size={16} />
          </ActionIcon>
          
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Digite uma mensagem..."
            autosize
            minRows={1}
            maxRows={4}
            style={{ flex: 1 }}
          />
          
          <ActionIcon
            color="blue"
            variant="filled"
            onClick={handleSendMessage}
            loading={sending}
            disabled={!messageText.trim()}
          >
            <IconSend size={16} />
          </ActionIcon>
        </Group>
      </Box>
    </Flex>
  );
};