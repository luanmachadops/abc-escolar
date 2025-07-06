import { Container, Title, Text, Center, Stack } from '@mantine/core';

const AcessoUsuarios = () => {
  return (
    <Container size="xl" style={{ minHeight: '100vh' }}>
      <Center style={{ minHeight: '60vh' }}>
        <Stack align="center" gap="md">
          <Title order={1} size="48" ta="center">
            Acesso Usuários ADM
          </Title>
          <Text c="dimmed" ta="center">
            Página em desenvolvimento
          </Text>
        </Stack>
      </Center>
    </Container>
  );
};

export default AcessoUsuarios;