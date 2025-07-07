import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Button,
  Table,
  Group,
  TextInput,
  Modal,
  Stack,
  Badge,
  ActionIcon,
  Text,
  Paper,
  Flex,
  Tooltip,
  NumberInput,
  Textarea,
  Alert,
  Box,
  Divider
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconBook,
  IconClock,
  IconUsers,
  IconInfoCircle
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabase';
import { useUserData } from '../hooks/useUserData';

interface Curso {
  id: string;
  nome: string;
  descricao?: string;
  duracao_meses: number;
  ativo: boolean;
  created_at: string;
  escola_id: string;
  _count?: {
    turmas: number;
    disciplinas: number;
  };
}

export default function Cursos() {
  const { userData, isAdminOrSecretary } = useUserData();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [opened, { open, close }] = useDisclosure(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    duracao_meses: 12
  });

  // Verificar permissões
  const hasPermission = isAdminOrSecretary();

  // Carregar dados iniciais
  useEffect(() => {
    loadCursos();
  }, []);

  const loadCursos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;

      // Buscar contagem de turmas e disciplinas para cada curso
      const cursosWithCount = await Promise.all(
        (data || []).map(async (curso) => {
          const [turmasCount, disciplinasCount] = await Promise.all([
            supabase
              .from('turmas')
              .select('*', { count: 'exact', head: true })
              .eq('curso_id', curso.id)
              .eq('ativo', true),
            supabase
              .from('disciplinas')
              .select('*', { count: 'exact', head: true })
              .eq('curso_id', curso.id)
              .eq('ativo', true)
          ]);
          
          return {
            ...curso,
            _count: {
              turmas: turmasCount.count || 0,
              disciplinas: disciplinasCount.count || 0
            }
          };
        })
      );

      setCursos(cursosWithCount);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
      notifications.show({
        title: 'Erro',
        message: 'Erro ao carregar lista de cursos',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      notifications.show({
        title: 'Erro',
        message: 'Nome do curso é obrigatório',
        color: 'red'
      });
      return;
    }

    if (formData.duracao_meses < 1) {
      notifications.show({
        title: 'Erro',
        message: 'Duração deve ser maior que zero',
        color: 'red'
      });
      return;
    }

    try {
      if (editingCurso) {
        // Atualizar curso existente
        const { error } = await supabase
          .from('cursos')
          .update({
            nome: formData.nome,
            descricao: formData.descricao || null,
            duracao_meses: formData.duracao_meses
          })
          .eq('id', editingCurso.id);

        if (error) throw error;

        notifications.show({
          title: 'Sucesso',
          message: 'Curso atualizado com sucesso',
          color: 'green'
        });
      } else {
        // Criar novo curso
        const { error } = await supabase
          .from('cursos')
          .insert({
            nome: formData.nome,
            descricao: formData.descricao || null,
            duracao_meses: formData.duracao_meses,
            escola_id: userData?.escola_id
          });

        if (error) throw error;

        notifications.show({
          title: 'Sucesso',
          message: 'Curso criado com sucesso',
          color: 'green'
        });
      }

      handleClose();
      loadCursos();
    } catch (error: any) {
      console.error('Erro ao salvar curso:', error);
      notifications.show({
        title: 'Erro',
        message: error.message || 'Erro ao salvar curso',
        color: 'red'
      });
    }
  };

  const handleEdit = (curso: Curso) => {
    setEditingCurso(curso);
    setFormData({
      nome: curso.nome,
      descricao: curso.descricao || '',
      duracao_meses: curso.duracao_meses
    });
    open();
  };

  const handleDelete = async (curso: Curso) => {
    if (!confirm(`Tem certeza que deseja excluir o curso "${curso.nome}"?`)) {
      return;
    }

    try {
      // Verificar se há turmas ou disciplinas vinculadas
      const [turmasCount, disciplinasCount] = await Promise.all([
        supabase
          .from('turmas')
          .select('*', { count: 'exact', head: true })
          .eq('curso_id', curso.id)
          .eq('ativo', true),
        supabase
          .from('disciplinas')
          .select('*', { count: 'exact', head: true })
          .eq('curso_id', curso.id)
          .eq('ativo', true)
      ]);

      const totalVinculos = (turmasCount.count || 0) + (disciplinasCount.count || 0);

      if (totalVinculos > 0) {
        notifications.show({
          title: 'Erro',
          message: `Não é possível excluir o curso "${curso.nome}" pois há ${totalVinculos} turma(s) ou disciplina(s) vinculada(s)`,
          color: 'red'
        });
        return;
      }

      // Desativar curso ao invés de excluir
      const { error } = await supabase
        .from('cursos')
        .update({ ativo: false })
        .eq('id', curso.id);

      if (error) throw error;

      notifications.show({
        title: 'Sucesso',
        message: 'Curso excluído com sucesso',
        color: 'green'
      });

      loadCursos();
    } catch (error: any) {
      console.error('Erro ao excluir curso:', error);
      notifications.show({
        title: 'Erro',
        message: error.message || 'Erro ao excluir curso',
        color: 'red'
      });
    }
  };

  const handleClose = () => {
    close();
    setEditingCurso(null);
    setFormData({
      nome: '',
      descricao: '',
      duracao_meses: 12
    });
  };

  // Filtrar cursos
  const filteredCursos = cursos.filter(curso => 
    curso.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    curso.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Verificar permissões após todos os hooks
  if (!hasPermission) {
    return (
      <Container size="xl">
        <Alert icon={<IconInfoCircle size={16} />} title="Acesso Negado" color="red">
          Você não tem permissão para acessar esta página.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Stack gap="md">
        {/* Cabeçalho */}
        <Group justify="space-between">
          <div>
            <Title order={2}>Gerenciamento de Cursos</Title>
            <Text size="sm" c="dimmed" mt="xs">
              Configure os cursos oferecidos pela escola. Defina nomes, descrições, duração e organize a estrutura curricular da sua instituição.
            </Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={open}>
            Novo Curso
          </Button>
        </Group>

        {/* Filtros */}
        <Paper p="md" withBorder>
          <TextInput
            placeholder="Buscar cursos..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: 400 }}
          />
        </Paper>

        {/* Tabela de Cursos */}
        <Paper withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nome do Curso</Table.Th>
                <Table.Th>Descrição</Table.Th>
                <Table.Th>Duração</Table.Th>
                <Table.Th>Turmas</Table.Th>
                <Table.Th>Disciplinas</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th width={120}>Ações</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text ta="center" py="xl">Carregando...</Text>
                  </Table.Td>
                </Table.Tr>
              ) : filteredCursos.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text ta="center" py="xl" c="dimmed">
                      {searchTerm 
                        ? 'Nenhum curso encontrado com os filtros aplicados'
                        : 'Nenhum curso cadastrado'
                      }
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredCursos.map((curso) => (
                  <Table.Tr key={curso.id}>
                    <Table.Td>
                      <Text fw={500}>{curso.nome}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text c={curso.descricao ? 'dark' : 'dimmed'} lineClamp={2}>
                        {curso.descricao || 'Sem descrição'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <IconClock size={16} />
                        <Text>
                          {curso.duracao_meses} {curso.duracao_meses === 1 ? 'mês' : 'meses'}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <IconUsers size={16} />
                        <Text>{curso._count?.turmas || 0}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <IconBook size={16} />
                        <Text>{curso._count?.disciplinas || 0}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={curso.ativo ? 'green' : 'red'}>
                        {curso.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Tooltip label="Editar curso">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => handleEdit(curso)}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Excluir curso">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => handleDelete(curso)}
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

        {/* Estatísticas */}
        <Group gap="md">
          <Paper p="md" withBorder style={{ flex: 1 }}>
            <Group gap="xs">
              <IconBook size={20} color="blue" />
              <div>
                <Text size="sm" c="dimmed">Total de Cursos</Text>
                <Text size="xl" fw={700}>{cursos.length}</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder style={{ flex: 1 }}>
            <Group gap="xs">
              <IconUsers size={20} color="green" />
              <div>
                <Text size="sm" c="dimmed">Total de Turmas</Text>
                <Text size="xl" fw={700}>
                  {cursos.reduce((acc, curso) => acc + (curso._count?.turmas || 0), 0)}
                </Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder style={{ flex: 1 }}>
            <Group gap="xs">
              <IconClock size={20} color="orange" />
              <div>
                <Text size="sm" c="dimmed">Duração Média</Text>
                <Text size="xl" fw={700}>
                  {cursos.length > 0 
                    ? Math.round(cursos.reduce((acc, curso) => acc + curso.duracao_meses, 0) / cursos.length)
                    : 0
                  } meses
                </Text>
              </div>
            </Group>
          </Paper>
        </Group>
      </Stack>

      {/* Modal de Criação/Edição */}
      <Modal
        opened={opened}
        onClose={handleClose}
        title={editingCurso ? 'Editar Curso' : 'Novo Curso'}
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="Nome do Curso"
            placeholder="Ex: Ensino Fundamental, Ensino Médio..."
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
          />

          <Textarea
            label="Descrição"
            placeholder="Descrição detalhada do curso (opcional)"
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            minRows={3}
            maxRows={6}
          />

          <NumberInput
            label="Duração em Meses"
            description="Duração total do curso em meses"
            value={formData.duracao_meses}
            onChange={(value) => setFormData({ ...formData, duracao_meses: Number(value) || 12 })}
            min={1}
            max={120}
            required
          />

          <Divider />

          <Group justify="flex-end" gap="md">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingCurso ? 'Atualizar' : 'Criar'} Curso
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}