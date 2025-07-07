import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Button,
  Table,
  Group,
  TextInput,
  Select,
  Modal,
  Stack,
  Badge,
  ActionIcon,
  Text,
  Paper,
  Flex,
  Tooltip,
  Alert,
  CopyButton,
  Box,
  Divider
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconEye,
  IconEyeOff,
  IconCopy,
  IconCheck,
  IconMail,
  IconBrandWhatsapp,
  IconShare,
  IconRefresh,
  IconInfoCircle
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabase';
import { useUserAccess, CreateUserAccessParams, UserAccessData } from '../hooks/useUserAccess';
import { useAuth } from '../contexts/AuthContext';

interface Aluno {
  id: string;
  nome_completo: string;
  email?: string;
  telefone?: string;
  username?: string;
  ativo: boolean;
  created_at: string;
  turmas?: { nome: string }[];
}

interface Turma {
  id: string;
  nome: string;
  curso_id: string;
  cursos?: { nome: string };
}

export default function Alunos() {
  const { user } = useAuth();
  const { createUserAccess, generateSecurePassword, loading: accessLoading } = useUserAccess();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTurma, setSelectedTurma] = useState<string>('');
  const [opened, { open, close }] = useDisclosure(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [accessModalOpened, { open: openAccessModal, close: closeAccessModal }] = useDisclosure(false);
  const [generatedAccess, setGeneratedAccess] = useState<UserAccessData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
    telefone: '',
    endereco: '',
    data_nascimento: '',
    turma_id: '',
    tipo_acesso: 'email' // 'email' ou 'username'
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadAlunos();
    loadTurmas();
  }, []);

  const loadAlunos = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          *,
          aluno_turmas!inner(
            turmas(
              nome
            )
          )
        `)
        .eq('funcao', 'aluno')
        .order('nome_completo');

      if (error) throw error;

      const alunosFormatted = data?.map(aluno => ({
        ...aluno,
        turmas: aluno.aluno_turmas?.map((at: any) => at.turmas) || []
      })) || [];

      setAlunos(alunosFormatted);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      notifications.show({
        title: 'Erro',
        message: 'Erro ao carregar lista de alunos',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTurmas = async () => {
    try {
      const { data, error } = await supabase
        .from('turmas')
        .select(`
          *,
          cursos(
            nome
          )
        `)
        .order('nome');

      if (error) throw error;
      setTurmas(data || []);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      notifications.show({
        title: 'Erro',
        message: 'Nome é obrigatório',
        color: 'red'
      });
      return;
    }

    if (!formData.turma_id) {
      notifications.show({
        title: 'Erro',
        message: 'Turma é obrigatória',
        color: 'red'
      });
      return;
    }

    if (formData.tipo_acesso === 'email' && !formData.email.trim()) {
      notifications.show({
        title: 'Erro',
        message: 'Email é obrigatório quando tipo de acesso é email',
        color: 'red'
      });
      return;
    }

    // Validar formato do email se fornecido
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(formData.email.trim())) {
        notifications.show({
          title: 'Erro',
          message: 'Formato de email inválido',
          color: 'red'
        });
        return;
      }
    }

    try {
      if (editingAluno) {
        // Atualizar aluno existente
        const { error } = await supabase
          .from('usuarios')
          .update({
            nome_completo: formData.nome,
            email: formData.email || null,
            telefone: formData.telefone || null
          })
          .eq('id', editingAluno.id);

        if (error) throw error;

        // Atualizar associação com turma
        await supabase
          .from('aluno_turmas')
          .delete()
          .eq('aluno_id', editingAluno.id);

        await supabase
          .from('aluno_turmas')
          .insert({
            aluno_id: editingAluno.id,
            turma_id: formData.turma_id
          });

        notifications.show({
          title: 'Sucesso',
          message: 'Aluno atualizado com sucesso!',
          color: 'green'
        });
      } else {
        // Criar novo aluno com acesso
        const accessParams: CreateUserAccessParams = {
          nome: formData.nome,
          email: formData.tipo_acesso === 'email' ? formData.email : undefined,
          role: 'aluno',
          escola_id: user?.user_metadata?.escola_id || '',
          cpf: formData.cpf || undefined,
          telefone: formData.telefone || undefined,
          endereco: formData.endereco || undefined,
          data_nascimento: formData.data_nascimento || undefined,
          turma_id: formData.turma_id
        };

        const accessData = await createUserAccess(accessParams);
        
        if (accessData) {
          setGeneratedAccess(accessData);
          openAccessModal();
        }
      }

      loadAlunos();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar aluno:', error);
      notifications.show({
        title: 'Erro',
        message: 'Erro ao salvar aluno',
        color: 'red'
      });
    }
  };

  const handleEdit = (aluno: Aluno) => {
    setEditingAluno(aluno);
    setFormData({
      nome: aluno.nome_completo,
      email: aluno.email || '',
      cpf: '',
      telefone: aluno.telefone || '',
      endereco: '',
      data_nascimento: '',
      turma_id: '',
      tipo_acesso: aluno.email ? 'email' : 'username'
    });
    open();
  };

  const handleDelete = async (aluno: Aluno) => {
    if (!confirm(`Tem certeza que deseja excluir o aluno ${aluno.nome_completo}?`)) {
      return;
    }

    try {
      // Deletar associações
      await supabase
        .from('aluno_turmas')
        .delete()
        .eq('aluno_id', aluno.id);

      // Deletar usuário da tabela usuarios
      const { error: dbError } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', aluno.id);

      if (dbError) throw dbError;

      // Deletar usuário do Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(aluno.id);
      if (authError) {
        console.warn('Erro ao deletar usuário do Auth:', authError.message);
      }

      notifications.show({
        title: 'Sucesso',
        message: 'Aluno excluído com sucesso!',
        color: 'green'
      });

      loadAlunos();
    } catch (error) {
      console.error('Erro ao excluir aluno:', error);
      notifications.show({
        title: 'Erro',
        message: 'Erro ao excluir aluno',
        color: 'red'
      });
    }
  };

  const handleCloseModal = () => {
    close();
    setEditingAluno(null);
    setFormData({
      nome: '',
      email: '',
      cpf: '',
      telefone: '',
      endereco: '',
      data_nascimento: '',
      turma_id: '',
      tipo_acesso: 'email'
    });
  };

  const handleShareAccess = (type: 'email' | 'whatsapp' | 'copy') => {
    if (!generatedAccess) return;

    const loginInfo = generatedAccess.username 
      ? `Usuário: ${generatedAccess.username}`
      : `Email: ${generatedAccess.email}`;
    
    const message = `🎓 Acesso ao Sistema Escolar\n\n${loginInfo}\nSenha: ${generatedAccess.password}\n\nAcesse: ${window.location.origin}/login`;

    switch (type) {
      case 'email':
        const emailSubject = 'Acesso ao Sistema Escolar';
        const emailBody = message.replace(/\n/g, '%0D%0A');
        window.open(`mailto:?subject=${emailSubject}&body=${emailBody}`);
        break;
      
      case 'whatsapp':
        const whatsappMessage = message.replace(/\n/g, '%0A');
        window.open(`https://wa.me/?text=${whatsappMessage}`);
        break;
      
      case 'copy':
        navigator.clipboard.writeText(message.replace(/\\n/g, '\n'));
        notifications.show({
          title: 'Copiado!',
          message: 'Informações de acesso copiadas para a área de transferência',
          color: 'green'
        });
        break;
    }
  };

  const generateNewPassword = () => {
    if (!generatedAccess) return;
    const newPassword = generateSecurePassword();
    setGeneratedAccess({ ...generatedAccess, password: newPassword });
  };

  // Filtrar alunos
  const filteredAlunos = alunos.filter(aluno => {
    const matchesSearch = aluno.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (aluno.email && aluno.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (aluno.username && aluno.username.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTurma = !selectedTurma || 
                        aluno.turmas?.some(turma => turma.nome === selectedTurma);
    
    return matchesSearch && matchesTurma;
  });

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={1}>Gestão de Alunos</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Novo Aluno
        </Button>
      </Group>

      {/* Filtros */}
      <Paper p="md" mb="lg">
        <Group>
          <TextInput
            placeholder="Buscar por nome, email ou usuário..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filtrar por turma"
            data={[
              { value: '', label: 'Todas as turmas' },
              ...turmas.map(turma => ({
                value: turma.nome,
                label: `${turma.nome} - ${turma.cursos?.nome || ''}`
              }))
            ]}
            value={selectedTurma}
            onChange={(value) => setSelectedTurma(value || '')}
            clearable
          />
        </Group>
      </Paper>

      {/* Tabela de Alunos */}
      <Paper>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nome</Table.Th>
              <Table.Th>Acesso</Table.Th>
              <Table.Th>Turma</Table.Th>
              <Table.Th>Telefone</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Ações</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text ta="center">Carregando...</Text>
                </Table.Td>
              </Table.Tr>
            ) : filteredAlunos.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text ta="center">Nenhum aluno encontrado</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              filteredAlunos.map((aluno) => (
                <Table.Tr key={aluno.id}>
                  <Table.Td>
                    <div>
                      <Text fw={500}>{aluno.nome_completo}</Text>
                      {aluno.telefone && <Text size="sm" c="dimmed">{aluno.telefone}</Text>}
                    </div>
                  </Table.Td>
                  <Table.Td>
                    {aluno.email ? (
                      <Text size="sm">{aluno.email}</Text>
                    ) : aluno.username ? (
                      <Badge variant="light" color="blue">{aluno.username}</Badge>
                    ) : (
                      <Text size="sm" c="dimmed">Sem acesso</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {aluno.turmas?.map(turma => (
                      <Badge key={turma.nome} variant="outline" size="sm">
                        {turma.nome}
                      </Badge>
                    ))}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{aluno.telefone || '-'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={aluno.ativo ? 'green' : 'red'}>
                      {aluno.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="Editar">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => handleEdit(aluno)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Excluir">
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDelete(aluno)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* Modal de Criação/Edição */}
      <Modal
        opened={opened}
        onClose={handleCloseModal}
        title={editingAluno ? 'Editar Aluno' : 'Novo Aluno'}
        size="lg"
      >
        <Stack>
          <TextInput
            label="Nome completo"
            placeholder="Digite o nome completo"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
          />

          {!editingAluno && (
            <Select
              label="Tipo de Acesso"
              description="Escolha como o aluno fará login no sistema"
              data={[
                { value: 'email', label: 'Email (acesso com email e senha)' },
                { value: 'username', label: 'Username Automático (gerado automaticamente)' }
              ]}
              value={formData.tipo_acesso}
              onChange={(value) => setFormData({ ...formData, tipo_acesso: value || 'email' })}
              required
            />
          )}

          {formData.tipo_acesso === 'email' && (
            <TextInput
              label="Email"
              placeholder="Digite o email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required={formData.tipo_acesso === 'email'}
            />
          )}

          {formData.tipo_acesso === 'username' && (
            <Alert icon={<IconInfoCircle size={16} />} color="blue">
              Um nome de usuário será gerado automaticamente baseado no nome do aluno.
              Exemplo: aluno.joao.silva.2024
            </Alert>
          )}

          <Select
            label="Turma"
            placeholder="Selecione a turma"
            data={turmas.map(turma => ({
              value: turma.id,
              label: `${turma.nome} - ${turma.cursos?.nome || ''}`
            }))}
            value={formData.turma_id}
            onChange={(value) => setFormData({ ...formData, turma_id: value || '' })}
            required
          />

          <TextInput
            label="CPF"
            placeholder="Digite o CPF"
            value={formData.cpf}
            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
          />

          <TextInput
            label="Telefone"
            placeholder="Digite o telefone"
            value={formData.telefone}
            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
          />

          <TextInput
            label="Endereço"
            placeholder="Digite o endereço"
            value={formData.endereco}
            onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
          />

          <TextInput
            label="Data de Nascimento"
            placeholder="YYYY-MM-DD"
            type="date"
            value={formData.data_nascimento}
            onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={accessLoading}>
              {editingAluno ? 'Atualizar' : 'Criar Aluno'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal de Acesso Gerado */}
      <Modal
        opened={accessModalOpened}
        onClose={closeAccessModal}
        title="Acesso Criado com Sucesso!"
        size="md"
      >
        <Stack>
          <Alert icon={<IconInfoCircle size={16} />} color="green">
            O aluno foi criado com sucesso! Compartilhe as informações de acesso abaixo:
          </Alert>

          {generatedAccess && (
            <Paper p="md" withBorder>
              <Stack gap="sm">
                <div>
                  <Text size="sm" fw={500} mb={4}>
                    {generatedAccess.username ? 'Nome de Usuário:' : 'Email:'}
                  </Text>
                  <Group gap="xs">
                    <Text family="monospace" size="sm">
                      {generatedAccess.username || generatedAccess.email}
                    </Text>
                    <CopyButton value={generatedAccess.username || generatedAccess.email || ''}>
                      {({ copied, copy }) => (
                        <ActionIcon
                          color={copied ? 'teal' : 'gray'}
                          variant="subtle"
                          onClick={copy}
                          size="sm"
                        >
                          {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                        </ActionIcon>
                      )}
                    </CopyButton>
                  </Group>
                </div>

                <div>
                  <Text size="sm" fw={500} mb={4}>
                    Senha:
                  </Text>
                  <Group gap="xs">
                    <Text family="monospace" size="sm">
                      {showPassword ? generatedAccess.password : '••••••••••••'}
                    </Text>
                    <ActionIcon
                      variant="subtle"
                      onClick={() => setShowPassword(!showPassword)}
                      size="sm"
                    >
                      {showPassword ? <IconEyeOff size={12} /> : <IconEye size={12} />}
                    </ActionIcon>
                    <CopyButton value={generatedAccess.password || ''}>
                      {({ copied, copy }) => (
                        <ActionIcon
                          color={copied ? 'teal' : 'gray'}
                          variant="subtle"
                          onClick={copy}
                          size="sm"
                        >
                          {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                        </ActionIcon>
                      )}
                    </CopyButton>
                    <ActionIcon
                      variant="subtle"
                      onClick={generateNewPassword}
                      size="sm"
                      color="blue"
                    >
                      <IconRefresh size={12} />
                    </ActionIcon>
                  </Group>
                </div>
              </Stack>
            </Paper>
          )}

          <Divider label="Compartilhar Acesso" labelPosition="center" />

          <Group justify="center">
            <Button
              leftSection={<IconMail size={16} />}
              variant="outline"
              onClick={() => handleShareAccess('email')}
            >
              Email
            </Button>
            <Button
              leftSection={<IconBrandWhatsapp size={16} />}
              variant="outline"
              color="green"
              onClick={() => handleShareAccess('whatsapp')}
            >
              WhatsApp
            </Button>
            <Button
              leftSection={<IconCopy size={16} />}
              variant="outline"
              onClick={() => handleShareAccess('copy')}
            >
              Copiar
            </Button>
          </Group>

          <Group justify="flex-end" mt="md">
            <Button onClick={closeAccessModal}>
              Fechar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}