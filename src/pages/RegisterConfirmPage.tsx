import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Group,
  Stack,
  ThemeIcon,
  Alert,
  Box,
  Loader,
  Center
} from '@mantine/core';
import { IconMail, IconCheck, IconAlertCircle, IconSchool, IconMoon, IconSun } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { notifications } from '@mantine/notifications';
import { handleError, handleSuccess, logger } from '../utils/errorHandler';

const RegisterConfirmPage = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState('');
  
  const { colorScheme, toggleColorScheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logger.info('Página de confirmação carregada', 'RegisterConfirmPage');
    
    // Verificar se o usuário já está logado e confirmado
    const checkEmailConfirmation = async () => {
      try {
        logger.debug('Verificando status de confirmação do email', 'RegisterConfirmPage');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          handleError(error, 'RegisterConfirmPage - Verificação de sessão');
          setError('Erro ao verificar status da confirmação');
          setIsChecking(false);
          return;
        }
        
        if (session?.user) {
          // Verificar se o usuário está logado e tem dados válidos
          // Como a confirmação de email está desabilitada no Supabase (enable_confirmations = false),
          // vamos considerar o usuário como confirmado se ele conseguiu fazer login
          logger.info('Usuário logado detectado, considerando como confirmado', 'RegisterConfirmPage', {
            userId: session.user.id,
            email: session.user.email,
            emailConfirmedAt: session.user.email_confirmed_at || 'N/A (confirmação desabilitada)'
          });
          
          setIsConfirmed(true);
          setIsChecking(false);
          
          handleSuccess('Acesso liberado! Redirecionando para o dashboard...', 'RegisterConfirmPage');
          
          // Aguardar 2 segundos e redirecionar
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          logger.debug('Nenhuma sessão ativa encontrada', 'RegisterConfirmPage');
          setIsChecking(false);
        }
      } catch (err) {
        handleError(err, 'RegisterConfirmPage - Erro inesperado na verificação');
        setError('Erro ao verificar status da confirmação');
        setIsChecking(false);
      }
    };

    checkEmailConfirmation();

    // Escutar mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          logger.info('Login detectado via auth state change', 'RegisterConfirmPage', {
            userId: session.user.id,
            email: session.user.email,
            emailConfirmedAt: session.user.email_confirmed_at || 'N/A (confirmação desabilitada)'
          });
          
          setIsConfirmed(true);
          
          handleSuccess('Acesso liberado! Redirecionando para o dashboard...', 'RegisterConfirmPage');
          
          // Aguardar 2 segundos e redirecionar
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleResendEmail = async () => {
    try {
      logger.info('Iniciando reenvio de confirmação de email', 'RegisterConfirmPage');
      
      const { data: { session }, error: getSessionError } = await supabase.auth.getSession();
      
      if (getSessionError) {
        handleError(getSessionError, 'RegisterConfirmPage - Obter sessão para reenvio');
        setError('Erro ao obter dados da sessão.');
        return;
      }
      
      if (!session?.user?.email) {
        handleError(new Error('Email do usuário não encontrado'), 'RegisterConfirmPage - Email não encontrado');
        setError('Email não encontrado. Tente fazer o cadastro novamente.');
        return;
      }

      logger.debug('Reenviando email de confirmação', 'RegisterConfirmPage', { email: session.user.email });

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: session.user.email
      });

      if (error) {
        handleError(error, 'RegisterConfirmPage - Reenvio de confirmação');
        setError('Erro ao reenviar email. Tente novamente.');
        return;
      }

      logger.info('Email de confirmação reenviado com sucesso', 'RegisterConfirmPage', { email: session.user.email });
      handleSuccess('Email reenviado! Verifique sua caixa de entrada', 'RegisterConfirmPage');
      
    } catch (err: any) {
      handleError(err, 'RegisterConfirmPage - Erro inesperado no reenvio');
      setError('Erro ao reenviar email. Tente novamente.');
    }
  };

  if (isChecking) {
    return (
      <Box style={{ minHeight: '100vh', background: colorScheme === 'dark' ? '#1a1b1e' : '#f8f9fa' }}>
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

        <Center style={{ minHeight: 'calc(100vh - 100px)' }}>
          <Stack align="center">
            <Loader size="lg" />
            <Text>Verificando status da confirmação...</Text>
          </Stack>
        </Center>
      </Box>
    );
  }

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

      {/* Confirmation Content */}
      <Container size={600} my={40}>
        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <Stack align="center" spacing="lg">
            {isConfirmed ? (
              <>
                <ThemeIcon size={80} radius="md" variant="light" color="green">
                  <IconCheck size={40} />
                </ThemeIcon>
                <Title order={2} ta="center" c="green">Email Confirmado!</Title>
                <Text c="dimmed" size="sm" ta="center">
                  Sua conta foi confirmada com sucesso. Você será redirecionado para o dashboard em alguns segundos.
                </Text>
                <Loader size="sm" />
              </>
            ) : (
              <>
                <ThemeIcon size={80} radius="md" variant="light">
                  <IconMail size={40} />
                </ThemeIcon>
                <Title order={2} ta="center">Confirme seu Email</Title>
                <Text c="dimmed" size="sm" ta="center" maw={400}>
                  Enviamos um link de confirmação para seu email. Clique no link para ativar sua conta e acessar o sistema.
                </Text>

                {error && (
                  <Alert icon={<IconAlertCircle size={16} />} color="red" style={{ width: '100%' }}>
                    {error}
                  </Alert>
                )}

                <Stack spacing="md" style={{ width: '100%' }}>
                  <Text size="sm" ta="center">
                    Não recebeu o email?
                  </Text>
                  
                  <Group justify="center">
                    <Button variant="outline" onClick={handleResendEmail}>
                      Reenviar Email
                    </Button>
                  </Group>

                  <Text size="xs" c="dimmed" ta="center">
                    Verifique também sua pasta de spam ou lixo eletrônico
                  </Text>
                </Stack>
              </>
            )}
          </Stack>

          {!isConfirmed && (
            <Group justify="center" mt="xl">
              <Text size="sm">
                Problemas com o cadastro?{' '}
                <Button variant="subtle" size="sm" component={Link} to="/register/school">
                  Tentar novamente
                </Button>
              </Text>
            </Group>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterConfirmPage;