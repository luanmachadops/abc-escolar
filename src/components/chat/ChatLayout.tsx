import React from 'react';
import { Flex, Box } from '@mantine/core';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { useChat } from '../../hooks/useChat';

interface ChatLayoutProps {
  userData: any;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ userData }) => {
  const {
    conversations,
    selectedConversationId,
    setSelectedConversationId,
    filteredUsers,
    loading,
    sendMessage,
    messages,
    loadConversations
  } = useChat();

  return (
    <Flex h="100vh">
      {/* Sidebar com lista de conversas */}
      <Box
        w={350}
        style={{
          borderRight: '1px solid var(--mantine-color-gray-3)',
          backgroundColor: 'var(--mantine-color-body)',
          overflow: 'hidden'
        }}
      >
        <ChatSidebar
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          filteredUsers={filteredUsers}
          userData={userData}
          loading={loading}
          loadConversations={loadConversations}
        />
      </Box>

      {/* Área principal do chat */}
      <Box style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ChatWindow
          selectedConversationId={selectedConversationId}
          messages={messages}
          onSendMessage={sendMessage}
          userData={userData}
          conversations={conversations}
        />
      </Box>
    </Flex>
  );
};