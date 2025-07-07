import { useState } from 'react';
import {
  Container,
  Title,
  Paper,
  Group,
  Button,
  Text,
  Stack,
  Badge,
  ActionIcon,
  Grid,
  Box,
  Modal,
  TextInput,
  Textarea,
  Select,
  rem
} from '@mantine/core';
import {
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconCalendar,
  IconClock,
  IconMapPin
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

interface Evento {
  id: string;
  titulo: string;
  descricao?: string;
  data: Date;
  hora?: string;
  local?: string;
  tipo: 'aula' | 'reuniao' | 'evento' | 'feriado' | 'outro';
  cor: string;
}

const Calendario = () => {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [eventoSelecionado, setEventoSelecionado] = useState<Evento | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [modalEvento, { open: openEvento, close: closeEvento }] = useDisclosure(false);

  // Eventos de exemplo
  const [eventos] = useState<Evento[]>([
    {
      id: '1',
      titulo: 'Reunião Pedagógica',
      descricao: 'Reunião mensal com todos os professores',
      data: new Date(2024, 11, 15),
      hora: '14:00',
      local: 'Sala de Reuniões',
      tipo: 'reuniao',
      cor: 'var(--mantine-color-blue-6)'
    },
    {
      id: '2',
      titulo: 'Apresentação de Projetos',
      descricao: 'Apresentação dos projetos finais do semestre',
      data: new Date(2024, 11, 20),
      hora: '09:00',
      local: 'Auditório',
      tipo: 'evento',
      cor: 'var(--mantine-color-green-6)'
    },
    {
      id: '3',
      titulo: 'Natal',
      descricao: 'Feriado Nacional',
      data: new Date(2024, 11, 25),
      tipo: 'feriado',
      cor: 'var(--mantine-color-orange-6)'
    },
    {
      id: '4',
      titulo: 'Aula de Matemática',
      descricao: 'Turma 3º Ano A',
      data: new Date(2024, 11, 18),
      hora: '08:00',
      local: 'Sala 101',
      tipo: 'aula',
      cor: 'var(--mantine-color-red-8)'
    }
  ]);

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const proximoMes = () => {
    setDataAtual(new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 1));
  };

  const mesAnterior = () => {
    setDataAtual(new Date(dataAtual.getFullYear(), dataAtual.getMonth() - 1, 1));
  };

  const obterDiasDoMes = () => {
    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diasAntes = primeiroDia.getDay();
    const diasNoMes = ultimoDia.getDate();

    const dias = [];

    // Dias do mês anterior
    for (let i = diasAntes - 1; i >= 0; i--) {
      const dia = new Date(ano, mes, -i);
      dias.push({ data: dia, outroMes: true });
    }

    // Dias do mês atual
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const data = new Date(ano, mes, dia);
      dias.push({ data, outroMes: false });
    }

    // Dias do próximo mês para completar a grade
    const diasRestantes = 42 - dias.length;
    for (let dia = 1; dia <= diasRestantes; dia++) {
      const data = new Date(ano, mes + 1, dia);
      dias.push({ data, outroMes: true });
    }

    return dias;
  };

  const obterEventosParaDia = (data: Date) => {
    return eventos.filter(evento => 
      evento.data.toDateString() === data.toDateString()
    );
  };

  const formatarData = (data: Date) => {
    return data.toLocaleDateString('pt-BR');
  };

  const getTipoEventoLabel = (tipo: string) => {
    const tipos = {
      'aula': 'Aula',
      'reuniao': 'Reunião',
      'evento': 'Evento',
      'feriado': 'Feriado',
      'outro': 'Outro'
    };
    return tipos[tipo as keyof typeof tipos] || 'Outro';
  };

  const handleNovoEvento = () => {
    notifications.show({
      title: 'Em desenvolvimento',
      message: 'Funcionalidade de criar eventos será implementada em breve',
      color: 'blue'
    });
  };

  const dias = obterDiasDoMes();

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Cabeçalho */}
        <Group justify="space-between">
          <Title order={2}>📅 Calendário Escolar</Title>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleNovoEvento}
          >
            Novo Evento
          </Button>
        </Group>

        {/* Navegação do Calendário */}
        <Paper p="md" withBorder>
          <Group justify="space-between" mb="md">
            <ActionIcon
              variant="subtle"
              onClick={mesAnterior}
              size="lg"
            >
              <IconChevronLeft size={20} />
            </ActionIcon>
            
            <Title order={3}>
              {meses[dataAtual.getMonth()]} {dataAtual.getFullYear()}
            </Title>
            
            <ActionIcon
              variant="subtle"
              onClick={proximoMes}
              size="lg"
            >
              <IconChevronRight size={20} />
            </ActionIcon>
          </Group>

          {/* Cabeçalho dos dias da semana */}
          <Grid gutter="xs" mb="xs">
            {diasSemana.map((dia) => (
              <Grid.Col key={dia} span={{ base: 12/7 }}>
                <Text ta="center" fw={600} c="dimmed" size="sm">
                  {dia}
                </Text>
              </Grid.Col>
            ))}
          </Grid>

          {/* Grade do calendário */}
          <Grid gutter="xs">
            {dias.map((item, index) => {
              const eventosNoDia = obterEventosParaDia(item.data);
              const isHoje = item.data.toDateString() === new Date().toDateString();
              
              return (
                <Grid.Col key={index} span={{ base: 12/7 }}>
                  <Box
                    mih={rem(80)}
                    p={4}
                    style={{
                      border: '1px solid var(--mantine-color-gray-3)',
                      borderRadius: 'var(--mantine-radius-sm)',
                      backgroundColor: item.outroMes ? 'var(--mantine-color-gray-1)' : isHoje ? 'var(--mantine-color-blue-0)' : 'var(--mantine-color-body)',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      if (eventosNoDia.length > 0) {
                        setEventoSelecionado(eventosNoDia[0]);
                        openEvento();
                      }
                    }}
                  >
                    <Text
                      size="sm"
                      c={item.outroMes ? 'dimmed' : isHoje ? 'blue' : 'dark'}
                      fw={isHoje ? 600 : 400}
                    >
                      {item.data.getDate()}
                    </Text>
                    
                    <Stack gap={2} mt={2}>
                      {eventosNoDia.slice(0, 2).map((evento) => (
                        <Badge
                          key={evento.id}
                          size="xs"
                          color={evento.tipo === 'reuniao' ? 'blue' : evento.tipo === 'evento' ? 'green' : evento.tipo === 'feriado' ? 'orange' : 'red'}
                          variant="filled"
                        >
                          {evento.titulo.length > 10 
                            ? evento.titulo.substring(0, 10) + '...' 
                            : evento.titulo
                          }
                        </Badge>
                      ))}
                      {eventosNoDia.length > 2 && (
                        <Text size="xs" c="dimmed">
                          +{eventosNoDia.length - 2} mais
                        </Text>
                      )}
                    </Stack>
                  </Box>
                </Grid.Col>
              );
            })}
          </Grid>
        </Paper>

        {/* Próximos Eventos */}
        <Paper p="md" withBorder>
          <Title order={4} mb="md">📋 Próximos Eventos</Title>
          <Stack gap="sm">
            {eventos
              .filter(evento => evento.data >= new Date())
              .sort((a, b) => a.data.getTime() - b.data.getTime())
              .slice(0, 5)
              .map((evento) => (
                <Group
                  key={evento.id}
                  justify="space-between"
                  p="sm"
                  style={{
                    border: '1px solid var(--mantine-color-gray-3)',
                    borderRadius: 'var(--mantine-radius-md)',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setEventoSelecionado(evento);
                    openEvento();
                  }}
                >
                  <Group>
                    <Box
                      w={12}
                      h={12}
                      bg={evento.tipo === 'reuniao' ? 'var(--mantine-color-blue-6)' : evento.tipo === 'evento' ? 'var(--mantine-color-green-6)' : evento.tipo === 'feriado' ? 'var(--mantine-color-orange-6)' : 'var(--mantine-color-red-8)'}
                      style={{
                        borderRadius: '50%'
                      }}
                    />
                    <Stack gap={2}>
                      <Text fw={500}>{evento.titulo}</Text>
                      <Group gap="xs">
                        <Group gap={4}>
                          <IconCalendar size={14} />
                          <Text size="sm" c="dimmed">
                            {formatarData(evento.data)}
                          </Text>
                        </Group>
                        {evento.hora && (
                          <Group gap={4}>
                            <IconClock size={14} />
                            <Text size="sm" c="dimmed">
                              {evento.hora}
                            </Text>
                          </Group>
                        )}
                        {evento.local && (
                          <Group gap={4}>
                            <IconMapPin size={14} />
                            <Text size="sm" c="dimmed">
                              {evento.local}
                            </Text>
                          </Group>
                        )}
                      </Group>
                    </Stack>
                  </Group>
                  <Badge variant="light" color={evento.tipo === 'reuniao' ? 'blue' : evento.tipo === 'evento' ? 'green' : evento.tipo === 'feriado' ? 'orange' : 'red'}>
                    {getTipoEventoLabel(evento.tipo)}
                  </Badge>
                </Group>
              ))
            }
          </Stack>
        </Paper>
      </Stack>

      {/* Modal de Detalhes do Evento */}
      <Modal
        opened={modalEvento}
        onClose={closeEvento}
        title="Detalhes do Evento"
        size="md"
      >
        {eventoSelecionado && (
          <Stack gap="md">
            <Group>
              <Box
                w={16}
                h={16}
                bg={eventoSelecionado.tipo === 'reuniao' ? 'var(--mantine-color-blue-6)' : eventoSelecionado.tipo === 'evento' ? 'var(--mantine-color-green-6)' : eventoSelecionado.tipo === 'feriado' ? 'var(--mantine-color-orange-6)' : 'var(--mantine-color-red-8)'}
                style={{
                  borderRadius: '50%'
                }}
              />
              <Title order={4}>{eventoSelecionado.titulo}</Title>
            </Group>
            
            {eventoSelecionado.descricao && (
              <Text>{eventoSelecionado.descricao}</Text>
            )}
            
            <Group>
              <IconCalendar size={16} />
              <Text>{formatarData(eventoSelecionado.data)}</Text>
            </Group>
            
            {eventoSelecionado.hora && (
              <Group>
                <IconClock size={16} />
                <Text>{eventoSelecionado.hora}</Text>
              </Group>
            )}
            
            {eventoSelecionado.local && (
              <Group>
                <IconMapPin size={16} />
                <Text>{eventoSelecionado.local}</Text>
              </Group>
            )}
            
            <Badge
              variant="light"
              color={eventoSelecionado.tipo === 'reuniao' ? 'blue' : eventoSelecionado.tipo === 'evento' ? 'green' : eventoSelecionado.tipo === 'feriado' ? 'orange' : 'red'}
            >
              {getTipoEventoLabel(eventoSelecionado.tipo)}
            </Badge>
          </Stack>
        )}
      </Modal>
    </Container>
  );
};

export default Calendario;