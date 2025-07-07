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
  Tooltip,
  Alert,
  CopyButton,
  Divider,
  MultiSelect
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
  IconRefresh,
  IconInfoCircle
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabase';
import { useUserAccess, CreateUserAccessParams, UserAccessData } from '../hooks/useUserAccess';
import { useAuth } from '../contexts/AuthContext';

interface Professor {
  id: string;
  nome_completo: string;
  email?: string;
  telefone?: string;
  username?: string;
  ativo: boolean;
  created_at: string;
  disciplinas?: { nome: string }[];
}

interface Disciplina {
  id: string;
  nome: string;
  curso_id: string;
  cursos?: { nome: string };
}

export default function Professores() {
  const { user } = useAuth();
  const { createUserAccess, generateSecurePassword, loading: accessLoading } = useUserAccess();
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDisciplina, setSelectedDisciplina] = useState<string>('');
  const [opened, { open, close }] = useDisclosure(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
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
    disciplinas_ids: [] as string[],
    tipo_acesso: 'email' // 'email' ou 'username'
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadProfessores();
    loadDisciplinas();
  }, []);

  const loadProfessores = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          *,
          professor_disciplinas(
            disciplinas(
              nome
            )
          )
        `)
        .eq('funcao', 'professor')
        .order('nome_completo');

      if (error) throw error;

      const professoresFormatted = data?.map(professor => ({
        ...professor,
        disciplinas: professor.professor_disciplinas?.map((pd: any) => pd.disciplinas) || []
      })) || [];

      setProfessores(professoresFormatted);
    } catch (error) {
      console.error('Erro ao carregar professores:', error);
      notifications.show({
        title: 'Erro',
        message: 'Erro ao carregar lista de professores',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDisciplinas = async () => {
    try {
      const { data, error } = await supabase
        .from('disciplinas')
        .select(`
          *,
          cursos(
            nome
          )
        `)
        .order('nome');

      if (error) throw error;
      setDisciplinas(data || []);
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error);
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

    // Disciplinas serão associadas posteriormente na gestão de turmas
    // if (formData.disciplinas_ids.length === 0) {
    //   notifications.show({
    //     title: 'Erro',
    //     message: 'Pelo menos uma disciplina deve ser selecionada',
    //     color: 'red'
    //   });
    //   return;
    // }

    if (formData.tipo_acesso === 'email' && !formData.email.trim()) {
      notifications.show({
        title: 'Erro',
        message: 'Email é obrigatório quando tipo de acesso é email',
        color: 'red'
      });
      return;
    }

    try {
      if (editingProfessor) {
        // Atualizar professor existente
        const { error } = await supabase
          .from('usuarios')
          .update({
            nome_completo: formData.nome,
            email: formData.email || null,
            telefone: formData.telefone || null
          })
          .eq('id', editingProfessor.id);

        if (error) throw error;

        // Associações com disciplinas serão gerenciadas na gestão de turmas
         // await supabase
         //   .from('professor_disciplinas')
         //   .delete()
         //   .eq('professor_id', editingProfessor.id);

         // if (formData.disciplinas_ids.length > 0) {
         //   const professorDisciplinas = formData.disciplinas_ids.map(disciplina_id => ({
         //     professor_id: editingProfessor.id,
         //     disciplina_id
         //   }));

         //   await supabase
         //     .from('professor_disciplinas')
         //     .insert(professorDisciplinas);
         // }

        notifications.show({
          title: 'Sucesso',
          message: 'Professor atualizado com sucesso!',
          color: 'green'
        });
      } else {
        // Criar novo professor com acesso
        const accessParams: CreateUserAccessParams = {
          nome: formData.nome,
          email: formData.tipo_acesso === 'email' ? formData.email : undefined,
          role: 'professor',
          escola_id: user?.user_metadata?.escola_id || '',
          cpf: formData.cpf || undefined,
          telefone: formData.telefone || undefined,
          endereco: formData.endereco || undefined,
          data_nascimento: formData.data_nascimento || undefined,
          // disciplinas: formData.disciplinas_ids // Será associado posteriormente
        };

        const accessData = await createUserAccess(accessParams);
        
        if (accessData) {
          setGeneratedAccess(accessData);
          openAccessModal();
        }
      }

      loadProfessores();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar professor:', error);
      notifications.show({
        title: 'Erro',
        message: 'Erro ao salvar professor',
        color: 'red'
      });
    }
  };

  const handleEdit = (professor: Professor) => {
    setEditingProfessor(professor);
    setFormData({
      nome: professor.nome_completo,
      email: professor.email || '',
      cpf: '',
      telefone: professor.telefone || '',
      endereco: '',
      data_nascimento: '',
      disciplinas_ids: [],
      tipo_acesso: professor.email ? 'email' : 'username'
    });
    open();
  };

  const handleDelete = async (professor: Professor) => {
    if (!confirm(`Tem certeza que deseja excluir o professor ${professor.nome_completo}?`)) {
      return;
    }

    try {
      // Deletar associações (se existirem)
       await supabase
         .from('professor_disciplinas')
         .delete()
         .eq('professor_id', professor.id);

      // Deletar usuário da tabela usuarios
      const { error: dbError } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', professor.id);

      if (dbError) throw dbError;

      // Deletar usuário do Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(professor.id);
      if (authError) {
        console.warn('Erro ao deletar usuário do Auth:', authError.message);
      }

      notifications.show({
        title: 'Sucesso',
        message: 'Professor excluído com sucesso!',
        color: 'green'
      });

      loadProfessores();
    } catch (error) {
      console.error('Erro ao excluir professor:', error);
      notifications.show({
        title: 'Erro',
        message: 'Erro ao excluir professor',
        color: 'red'
      });
    }
  };

  const handleCloseModal = () => {
    close();
    setEditingProfessor(null);
    setFormData({
      nome: '',
      email: '',
      cpf: '',
      telefone: '',
      endereco: '',
      data_nascimento: '',
      disciplinas_ids: [],
      tipo_acesso: 'email'
    });
  };

  const handleShareAccess = (type: 'email' | 'whatsapp' | 'copy') => {
    if (!generatedAccess) return;

    // Priorizar username se existir, senão usar o email (que pode ser fictício)
    const loginInfo = generatedAccess.username 
      ? `Usuário: ${generatedAccess.username}`
      : `Email: ${generatedAccess.email}`;
    
    const raInfo = generatedAccess.ra ? `\nRA: ${generatedAccess.ra}` : '';
    const message = `🎓 Acesso ao Sistema Escolar\n\n${loginInfo}${raInfo}\nSenha: ${generatedAccess.password}\n\nAcesse: ${window.location.origin}/login`;

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

  // Filtrar professores
  const filteredProfessores = professores.filter(professor => {
    const matchesSearch = professor.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (professor.email && professor.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (professor.username && professor.username.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDisciplina = !selectedDisciplina || 
                             professor.disciplinas?.some(disciplina => disciplina?.nome === selectedDisciplina);
    
    return matchesSearch && matchesDisciplina;
  });

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={1}>Gestão de Professores</Title>
          <Text size="sm" c="dimmed" mt="xs">
            Cadastre e gerencie o corpo docente da escola. Configure acessos, associe professores às disciplinas e mantenha as informações atualizadas.
          </Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Novo Professor
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
            placeholder="Filtrar por disciplina"
            data={[
              { value: '', label: 'Todas as disciplinas' },
              ...disciplinas.map(disciplina => ({
                value: disciplina?.nome || '',
                label: `${disciplina?.nome || 'Sem nome'} - ${disciplina?.cursos?.nome || ''}`
              }))
            ]}
            value={selectedDisciplina}
            onChange={(value) => setSelectedDisciplina(value || '')}
            clearable
          />
        </Group>
      </Paper>

      {/* Tabela de Professores */}
      <Paper>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nome</Table.Th>
              <Table.Th>Acesso</Table.Th>
              <Table.Th>Disciplinas</Table.Th>
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
            ) : filteredProfessores.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text ta="center">Nenhum professor encontrado</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              filteredProfessores.map((professor) => (
                <Table.Tr key={professor.id}>
                  <Table.Td>
                    <div>
                      <Text fw={500}>{professor.nome_completo}</Text>
                      {professor.telefone && <Text size="sm" c="dimmed">{professor.telefone}</Text>}
                    </div>
                  </Table.Td>
                  <Table.Td>
                    {professor.email ? (
                      <Text size="sm">{professor.email}</Text>
                    ) : professor.username ? (
                      <Badge variant="light" color="blue">{professor.username}</Badge>
                    ) : (
                      <Text size="sm" c="dimmed">Sem acesso</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {professor.disciplinas?.slice(0, 2).map(disciplina => (
                        <Badge key={disciplina?.nome || Math.random()} variant="outline" size="sm">
                          {disciplina?.nome || 'Sem nome'}
                        </Badge>
                      ))}
                      {professor.disciplinas && professor.disciplinas.length > 2 && (
                        <Badge variant="light" size="sm" color="gray">
                          +{professor.disciplinas.length - 2}
                        </Badge>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{professor.telefone || '-'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={professor.ativo ? 'green' : 'red'}>
                      {professor.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="Editar">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => handleEdit(professor)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Excluir">
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDelete(professor)}
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
        title={editingProfessor ? 'Editar Professor' : 'Novo Professor'}
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

          {!editingProfessor && (
            <Select
              label="Tipo de Acesso"
              description="Escolha como o professor fará login no sistema"
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
              Um nome de usuário será gerado automaticamente baseado no nome do professor.
              Exemplo: prof.maria.santos.2024
            </Alert>
          )}

          <Alert icon={<IconInfoCircle size={16} />} color="blue">
             As disciplinas serão associadas posteriormente na gestão de turmas e horários.
           </Alert>

           {/* <MultiSelect
             label="Disciplinas"
             placeholder="Selecione as disciplinas que o professor irá lecionar"
             data={disciplinas.map(disciplina => ({
               value: disciplina.id,
               label: `${disciplina?.nome || 'Sem nome'} - ${disciplina?.cursos?.nome || ''}`
             }))}
             value={formData.disciplinas_ids}
             onChange={(value) => setFormData({ ...formData, disciplinas_ids: value })}
             required
             searchable
           /> */}

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
              {editingProfessor ? 'Atualizar' : 'Criar Professor'}
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
            O professor foi criado com sucesso! Compartilhe as informações de acesso abaixo:
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

                {generatedAccess.ra && (
                  <div>
                    <Text size="sm" fw={500} mb={4}>
                      RA:
                    </Text>
                    <Group gap="xs">
                      <Text family="monospace" size="sm">
                        {generatedAccess.ra}
                      </Text>
                      <CopyButton value={generatedAccess.ra}>
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
                )}

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