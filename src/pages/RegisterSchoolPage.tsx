import { useState } from 'react';
import {
  Container,
  Paper,
  Title,
  TextInput,
  Button,
  Group,
  Stack,
  Text,
  Anchor,
  Alert,
  Box,
  ThemeIcon,
  Grid,
  Progress
} from '@mantine/core';
import { IconSchool, IconAlertCircle, IconMoon, IconSun, IconCheck } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabase';
import { handleError, handleSuccess, handleValidationError, logger } from '../utils/errorHandler';

interface SchoolData {
  nomeInstituicao: string;
  cnpjCpf: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade: string;
  pais: string;
}

const RegisterSchoolPage = () => {
  const [formData, setFormData] = useState<SchoolData>({
    nomeInstituicao: '',
    cnpjCpf: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cep: '',
    cidade: '',
    pais: 'Brasil'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { colorScheme, toggleColorScheme } = useTheme();
  const navigate = useNavigate();

  const handleChange = (field: keyof SchoolData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCNPJCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      // CPF: 000.000.000-00
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      // CNPJ: 00.000.000/0000-00
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const validateForm = () => {
    if (!formData.nomeInstituicao.trim()) {
      setError('Nome da instituição é obrigatório');
      return false;
    }
    if (!formData.cnpjCpf.trim()) {
      setError('CNPJ/CPF é obrigatório');
      return false;
    }
    if (!formData.logradouro.trim()) {
      setError('Logradouro é obrigatório');
      return false;
    }
    if (!formData.numero.trim()) {
      setError('Número é obrigatório');
      return false;
    }
    if (!formData.bairro.trim()) {
      setError('Bairro é obrigatório');
      return false;
    }
    if (!formData.cep.trim()) {
      setError('CEP é obrigatório');
      return false;
    }
    if (!formData.cidade.trim()) {
      setError('Cidade é obrigatória');
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
      logger.info('Iniciando cadastro de escola', 'RegisterSchoolPage', { nome: formData.nomeInstituicao });

      logger.debug('Dados validados, inserindo no banco', 'RegisterSchoolPage', {
        cnpj_cpf: formData.cnpjCpf.replace(/\D/g, ''),
        endereco: {
          logradouro: formData.logradouro,
          numero: formData.numero,
          bairro: formData.bairro,
          cep: formData.cep,
          cidade: formData.cidade,
          pais: formData.pais
        }
      });

      // Inserir escola no banco de dados
      const { data: schoolData, error: schoolError } = await supabase
        .from('escolas')
        .insert({
          nome_instituicao: formData.nomeInstituicao,
          cnpj_cpf: formData.cnpjCpf.replace(/\D/g, ''), // Remove formatação
          logradouro: formData.logradouro,
          numero: formData.numero,
          bairro: formData.bairro,
          cep: formData.cep.replace(/\D/g, ''), // Remove formatação
          cidade: formData.cidade,
          pais: formData.pais
        })
        .select()
        .single();

      if (schoolError) {
        handleError(schoolError, 'RegisterSchoolPage - Inserção no banco');
        if (schoolError.code === '23505') {
          setError('CNPJ/CPF já cadastrado no sistema');
        } else {
          setError('Erro ao cadastrar escola. Tente novamente.');
        }
        return;
      }

      logger.info('Escola cadastrada com sucesso', 'RegisterSchoolPage', { escolaId: schoolData.id });

      // Salvar ID da escola no localStorage para usar na próxima etapa
      localStorage.setItem('school_registration_id', schoolData.id);
      localStorage.setItem('school_registration_data', JSON.stringify(formData));

      notifications.show({
        title: 'Escola cadastrada com sucesso!',
        message: 'Agora vamos criar seu acesso de administrador',
        color: 'green',
        icon: <IconCheck size={16} />
      });

      handleSuccess('Escola cadastrada com sucesso!', 'RegisterSchoolPage');

      // Navegar para a próxima etapa
      navigate('/register/admin');
    } catch (err: any) {
      handleError(err, 'RegisterSchoolPage - Erro inesperado');
      setError('Erro inesperado. Tente novamente.');
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

      {/* Registration Form */}
      <Container size={600} my={40}>
        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <Stack align="center" mb="lg">
            <ThemeIcon size={60} radius="md" variant="light">
              <IconSchool size={30} />
            </ThemeIcon>
            <Title order={2} ta="center">Cadastro da Escola</Title>
            <Text c="dimmed" size="sm" ta="center">
              Etapa 1 de 2 - Informações da Instituição
            </Text>
            <Progress value={50} size="sm" style={{ width: '100%' }} />
          </Stack>

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack>
              <TextInput
                label="Nome da Instituição"
                placeholder="Ex: Colégio ABC"
                required
                value={formData.nomeInstituicao}
                onChange={(e) => handleChange('nomeInstituicao', e.target.value)}
              />
              
              <TextInput
                label="CNPJ/CPF"
                placeholder="00.000.000/0000-00 ou 000.000.000-00"
                required
                value={formData.cnpjCpf}
                onChange={(e) => handleChange('cnpjCpf', formatCNPJCPF(e.target.value))}
                maxLength={18}
              />
              
              <Grid>
                <Grid.Col span={8}>
                  <TextInput
                    label="Logradouro"
                    placeholder="Rua, Avenida, etc."
                    required
                    value={formData.logradouro}
                    onChange={(e) => handleChange('logradouro', e.target.value)}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="Número"
                    placeholder="123"
                    required
                    value={formData.numero}
                    onChange={(e) => handleChange('numero', e.target.value)}
                  />
                </Grid.Col>
              </Grid>
              
              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="Bairro"
                    placeholder="Centro"
                    required
                    value={formData.bairro}
                    onChange={(e) => handleChange('bairro', e.target.value)}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="CEP"
                    placeholder="00000-000"
                    required
                    value={formData.cep}
                    onChange={(e) => handleChange('cep', formatCEP(e.target.value))}
                    maxLength={9}
                  />
                </Grid.Col>
              </Grid>
              
              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="Cidade"
                    placeholder="São Paulo"
                    required
                    value={formData.cidade}
                    onChange={(e) => handleChange('cidade', e.target.value)}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="País"
                    value={formData.pais}
                    onChange={(e) => handleChange('pais', e.target.value)}
                  />
                </Grid.Col>
              </Grid>
              
              <Button 
                type="submit" 
                fullWidth 
                mt="md" 
                loading={loading}
                radius="md"
                size="lg"
              >
                Próximo - Criar Acesso
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

export default RegisterSchoolPage;