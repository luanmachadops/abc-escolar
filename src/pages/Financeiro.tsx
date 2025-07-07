import { Container, Title, Text, Center, Stack } from '@mantine/core';

const Financeiro = () => {
  return (
    <Container size="xl">
      <Center mih="60vh">
        <Stack align="center" gap="md">
          <Title order={1} size={48} ta="center">
            Financeiro ADM
          </Title>
          <Text size="lg" c="dimmed" ta="center">
            Página em desenvolvimento
          </Text>
        </Stack>
      </Center>
    </Container>
  );
};

export default Financeiro;