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
  ThemeIcon,
  Progress,
  List,
  Checkbox
} from '@mantine/core';
import { IconSchool, IconAlertCircle, IconMoon, IconSun, IconCheck, IconPhone } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabase';
import { handleError, handleSuccess, handleValidationError, logger } from '../utils/errorHandler';

interface AdminData {
  nomeCompleto: string;
  telefone: string;
  isWhatsapp: boolean;
  email: string;
  senha: string;
  confirmarSenha: string;
}

const RegisterAdminPage = () => {
  const [formData, setFormData] = useState<AdminData>({
    nomeCompleto: '',
    telefone: '',
    isWhatsapp: false,
    email: '',
    senha: '',
    confirmarSenha: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [schoolData, setSchoolData] = useState<any>(null);
  
  const { colorScheme, toggleColorScheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se há dados da escola no localStorage
    const schoolId = localStorage.getItem('school_registration_id');
    const schoolInfo = localStorage.getItem('school_registration_data');
    
    if (!schoolId || !schoolInfo) {
      handleValidationError('Fluxo de cadastro', 'Dados da escola não encontrados', 'RegisterAdminPage');
      navigate('/register/school');
      return;
    } else {
      logger.info('Dados da escola encontrados no localStorage', 'RegisterAdminPage', { schoolId });
    }
    
    setSchoolData(JSON.parse(schoolInfo));
  }, [navigate]);

  const handleChange = (field: keyof AdminData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
    };
  };

  const passwordValidation = validatePassword(formData.senha);

  const validateForm = () => {
    if (!formData.nomeCompleto.trim()) {
      setError('Nome completo é obrigatório');
      return false;
    }
    if (!formData.telefone.trim()) {
      setError('Telefone é obrigatório');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return false;
    }
    if (!passwordValidation.isValid) {
      setError('A senha não atende aos critérios de segurança');
      return false;
    }
    if (formData.senha !== formData.confirmarSenha) {
      setError('As senhas não coincidem');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      logger.info('Iniciando cadastro de administrador', 'RegisterAdminPage', { email: formData.email });

      const schoolId = localStorage.getItem('school_registration_id');
      
      if (!schoolId) {
        handleValidationError('Fluxo de cadastro', 'ID da escola não encontrado', 'RegisterAdminPage');
        navigate('/register/school');
        return;
      }

      logger.debug('Dados validados, criando usuário no Auth', 'RegisterAdminPage', {
        email: formData.email,
        telefone: formData.telefone.replace(/\D/g, ''),
        schoolId
      });

      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
        options: {
          data: {
            nome_completo: formData.nomeCompleto,
            telefone: formData.telefone.replace(/\D/g, ''),
            funcao: 'admin',
            escola_id: schoolId
          }
        }
      });

      if (authError) {
        handleError(authError, 'RegisterAdminPage - Cadastro Auth');
        return;
      }

      if (!authData.user) {
        handleError(new Error('Usuário não foi criado'), 'RegisterAdminPage - Auth Data');
        return;
      }

      logger.info('Usuário criado no Auth, inserindo na tabela usuarios', 'RegisterAdminPage', {
        authUserId: authData.user.id
      });

      // 2. Criar registro na tabela usuarios
      const { error: userError } = await supabase
        .from('usuarios')
        .insert({
          auth_user_id: authData.user.id,
          escola_id: schoolId,
          nome_completo: formData.nomeCompleto,
          telefone: formData.telefone.replace(/\D/g, ''),
          email: formData.email,
          funcao: 'admin'
        });

      if (userError) {
        handleError(userError, 'RegisterAdminPage - Inserção na tabela usuarios');
        return;
      }

      logger.info('Administrador cadastrado com sucesso', 'RegisterAdminPage', {
        authUserId: authData.user.id,
        schoolId
      });

      // Limpar dados do localStorage
      localStorage.removeItem('school_registration_id');
      localStorage.removeItem('school_registration_data');

      handleSuccess('Cadastro realizado com sucesso! Verifique seu email para confirmar a conta.', 'RegisterAdminPage');

      // Navegar para página de confirmação
      navigate('/register/confirm');
    } catch (err: any) {
      handleError(err, 'RegisterAdminPage - Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  if (!schoolData) {
    return <div>Carregando...</div>;
  }

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

      {/* Registration Form */}
      <Container size={600} my={40}>
        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <Stack align="center" mb="lg">
            <ThemeIcon size={60} radius="md" variant="light">
              <IconSchool size={30} />
            </ThemeIcon>
            <Title order={2} ta="center">Criar Acesso de Administrador</Title>
            <Text c="dimmed" size="sm" ta="center">
              Etapa 2 de 2 - Dados do Administrador para {schoolData.nomeInstituicao}
            </Text>
            <Progress value={100} size="sm" w="100%" />
          </Stack>

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack>
              <TextInput
                label="Nome Completo"
                placeholder="Seu nome completo"
                required
                value={formData.nomeCompleto}
                onChange={(e) => handleChange('nomeCompleto', e.target.value)}
              />
              
              <Stack gap="xs">
                <TextInput
                  label="Telefone"
                  placeholder="(11) 99999-9999"
                  required
                  value={formData.telefone}
                  onChange={(e) => handleChange('telefone', formatPhone(e.target.value))}
                  leftSection={<IconPhone size={16} />}
                  maxLength={15}
                />
                <Checkbox
                  label="Este número é WhatsApp"
                  checked={formData.isWhatsapp}
                  onChange={(e) => handleChange('isWhatsapp', e.currentTarget.checked)}
                />
              </Stack>
              
              <TextInput
                label="Email"
                placeholder="seu@email.com"
                required
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
              
              <Stack gap="xs">
                <PasswordInput
                  label="Senha"
                  placeholder="Sua senha segura"
                  required
                  value={formData.senha}
                  onChange={(e) => handleChange('senha', e.target.value)}
                />
                
                {formData.senha && (
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Critérios de segurança:</Text>
                    <List size="xs" spacing="xs">
                      <List.Item 
                        icon={passwordValidation.minLength ? <IconCheck size={12} color="green" /> : <Text size={12}>•</Text>}
                        c={passwordValidation.minLength ? 'green' : 'dimmed'}
                      >
                        Mínimo 8 caracteres
                      </List.Item>
                      <List.Item 
                        icon={passwordValidation.hasUpperCase ? <IconCheck size={12} color="green" /> : <Text size={12}>•</Text>}
                        c={passwordValidation.hasUpperCase ? 'green' : 'dimmed'}
                      >
                        Pelo menos uma letra maiúscula
                      </List.Item>
                      <List.Item 
                        icon={passwordValidation.hasLowerCase ? <IconCheck size={12} color="green" /> : <Text size={12}>•</Text>}
                        c={passwordValidation.hasLowerCase ? 'green' : 'dimmed'}
                      >
                        Pelo menos uma letra minúscula
                      </List.Item>
                      <List.Item 
                        icon={passwordValidation.hasNumbers ? <IconCheck size={12} color="green" /> : <Text size={12}>•</Text>}
                        c={passwordValidation.hasNumbers ? 'green' : 'dimmed'}
                      >
                        Pelo menos um número
                      </List.Item>
                      <List.Item 
                        icon={passwordValidation.hasSpecialChar ? <IconCheck size={12} color="green" /> : <Text size={12}>•</Text>}
                        c={passwordValidation.hasSpecialChar ? 'green' : 'dimmed'}
                      >
                        Pelo menos um caractere especial
                      </List.Item>
                    </List>
                  </Box>
                )}
              </Stack>
              
              <PasswordInput
                label="Confirmar Senha"
                placeholder="Confirme sua senha"
                required
                value={formData.confirmarSenha}
                onChange={(e) => handleChange('confirmarSenha', e.target.value)}
                error={formData.confirmarSenha && formData.senha !== formData.confirmarSenha ? 'Senhas não coincidem' : undefined}
              />
              
              <Button 
                type="submit" 
                fullWidth 
                mt="md" 
                loading={loading}
                radius="md"
                size="lg"
                disabled={!passwordValidation.isValid || formData.senha !== formData.confirmarSenha}
              >
                Finalizar Cadastro
              </Button>
            </Stack>
          </form>

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

export default RegisterAdminPage;