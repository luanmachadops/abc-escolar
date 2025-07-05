import { Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RegisterSchoolPage from './pages/RegisterSchoolPage';
import RegisterAdminPage from './pages/RegisterAdminPage';
import RegisterConfirmPage from './pages/RegisterConfirmPage';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Turmas from './pages/Turmas';
import Cursos from './pages/Cursos';
import Alunos from './pages/Alunos';
import Professores from './pages/Professores';
import Comunicacao from './pages/Comunicacao';
import Relatorios from './pages/Relatorios';
import Financeiro from './pages/Financeiro';
import Configuracao from './pages/Configuracao';

const AppContent = () => {
  const { user, loading } = useAuth();
  const { colorScheme } = useTheme();

  const theme = createTheme({
    colorScheme,
    primaryColor: 'blue',
  });

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <MantineProvider theme={theme}>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/dashboard" />} />
        <Route path="/register/school" element={!user ? <RegisterSchoolPage /> : <Navigate to="/dashboard" />} />
        <Route path="/register/admin" element={!user ? <RegisterAdminPage /> : <Navigate to="/dashboard" />} />
        <Route path="/register/confirm" element={!user ? <RegisterConfirmPage /> : <Navigate to="/dashboard" />} />
        
        {/* Rotas protegidas */}
        <Route path="/dashboard" element={user ? <DashboardLayout /> : <Navigate to="/" />}>
          <Route index element={<Dashboard />} />
          <Route path="turmas" element={<Turmas />} />
          <Route path="cursos" element={<Cursos />} />
          <Route path="alunos" element={<Alunos />} />
          <Route path="professores" element={<Professores />} />
          <Route path="comunicacao" element={<Comunicacao />} />
          <Route path="relatorios" element={<Relatorios />} />
          <Route path="financeiro" element={<Financeiro />} />
          <Route path="configuracao" element={<Configuracao />} />
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