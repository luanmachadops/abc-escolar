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
  IconUsers,
  IconBook,
  IconCalendar,
  IconInfoCircle
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabase';
import { useUserData } from '../hooks/useUserData';

interface Turma {
  id: string;
  nome: string;
  ano_letivo: number;
  semestre?: number;
  capacidade_maxima: number;
  ativo: boolean;
  created_at: string;
  curso_id: string;
  cursos?: {
    nome: string;
  };
  _count?: {
    alunos: number;
  };
}

interface Curso {
  id: string;
  nome: string;
  descricao?: string;
}

export default function Turmas() {
  const { userData, isAdminOrSecretary } = useUserData();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCurso, setSelectedCurso] = useState<string>('');
  const [selectedAno, setSelectedAno] = useState<string>('');
  const [opened, { open, close }] = useDisclosure(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    curso_id: '',
    ano_letivo: new Date().getFullYear(),
    semestre: 1,
    capacidade_maxima: 30
  });

  // Verificar permissões
  const hasPermission = isAdminOrSecretary();

  // Carregar dados iniciais
  useEffect(() => {
    loadTurmas();
    loadCursos();
  }, []);

  const loadTurmas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('turmas')
        .select(`
          *,
          cursos(
            nome
          )
        `)
        .eq('ativo', true)
        .order('ano_letivo', { ascending: false })
        .order('nome');

      if (error) throw error;

      // Buscar contagem de alunos para cada turma
      const turmasWithCount = await Promise.all(
        (data || []).map(async (turma) => {
          const { count } = await supabase
            .from('aluno_turmas')
            .select('*', { count: 'exact', head: true })
            .eq('turma_id', turma.id);
          
          return {
            ...turma,
            _count: { alunos: count || 0 }
          };
        })
      );

      setTurmas(turmasWithCount);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
      notifications.show({
        title: 'Erro',
        message: 'Erro ao carregar lista de turmas',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCursos = async () => {
    try {
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setCursos(data || []);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      notifications.show({
        title: 'Erro',
        message: 'Nome da turma é obrigatório',
        color: 'red'
      });
      return;
    }

    if (!formData.curso_id) {
      notifications.show({
        title: 'Erro',
        message: 'Curso é obrigatório',
        color: 'red'
      });
      return;
    }

    try {
      if (editingTurma) {
        // Atualizar turma existente
        const { error } = await supabase
          .from('turmas')
          .update({
            nome: formData.nome,
            curso_id: formData.curso_id,
            ano_letivo: formData.ano_letivo,
            semestre: formData.semestre,
            capacidade_maxima: formData.capacidade_maxima
          })
          .eq('id', editingTurma.id);

        if (error) throw error;

        notifications.show({
          title: 'Sucesso',
          message: 'Turma atualizada com sucesso',
          color: 'green'
        });
      } else {
        // Criar nova turma
        const { error } = await supabase
          .from('turmas')
          .insert({
            nome: formData.nome,
            curso_id: formData.curso_id,
            ano_letivo: formData.ano_letivo,
            semestre: formData.semestre,
            capacidade_maxima: formData.capacidade_maxima,
            escola_id: userData?.escola_id
          });

        if (error) throw error;

        notifications.show({
          title: 'Sucesso',
          message: 'Turma criada com sucesso',
          color: 'green'
        });
      }

      handleClose();
      loadTurmas();
    } catch (error: any) {
      console.error('Erro ao salvar turma:', error);
      notifications.show({
        title: 'Erro',
        message: error.message || 'Erro ao salvar turma',
        color: 'red'
      });
    }
  };

  const handleEdit = (turma: Turma) => {
    setEditingTurma(turma);
    setFormData({
      nome: turma.nome,
      curso_id: turma.curso_id,
      ano_letivo: turma.ano_letivo,
      semestre: turma.semestre || 1,
      capacidade_maxima: turma.capacidade_maxima
    });
    open();
  };

  const handleDelete = async (turma: Turma) => {
    if (!confirm(`Tem certeza que deseja excluir a turma "${turma.nome}"?`)) {
      return;
    }

    try {
      // Verificar se há alunos matriculados
      const { count } = await supabase
        .from('aluno_turmas')
        .select('*', { count: 'exact', head: true })
        .eq('turma_id', turma.id);

      if (count && count > 0) {
        notifications.show({
          title: 'Erro',
          message: `Não é possível excluir a turma "${turma.nome}" pois há ${count} aluno(s) matriculado(s)`,
          color: 'red'
        });
        return;
      }

      // Desativar turma ao invés de excluir
      const { error } = await supabase
        .from('turmas')
        .update({ ativo: false })
        .eq('id', turma.id);

      if (error) throw error;

      notifications.show({
        title: 'Sucesso',
        message: 'Turma excluída com sucesso',
        color: 'green'
      });

      loadTurmas();
    } catch (error: any) {
      console.error('Erro ao excluir turma:', error);
      notifications.show({
        title: 'Erro',
        message: error.message || 'Erro ao excluir turma',
        color: 'red'
      });
    }
  };

  const handleClose = () => {
    close();
    setEditingTurma(null);
    setFormData({
      nome: '',
      curso_id: '',
      ano_letivo: new Date().getFullYear(),
      semestre: 1,
      capacidade_maxima: 30
    });
  };

  // Filtrar turmas
  const filteredTurmas = turmas.filter(turma => {
    const matchesSearch = turma.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         turma.cursos?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCurso = !selectedCurso || turma.curso_id === selectedCurso;
    const matchesAno = !selectedAno || turma.ano_letivo.toString() === selectedAno;
    
    return matchesSearch && matchesCurso && matchesAno;
  });

  // Gerar anos disponíveis
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const uniqueYears = [...new Set([...years, ...turmas.map(t => t.ano_letivo)])].sort((a, b) => b - a);

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
          <Title order={2}>Gerenciamento de Turmas</Title>
          <Button leftSection={<IconPlus size={16} />} onClick={open}>
            Nova Turma
          </Button>
        </Group>

        {/* Filtros */}
        <Paper p="md" withBorder>
          <Group gap="md">
            <TextInput
              placeholder="Buscar turmas..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Filtrar por curso"
              data={[
                { value: '', label: 'Todos os cursos' },
                ...cursos.map(curso => ({ value: curso.id, label: curso.nome }))
              ]}
              value={selectedCurso}
              onChange={(value) => setSelectedCurso(value || '')}
              style={{ minWidth: 200 }}
            />
            <Select
              placeholder="Filtrar por ano"
              data={[
                { value: '', label: 'Todos os anos' },
                ...uniqueYears.map(year => ({ value: year.toString(), label: year.toString() }))
              ]}
              value={selectedAno}
              onChange={(value) => setSelectedAno(value || '')}
              style={{ minWidth: 150 }}
            />
          </Group>
        </Paper>

        {/* Tabela de Turmas */}
        <Paper withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nome da Turma</Table.Th>
                <Table.Th>Curso</Table.Th>
                <Table.Th>Ano Letivo</Table.Th>
                <Table.Th>Semestre</Table.Th>
                <Table.Th>Alunos</Table.Th>
                <Table.Th>Capacidade</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th width={120}>Ações</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                <Table.Tr>
                  <Table.Td colSpan={8}>
                    <Text ta="center" py="xl">Carregando...</Text>
                  </Table.Td>
                </Table.Tr>
              ) : filteredTurmas.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={8}>
                    <Text ta="center" py="xl" c="dimmed">
                      {searchTerm || selectedCurso || selectedAno 
                        ? 'Nenhuma turma encontrada com os filtros aplicados'
                        : 'Nenhuma turma cadastrada'
                      }
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredTurmas.map((turma) => {
                  const ocupacao = turma._count?.alunos || 0;
                  const percentualOcupacao = (ocupacao / turma.capacidade_maxima) * 100;
                  
                  return (
                    <Table.Tr key={turma.id}>
                      <Table.Td>
                        <Text fw={500}>{turma.nome}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text>{turma.cursos?.nome}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" leftSection={<IconCalendar size={12} />}>
                          {turma.ano_letivo}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text>{turma.semestre}º Semestre</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <IconUsers size={16} />
                          <Text>
                            {ocupacao}/{turma.capacidade_maxima}
                          </Text>
                          <Badge 
                            size="xs" 
                            color={percentualOcupacao >= 90 ? 'red' : percentualOcupacao >= 70 ? 'yellow' : 'green'}
                          >
                            {Math.round(percentualOcupacao)}%
                          </Badge>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text>{turma.capacidade_maxima} alunos</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={turma.ativo ? 'green' : 'red'}>
                          {turma.ativo ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Tooltip label="Editar turma">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => handleEdit(turma)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Excluir turma">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => handleDelete(turma)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })
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
                <Text size="sm" c="dimmed">Total de Turmas</Text>
                <Text size="xl" fw={700}>{turmas.length}</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder style={{ flex: 1 }}>
            <Group gap="xs">
              <IconUsers size={20} color="green" />
              <div>
                <Text size="sm" c="dimmed">Total de Alunos</Text>
                <Text size="xl" fw={700}>
                  {turmas.reduce((acc, turma) => acc + (turma._count?.alunos || 0), 0)}
                </Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder style={{ flex: 1 }}>
            <Group gap="xs">
              <IconCalendar size={20} color="orange" />
              <div>
                <Text size="sm" c="dimmed">Ano Letivo Atual</Text>
                <Text size="xl" fw={700}>{currentYear}</Text>
              </div>
            </Group>
          </Paper>
        </Group>
      </Stack>

      {/* Modal de Criação/Edição */}
      <Modal
        opened={opened}
        onClose={handleClose}
        title={editingTurma ? 'Editar Turma' : 'Nova Turma'}
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="Nome da Turma"
            placeholder="Ex: 1º Ano A, Turma Matutina..."
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
          />

          <Select
            label="Curso"
            placeholder="Selecione o curso"
            data={cursos.map(curso => ({ value: curso.id, label: curso.nome }))}
            value={formData.curso_id}
            onChange={(value) => setFormData({ ...formData, curso_id: value || '' })}
            required
          />

          <Group grow>
            <NumberInput
              label="Ano Letivo"
              value={formData.ano_letivo}
              onChange={(value) => setFormData({ ...formData, ano_letivo: Number(value) || currentYear })}
              min={currentYear - 5}
              max={currentYear + 5}
              required
            />
            <Select
              label="Semestre"
              data={[
                { value: '1', label: '1º Semestre' },
                { value: '2', label: '2º Semestre' }
              ]}
              value={formData.semestre.toString()}
              onChange={(value) => setFormData({ ...formData, semestre: Number(value) || 1 })}
            />
          </Group>

          <NumberInput
            label="Capacidade Máxima"
            description="Número máximo de alunos que podem ser matriculados"
            value={formData.capacidade_maxima}
            onChange={(value) => setFormData({ ...formData, capacidade_maxima: Number(value) || 30 })}
            min={1}
            max={100}
            required
          />

          <Divider />

          <Group justify="flex-end" gap="md">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingTurma ? 'Atualizar' : 'Criar'} Turma
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}