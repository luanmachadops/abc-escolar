import React from 'react';
import { Box, Text, LoadingOverlay } from '@mantine/core';
import { useUserData } from '../hooks/useUserData';
import { ChatLayout } from '../components/chat/ChatLayout';



export default function Chat() {
  const { userData, loading: userDataLoading } = useUserData();
  
  // Se os dados do usuário ainda estão carregando, mostrar loading
  if (userDataLoading) {
    return <LoadingOverlay visible />;
  }
  
  // Se não há dados do usuário, mostrar erro
  if (!userData) {
    return (
      <Box p="xl" ta="center">
        <Text c="red">Erro: Dados do usuário não encontrados</Text>
      </Box>
    );
  }

  return (
    <Box h="100vh">
      <ChatLayout userData={userData} />
    </Box>
  );
}
