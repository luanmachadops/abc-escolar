import { Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider, createTheme, MantineColorScheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RegisterSchoolPage from './pages/RegisterSchoolPage';
import RegisterAdminPage from './pages/RegisterAdminPage';
import RegisterConfirmPage from './pages/RegisterConfirmPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Turmas from './pages/Turmas';
import Cursos from './pages/Cursos';
import Alunos from './pages/Alunos';
import Professores from './pages/Professores';
import Comunicacao from './pages/Avisos';
import Chat from './pages/Chat';
import Relatorios from './pages/Relatorios';
import Financeiro from './pages/Financeiro';
import Configuracao from './pages/Configuracao';
import AcessoUsuarios from './pages/AcessoUsuarios';
import Calendario from './pages/Calendario';
import Debug from './pages/Debug';

const AppContent = () => {
  const { user, loading, isFirstTime } = useAuth();
  const { colorScheme } = useTheme();

  const theme = createTheme({
    primaryColor: 'blue',
  });

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <MantineProvider theme={theme} forceColorScheme={colorScheme}>
      <Notifications />
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={!user ? <LandingPage /> : (isFirstTime ? <Navigate to="/change-password" /> : <Navigate to="/dashboard" />)} />
        <Route path="/login" element={!user ? <LoginPage /> : (isFirstTime ? <Navigate to="/change-password" /> : <Navigate to="/dashboard" />)} />
        <Route path="/register" element={!user ? <RegisterPage /> : (isFirstTime ? <Navigate to="/change-password" /> : <Navigate to="/dashboard" />)} />
        <Route path="/register/school" element={!user ? <RegisterSchoolPage /> : (isFirstTime ? <Navigate to="/change-password" /> : <Navigate to="/dashboard" />)} />
        <Route path="/register/admin" element={!user ? <RegisterAdminPage /> : (isFirstTime ? <Navigate to="/change-password" /> : <Navigate to="/dashboard" />)} />
        <Route path="/register/confirm" element={!user ? <RegisterConfirmPage /> : (isFirstTime ? <Navigate to="/change-password" /> : <Navigate to="/dashboard" />)} />
        <Route path="/change-password" element={user && isFirstTime ? <ChangePasswordPage /> : <Navigate to={user ? "/dashboard" : "/login"} />} />
        <Route path="/debug" element={<Debug />} />
        
        {/* Rotas protegidas */}
        <Route path="/dashboard" element={
          isFirstTime ? <Navigate to="/change-password" /> : (
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          )
        }>
          <Route index element={<Dashboard />} />
          <Route path="turmas" element={
            <ProtectedRoute allowedRoles={['admin', 'secretario', 'professor']}>
              <Turmas />
            </ProtectedRoute>
          } />
          <Route path="cursos" element={
            <ProtectedRoute allowedRoles={['admin', 'secretario']}>
              <Cursos />
            </ProtectedRoute>
          } />
          <Route path="alunos" element={
            <ProtectedRoute allowedRoles={['admin', 'secretario', 'professor']}>
              <Alunos />
            </ProtectedRoute>
          } />
          <Route path="professores" element={
            <ProtectedRoute allowedRoles={['admin', 'secretario']}>
              <Professores />
            </ProtectedRoute>
          } />
          <Route path="comunicacao" element={<Comunicacao />} />
          <Route path="comunicacao2" element={<Chat />} />
          <Route path="calendario" element={<Calendario />} />
          <Route path="relatorios" element={
            <ProtectedRoute allowedRoles={['admin', 'secretario']}>
              <Relatorios />
            </ProtectedRoute>
          } />
          <Route path="financeiro" element={
            <ProtectedRoute allowedRoles={['admin', 'secretario']}>
              <Financeiro />
            </ProtectedRoute>
          } />
          <Route path="acesso-usuarios" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AcessoUsuarios />
            </ProtectedRoute>
          } />
          <Route path="configuracao" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Configuracao />
            </ProtectedRoute>
          } />
        </Route>
        
        {/* Rota de fallback */}
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} />} />
      </Routes>
    </MantineProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;