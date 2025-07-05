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
  IconCalendar,
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
import { useUserData } from '../../hooks/useUserData';
import { usePermissions } from '../auth/ProtectedRoute';
import { notifications } from '@mantine/notifications';

const DashboardLayout = () => {
  const [opened, setOpened] = useState(false);
  const { user, signOut } = useAuth();
  const { userData, loading: userDataLoading } = useUserData();
  const { 
    canManageCourses, 
    canManageUsers, 
    canViewReports, 
    canManageFinances, 
    canManageSchool,
    isProfessor,
    isAluno
  } = usePermissions();
  const { colorScheme, toggleColorScheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Filtrar itens do menu baseado nas permissões
  const allMenuItems = [
    { icon: IconDashboard, label: 'Dashboard', path: '/dashboard', show: true },
    { icon: IconUsers, label: 'Turmas', path: '/dashboard/turmas', show: canManageCourses || isProfessor() },
    { icon: IconBook, label: 'Cursos', path: '/dashboard/cursos', show: canManageCourses },
    { icon: IconSchool, label: 'Alunos', path: '/dashboard/alunos', show: canManageUsers || isProfessor() },
    { icon: IconChalkboard, label: 'Professores', path: '/dashboard/professores', show: canManageUsers },
    { icon: IconMessageCircle, label: 'Comunicação', path: '/dashboard/comunicacao', show: true },
    { icon: IconCalendar, label: 'Calendário', path: '/dashboard/calendario', show: true },
    { icon: IconChartBar, label: 'Relatórios', path: '/dashboard/relatorios', show: canViewReports },
    { icon: IconCurrencyDollar, label: 'Financeiro', path: '/dashboard/financeiro', show: canManageFinances },
    { icon: IconSettings, label: 'Configuração', path: '/dashboard/configuracao', show: canManageSchool }
  ];

  const menuItems = allMenuItems.filter(item => item.show);

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
                        {userData?.nome_completo || user?.email}
                      </Text>
                      <Text c="dimmed" size="xs">
                        {userData?.funcao === 'admin' ? 'Administrador' :
                         userData?.funcao === 'secretario' ? 'Secretário' :
                         userData?.funcao === 'professor' ? 'Professor' :
                         userData?.funcao === 'aluno' ? 'Aluno' : 'Usuário'}
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