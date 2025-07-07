import { useState } from 'react';
import {
  Container,
  Paper,
  Title,
  PasswordInput,
  Button,
  Stack,
  Text,
  Alert,
  Box,
  ThemeIcon,
  Progress
} from '@mantine/core';
import { IconSchool, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useUserAccess } from '../hooks/useUserAccess';
import { notifications } from '@mantine/notifications';

const ChangePasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { changeUserPassword } = useUserAccess();
  const navigate = useNavigate();

  // Função para validar força da senha
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^A-Za-z0-9]/.test(password)) strength += 12.5;
    return Math.min(strength, 100);
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const getStrengthColor = () => {
    if (passwordStrength < 30) return 'red';
    if (passwordStrength < 60) return 'orange';
    if (passwordStrength < 80) return 'yellow';
    return 'green';
  };

  const getStrengthLabel = () => {
    if (passwordStrength < 30) return 'Fraca';
    if (passwordStrength < 60) return 'Média';
    if (passwordStrength < 80) return 'Boa';
    return 'Forte';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!currentPassword.trim()) {
        setError('Senha atual é obrigatória');
        setLoading(false);
        return;
      }
      
      if (!newPassword.trim()) {
        setError('Nova senha é obrigatória');
        setLoading(false);
        return;
      }
      
      if (newPassword.length < 8) {
        setError('A nova senha deve ter pelo menos 8 caracteres');
        setLoading(false);
        return;
      }
      
      if (newPassword !== confirmPassword) {
        setError('As senhas não coincidem');
        setLoading(false);
        return;
      }
      
      if (passwordStrength < 60) {
        setError('A senha deve ser mais forte. Use letras maiúsculas, minúsculas, números e símbolos.');
        setLoading(false);
        return;
      }

      const result = await changeUserPassword(currentPassword, newPassword);
      
      if (result.success) {
        notifications.show({
          title: 'Senha alterada com sucesso!',
          message: 'Você será redirecionado para o dashboard',
          color: 'green'
        });
        
        // Aguardar um pouco antes de redirecionar
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(result.error || 'Erro ao alterar senha');
      }
    } catch (err) {
      setError('Erro ao alterar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box mih="100vh" bg="var(--mantine-color-gray-0)">
      <Container size={420} py={40}>
        <Paper withBorder shadow="md" p={30} radius="md">
          <Stack align="center" mb="lg">
            <ThemeIcon size={60} radius="md" variant="light" color="orange">
              <IconSchool size={30} />
            </ThemeIcon>
            <Title order={2} ta="center">Alterar Senha</Title>
            <Text c="dimmed" size="sm" ta="center">
              Por segurança, você deve alterar sua senha no primeiro acesso
            </Text>
          </Stack>

          <Alert icon={<IconAlertCircle size={16} />} color="blue" mb="md">
            <Text size="sm">
              <strong>Requisitos da senha:</strong>
              <br />• Mínimo de 8 caracteres
              <br />• Letras maiúsculas e minúsculas
              <br />• Pelo menos um número
              <br />• Pelo menos um símbolo (!@#$%&*+-=)
            </Text>
          </Alert>

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack>
              <PasswordInput
                label="Senha Atual"
                placeholder="Digite sua senha atual"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              
              <PasswordInput
                label="Nova Senha"
                placeholder="Digite sua nova senha"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              
              {newPassword && (
                <Box>
                  <Text size="sm" mb={5}>Força da senha: {getStrengthLabel()}</Text>
                  <Progress 
                    value={passwordStrength} 
                    color={getStrengthColor()} 
                    size="sm" 
                    radius="xl"
                  />
                </Box>
              )}
              
              <PasswordInput
                label="Confirmar Nova Senha"
                placeholder="Digite novamente sua nova senha"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                rightSection={
                  confirmPassword && newPassword === confirmPassword ? (
                    <IconCheck size={16} color="green" />
                  ) : null
                }
              />
              
              <Button 
                type="submit" 
                fullWidth 
                mt="md" 
                loading={loading}
                radius="md"
                disabled={passwordStrength < 60 || newPassword !== confirmPassword}
              >
                Alterar Senha
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default ChangePasswordPage;