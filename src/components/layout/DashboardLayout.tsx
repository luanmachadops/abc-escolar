import { useState } from 'react';
import {
  AppShell,
  Navbar,
  Header,
  Text,
  Group,
  Button,
  Stack,
  NavLink,
  Title,
  Menu,
  Avatar,
  UnstyledButton,
  Box,
  Burger
} from '@mantine/core';
import {
  IconDashboard,
  IconUsers,
  IconBook,
  IconSchool,
  IconChalkboard,
  IconMessageCircle,
  IconChartBar,
  IconCurrencyDollar,
  IconSettings,
  IconLogout,
  IconUser,
  IconMoon,
  IconSun
} from '@tabler/icons-react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { notifications } from '@mantine/notifications';

const DashboardLayout = () => {
  const [opened, setOpened] = useState(false);
  const { user, signOut } = useAuth();
  const { colorScheme, toggleColorScheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: IconDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: IconUsers, label: 'Turmas', path: '/dashboard/turmas' },
    { icon: IconBook, label: 'Cursos', path: '/dashboard/cursos' },
    { icon: IconSchool, label: 'Alunos', path: '/dashboard/alunos' },
    { icon: IconChalkboard, label: 'Professores', path: '/dashboard/professores' },
    { icon: IconMessageCircle, label: 'Comunicação', path: '/dashboard/comunicacao' },
    { icon: IconChartBar, label: 'Relatórios', path: '/dashboard/relatorios' },
    { icon: IconCurrencyDollar, label: 'Financeiro', path: '/dashboard/financeiro' },
    { icon: IconSettings, label: 'Configuração', path: '/dashboard/configuracao' }
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      notifications.show({
        title: 'Logout realizado',
        message: 'Até logo!',
        color: 'blue'
      });
      navigate('/');
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao fazer logout',
        color: 'red'
      });
    }
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 280,
        breakpoint: 'sm',
        collapsed: { mobile: !opened }
      }}
      padding="md"
    >
      {/* Header */}
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={() => setOpened((o) => !o)}
              hiddenFrom="sm"
              size="sm"
            />
            <Group>
              <IconSchool size={28} color="#228be6" />
              <Title order={3} c="blue">ABC Escolar</Title>
            </Group>
          </Group>

          <Group>
            <Button
              variant="subtle"
              onClick={toggleColorScheme}
              leftSection={colorScheme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
            >
              {colorScheme === 'dark' ? 'Claro' : 'Escuro'}
            </Button>
            
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <UnstyledButton>
                  <Group>
                    <Avatar size={32} radius="xl" />
                    <Box style={{ flex: 1 }}>
                      <Text size="sm" fw={500}>
                        {user?.user_metadata?.name || user?.email}
                      </Text>
                      <Text c="dimmed" size="xs">
                        Administrador
                      </Text>
                    </Box>
                  </Group>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item leftSection={<IconUser size={14} />}>
                  Perfil
                </Menu.Item>
                <Menu.Item leftSection={<IconSettings size={14} />}>
                  Configurações
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item 
                  leftSection={<IconLogout size={14} />} 
                  color="red"
                  onClick={handleLogout}
                >
                  Sair
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      {/* Sidebar */}
      <AppShell.Navbar p="md">
        <Stack gap="xs">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              component={Link}
              to={item.path}
              label={item.label}
              leftSection={<item.icon size={20} />}
              active={location.pathname === item.path}
              onClick={() => setOpened(false)}
            />
          ))}
        </Stack>
      </AppShell.Navbar>

      {/* Main Content */}
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
};

export default DashboardLayout;