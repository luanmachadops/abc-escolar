import { Container, Title, Text, Center, Stack } from '@mantine/core';

const Alunos = () => {
  return (
    <Container size="xl">
      <Center style={{ minHeight: '60vh' }}>
        <Stack align="center" gap="md">
          <Title order={1} size={48} ta="center">
            Alunos ADM
          </Title>
          <Text size="lg" c="dimmed" ta="center">
            Página em desenvolvimento
          </Text>
        </Stack>
      </Center>
    </Container>
  );
};

export default Alunos;