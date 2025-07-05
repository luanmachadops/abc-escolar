import { useState } from 'react';
import {
  Container,
  Paper,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Group,
  Stack,
  Text,
  Anchor,
  Alert,
  Box,
  ThemeIcon
} from '@mantine/core';
import { IconSchool, IconAlertCircle, IconMoon, IconSun } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { notifications } from '@mantine/notifications';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn } = useAuth();
  const { colorScheme, toggleColorScheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setError('Email ou senha incorretos');
      } else {
        notifications.show({
          title: 'Login realizado com sucesso!',
          message: 'Bem-vindo ao ABC Escolar',
          color: 'green'
        });
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box style={{ minHeight: '100vh', background: colorScheme === 'dark' ? '#1a1b1e' : '#f8f9fa' }}>
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

      {/* Login Form */}
      <Container size={420} my={40}>
        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <Stack align="center" mb="lg">
            <ThemeIcon size={60} radius="md" variant="light">
              <IconSchool size={30} />
            </ThemeIcon>
            <Title order={2} ta="center">Fazer Login</Title>
            <Text c="dimmed" size="sm" ta="center">
              Entre com suas credenciais para acessar o sistema
            </Text>
          </Stack>

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack>
              <TextInput
                label="Email"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              
              <PasswordInput
                label="Senha"
                placeholder="Sua senha"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              
              <Button 
                type="submit" 
                fullWidth 
                mt="md" 
                loading={loading}
                radius="md"
              >
                Entrar
              </Button>
            </Stack>
          </form>

          <Group justify="center" mt="lg">
            <Text size="sm">
              Não tem uma conta?{' '}
              <Anchor component={Link} to="/register" size="sm">
                Cadastre-se
              </Anchor>
            </Text>
          </Group>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;