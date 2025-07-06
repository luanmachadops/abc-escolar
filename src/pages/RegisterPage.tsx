import { useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
  Button,
  Group,
  Stack,
  Text,
  Anchor,
  Box,
  ThemeIcon
} from '@mantine/core';
import { IconSchool, IconMoon, IconSun, IconArrowRight } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const RegisterPage = () => {
  const { colorScheme, toggleColorScheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirecionar automaticamente para o novo fluxo de cadastro
    navigate('/register/school');
  }, [navigate]);

  return (
    <Box style={{ minHeight: '100vh' }}>
      {/* Header */}
      <Container size="xl" py="md">
        <Group justify="space-between">
          <Group component={Link} to="/" style={{ textDecoration: 'none' }}>
            <IconSchool size={32} color="#228be6" />
            <Title order={2} c="blue">ABC Escolar</Title>
          </Group>
          <Button
            variant="subtle"
            onClick={toggleColorScheme}
            leftSection={colorScheme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
          >
            {colorScheme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </Button>
        </Group>
      </Container>

      {/* Register Form */}
      <Container size={420} my={40}>
        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <Stack align="center" mb="lg">
            <ThemeIcon size={60} radius="md" variant="light">
              <IconSchool size={30} />
            </ThemeIcon>
            <Title order={2} ta="center">Criar Conta</Title>
            <Text c="dimmed" size="sm" ta="center">
              Preencha os dados para criar sua conta
            </Text>
          </Stack>



          <Stack align="center" spacing="lg">
            <Text c="dimmed" size="sm" ta="center" maw={400}>
              Crie sua conta no ABC Escolar em duas etapas simples:
            </Text>
            
            <Stack spacing="xs" style={{ width: '100%' }}>
              <Group>
                <ThemeIcon size={24} radius="xl" variant="light">
                  <Text size="xs" fw={700}>1</Text>
                </ThemeIcon>
                <Text size="sm">Cadastre sua escola</Text>
              </Group>
              
              <Group>
                <ThemeIcon size={24} radius="xl" variant="light">
                  <Text size="xs" fw={700}>2</Text>
                </ThemeIcon>
                <Text size="sm">Crie seu acesso de administrador</Text>
              </Group>
            </Stack>
            
            <Button 
              component={Link}
              to="/register/school"
              fullWidth 
              mt="md" 
              radius="md" 
              size="lg"
              rightSection={<IconArrowRight size={16} />}
            >
              Começar Cadastro
            </Button>
          </Stack>

          <Group justify="center" mt="lg">
            <Text size="sm">
              Já tem uma conta?{' '}
              <Anchor component={Link} to="/login" size="sm">
                Fazer login
              </Anchor>
            </Text>
          </Group>
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterPage;