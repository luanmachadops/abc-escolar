import { Container, Title, Text, Grid, Card, Group, ThemeIcon, Stack, Loader, Alert, Button } from '@mantine/core';
import {
  IconUsers,
  IconBook,
  IconSchool,
  IconChalkboard,
  IconTrendingUp,
  IconCurrencyDollar,
  IconRefresh,
  IconAlertCircle
} from '@tabler/icons-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useUserData } from '../hooks/useUserData';

const Dashboard = () => {
  const { stats, atividadesRecentes, proximosEventos, loading, error, refreshData } = useDashboardData();
  const { userData, loading: userLoading } = useUserData();

  const statsConfig = [
    {
      title: 'Total de Alunos',
      value: stats.totalAlunos.toString(),
      icon: IconSchool,
      color: 'blue'
    },
    {
      title: 'Professores',
      value: stats.totalProfessores.toString(),
      icon: IconChalkboard,
      color: 'green'
    },
    {
      title: 'Turmas Ativas',
      value: stats.totalTurmas.toString(),
      icon: IconUsers,
      color: 'orange'
    },
    {
      title: 'Cursos',
      value: stats.totalCursos.toString(),
      icon: IconBook,
      color: 'purple'
    },
    {
      title: 'Taxa de Aprovação',
      value: `${stats.taxaAprovacao}%`,
      icon: IconTrendingUp,
      color: 'teal'
    },
    {
      title: 'Receita Mensal',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(stats.receitaMensal),
      icon: IconCurrencyDollar,
      color: 'red'
    }
  ];

  // Debug: Mostrar informações na tela
  if (userLoading) {
    return (
      <Container size="xl">
        <Stack align="center" justify="center" h={400}>
          <Loader size="lg" />
          <Text>Carregando dados do usuário...</Text>
        </Stack>
      </Container>
    );
  }

  if (!userData) {
    return (
      <Container size="xl">
        <Stack align="center" justify="center" h={400}>
          <Text c="red">Usuário não encontrado ou não logado</Text>
          <Text c="dimmed" mt="sm">Por favor, faça login novamente</Text>
        </Stack>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container size="xl">
        <Stack align="center" justify="center" h={400}>
          <Loader size="lg" />
          <Text>Carregando dados do dashboard...</Text>
          <Text size="sm" c="dimmed" mt="sm">Escola: {userData.escola_id}</Text>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl">
        <Stack align="center" justify="center" h={400}>
          <Text c="red">Erro ao carregar dados: {error}</Text>
          <Text c="dimmed" size="sm" ta="center" mt="sm">
            Isso pode acontecer se não há dados cadastrados no sistema ainda.
            <br />
            Comece cadastrando uma escola, usuários e turmas.
          </Text>
          <Button onClick={refreshData} leftSection={<IconRefresh size={16} />}>
            Tentar Novamente
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="xs">Dashboard</Title>
          <Text c="dimmed" size="lg">
            Bem-vindo ao painel de controle do ABC Escolar
          </Text>
        </div>

        <Grid>
          {statsConfig.map((stat, index) => (
            <Grid.Col key={index} span={{ base: 12, sm: 6, md: 4 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text c="dimmed" size="sm" tt="uppercase" fw={700}>
                      {stat.title}
                    </Text>
                    <Text fw={700} size="xl">
                      {stat.value}
                    </Text>
                  </div>
                  <ThemeIcon
                    color={stat.color}
                    variant="light"
                    size={38}
                    radius="md"
                  >
                    <stat.icon size={24} />
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder h={400}>
              <Group justify="space-between" mb="md">
                <Title order={3}>Atividades Recentes</Title>
                <Button
                  variant="subtle"
                  size="xs"
                  leftSection={<IconRefresh size={14} />}
                  onClick={refreshData}
                >
                  Atualizar
                </Button>
              </Group>
              <Stack gap="md">
                {atividadesRecentes.length > 0 ? (
                  atividadesRecentes.map((atividade) => (
                    <Group key={atividade.id} gap="xs">
                      <Text c="dimmed" size="sm">
                        • {atividade.descricao}
                      </Text>
                      <Text c="dimmed" size="xs" ml="auto">
                        {atividade.data}
                      </Text>
                    </Group>
                  ))
                ) : (
                  <Text c="dimmed" ta="center" py="xl">
                    Nenhuma atividade recente encontrada
                  </Text>
                )}
              </Stack>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder h={400}>
              <Title order={3} mb="md">Próximos Eventos</Title>
              <Stack gap="md">
                {proximosEventos.length > 0 ? (
                  proximosEventos.map((evento) => (
                    <div key={evento.id}>
                      <Text fw={500}>{evento.titulo}</Text>
                      <Text size="sm" c="dimmed">
                        {evento.data} - {evento.hora}
                      </Text>
                    </div>
                  ))
                ) : (
                  <Text c="dimmed" ta="center" py="xl">
                    Nenhum evento programado
                  </Text>
                )}
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
};

export default Dashboard;