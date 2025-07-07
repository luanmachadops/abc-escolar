import { useState, useEffect } from 'react';
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
import { IconSchool, IconAlertCircle, IconMoon, IconSun, IconUser, IconId } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useUserAccess } from '../hooks/useUserAccess';
import { notifications } from '@mantine/notifications';

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [placeholderText, setPlaceholderText] = useState('RA, CPF ou E-mail');
  const [identifierType, setIdentifierType] = useState<'email' | 'cpf' | 'ra' | 'unknown'>('unknown');
  
  const { signIn } = useAuth();
  const { colorScheme, toggleColorScheme } = useTheme();
  const { detectIdentifierType } = useUserAccess();
  const navigate = useNavigate();

  // Detectar tipo de identificador e atualizar placeholder
  useEffect(() => {
    if (!identifier.trim()) {
      setPlaceholderText('RA, CPF ou E-mail');
      setIdentifierType('unknown');
      return;
    }

    const type = detectIdentifierType(identifier);
    setIdentifierType(type);

    switch (type) {
      case 'email':
        setPlaceholderText('E-mail detectado');
        break;
      case 'cpf':
        setPlaceholderText('CPF detectado');
        break;
      case 'ra':
        setPlaceholderText('RA detectado');
        break;
      default:
        setPlaceholderText('RA, CPF ou E-mail');
    }
  }, [identifier, detectIdentifierType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!identifier.trim()) {
        setError('RA, CPF ou E-mail é obrigatório');
        setLoading(false);
        return;
      }
      
      if (!password.trim()) {
        setError('Senha é obrigatória');
        setLoading(false);
        return;
      }

      const { error } = await signIn(identifier, password);
      
      if (error) {
        if (error.message === 'Usuário não encontrado') {
          setError('Usuário não encontrado. Verifique seu RA, CPF ou e-mail.');
        } else if (error.message.includes('Invalid login credentials')) {
          setError('Credenciais inválidas. Verifique sua senha.');
        } else {
          setError('Erro ao fazer login. Verifique suas credenciais.');
        }
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
    <Box mih="100vh">
      {/* Header */}
      <Container size="xl" py="md">
        <Group justify="space-between">
          <Group component={Link} to="/" style={{ textDecoration: 'none' }}>
            <ThemeIcon size={40} variant="light" color="blue">
              <IconSchool size={24} />
            </ThemeIcon>
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
              Entre com seu RA, CPF ou e-mail para acessar o sistema
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
                label="RA, CPF ou E-mail"
                placeholder={placeholderText}
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                leftSection={
                  identifierType === 'email' ? <IconUser size={16} /> :
                  identifierType === 'ra' ? <IconId size={16} /> :
                  identifierType === 'cpf' ? <IconId size={16} /> :
                  <IconUser size={16} />
                }
                description={
                  identifierType === 'email' ? 'E-mail detectado' :
                  identifierType === 'cpf' ? 'CPF detectado (11 dígitos)' :
                  identifierType === 'ra' ? 'RA detectado' :
                  'Digite seu RA, CPF ou e-mail'
                }
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