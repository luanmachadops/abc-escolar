import { Container, Title, Text, Grid, Card, Group, ThemeIcon, Stack } from '@mantine/core';
import {
  IconUsers,
  IconBook,
  IconSchool,
  IconChalkboard,
  IconTrendingUp,
  IconCurrencyDollar
} from '@tabler/icons-react';

const Dashboard = () => {
  const stats = [
    {
      title: 'Total de Alunos',
      value: '1,234',
      icon: IconSchool,
      color: 'blue'
    },
    {
      title: 'Professores',
      value: '89',
      icon: IconChalkboard,
      color: 'green'
    },
    {
      title: 'Turmas Ativas',
      value: '45',
      icon: IconUsers,
      color: 'orange'
    },
    {
      title: 'Cursos',
      value: '12',
      icon: IconBook,
      color: 'purple'
    },
    {
      title: 'Taxa de Aprovação',
      value: '94%',
      icon: IconTrendingUp,
      color: 'teal'
    },
    {
      title: 'Receita Mensal',
      value: 'R$ 125.000',
      icon: IconCurrencyDollar,
      color: 'red'
    }
  ];

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
          {stats.map((stat, index) => (
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
              <Title order={3} mb="md">Atividades Recentes</Title>
              <Stack gap="md">
                <Text c="dimmed">• Novo aluno matriculado: João Silva</Text>
                <Text c="dimmed">• Professor Maria Santos adicionou notas da turma 3A</Text>
                <Text c="dimmed">• Relatório mensal de frequência gerado</Text>
                <Text c="dimmed">• Pagamento processado: Turma 2B</Text>
                <Text c="dimmed">• Nova comunicação enviada aos responsáveis</Text>
              </Stack>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder h={400}>
              <Title order={3} mb="md">Próximos Eventos</Title>
              <Stack gap="md">
                <div>
                  <Text fw={500}>Reunião de Pais</Text>
                  <Text size="sm" c="dimmed">15/12/2024 - 19:00</Text>
                </div>
                <div>
                  <Text fw={500}>Prova Final - 3º Ano</Text>
                  <Text size="sm" c="dimmed">18/12/2024 - 08:00</Text>
                </div>
                <div>
                  <Text fw={500}>Formatura</Text>
                  <Text size="sm" c="dimmed">20/12/2024 - 19:00</Text>
                </div>
                <div>
                  <Text fw={500}>Férias Escolares</Text>
                  <Text size="sm" c="dimmed">22/12/2024 - 02/02/2025</Text>
                </div>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
};

export default Dashboard;