import { Container, Title, Text, Center, Stack } from '@mantine/core';

const Configuracao = () => {
  return (
    <Container size="xl">
      <Center style={{ minHeight: '60vh' }}>
        <Stack align="center" gap="md">
          <Title order={1} size={48} ta="center">
            Configuração
          </Title>
          <Text size="lg" c="dimmed" ta="center">
            Página em desenvolvimento
          </Text>
        </Stack>
      </Center>
    </Container>
  );
};

export default Configuracao;