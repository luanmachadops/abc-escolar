import { Container, Title, Text, Button, Group, Stack, Box, Grid, Card, ThemeIcon } from '@mantine/core';
import { IconSchool, IconUsers, IconChartBar, IconShield, IconMoon, IconSun } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const LandingPage = () => {
  const { colorScheme, toggleColorScheme } = useTheme();

  const features = [
    {
      icon: IconSchool,
      title: 'Gestão Completa',
      description: 'Gerencie turmas, cursos, alunos e professores em um só lugar'
    },
    {
      icon: IconUsers,
      title: 'Comunicação Eficiente',
      description: 'Sistema integrado de comunicação entre escola, professores e responsáveis'
    },
    {
      icon: IconChartBar,
      title: 'Relatórios Detalhados',
      description: 'Acompanhe o desempenho e gere relatórios personalizados'
    },
    {
      icon: IconShield,
      title: 'Seguro e Confiável',
      description: 'Seus dados protegidos com a mais alta segurança'
    }
  ];

  return (
    <Box style={{ minHeight: '100vh' }}>
      {/* Header */}
      <Container size="xl" py="md">
        <Group justify="space-between">
          <Group>
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

      {/* Hero Section */}
      <Container size="xl" py={80}>
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="xl">
              <Title order={1} size={48} fw={700}>
                Sistema de Gestão Escolar
                <Text component="span" c="blue" inherit>
                  {' '}Moderno e Completo
                </Text>
              </Title>
              
              <Text size="xl" c="dimmed">
                Transforme a gestão da sua instituição de ensino com nossa plataforma 
                completa e intuitiva. Gerencie alunos, professores, turmas e muito mais.
              </Text>
              
              <Group>
                <Button 
                  component={Link} 
                  to="/login" 
                  size="lg" 
                  radius="md"
                >
                  Fazer Login
                </Button>
                <Button 
                  component={Link} 
                  to="/register/school" 
                  variant="outline" 
                  size="lg" 
                  radius="md"
                >
                  Cadastrar-se
                </Button>
              </Group>
            </Stack>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Box 
              style={{ 
                height: 400, 
                background: 'linear-gradient(135deg, #228be6 0%, #339af0 100%)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <IconSchool size={120} color="white" />
            </Box>
          </Grid.Col>
        </Grid>
      </Container>

      {/* Features Section */}
      <Container size="xl" py={80}>
        <Stack align="center" gap="xl">
          <Title order={2} ta="center">Por que escolher o ABC Escolar?</Title>
          
          <Grid>
            {features.map((feature, index) => (
              <Grid.Col key={index} span={{ base: 12, sm: 6, md: 3 }}>
                <Card shadow="sm" padding="lg" radius="md" h="100%">
                  <Stack align="center" gap="md">
                    <ThemeIcon size={60} radius="md" variant="light">
                      <feature.icon size={30} />
                    </ThemeIcon>
                    <Title order={4} ta="center">{feature.title}</Title>
                    <Text size="sm" c="dimmed" ta="center">
                      {feature.description}
                    </Text>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Stack>
      </Container>

      {/* CTA Section */}
      <Box bg="var(--mantine-color-gray-1)">
        <Container size="xl" py={60}>
          <Stack align="center" gap="lg">
            <Title order={2} ta="center">Pronto para começar?</Title>
            <Text size="lg" ta="center" c="dimmed">
              Junte-se a centenas de escolas que já transformaram sua gestão
            </Text>
            <Button 
              component={Link} 
              to="/register/school" 
              size="xl" 
              radius="md"
            >
              Começar Agora
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;