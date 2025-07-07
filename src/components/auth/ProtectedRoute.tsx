import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Center, Loader, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserData, UserData } from '../../hooks/useUserData';
import { UserRole } from '../../lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireActive?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles, 
  requireActive = true 
}) => {
  const { user, loading: authLoading } = useAuth();
  const { userData, loading: userDataLoading, error } = useUserData();
  const location = useLocation();

  // Aguardar carregamento da autenticação
  if (authLoading || userDataLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  // Verificar se o usuário está autenticado
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar se houve erro ao carregar dados do usuário
  if (error || !userData) {
    return (
      <Center h="100vh" p="2rem">
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          color="red" 
          title="Erro de Acesso"
          style={{ maxWidth: 400 }}
        >
          {error || 'Não foi possível carregar os dados do usuário. Verifique suas permissões.'}
        </Alert>
      </Center>
    );
  }

  // Verificar se o usuário está ativo (se requerido)
  if (requireActive && !userData.ativo) {
    return (
      <Center style={{ height: '100vh', padding: '2rem' }}>
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          color="orange" 
          title="Conta Inativa"
          style={{ maxWidth: 400 }}
        >
          Sua conta está inativa. Entre em contato com o administrador.
        </Alert>
      </Center>
    );
  }

  // Verificar permissões de role (se especificadas)
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(userData.funcao)) {
      return (
        <Center h="100vh" p="2rem">
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            color="red" 
            title="Acesso Negado"
            style={{ maxWidth: 400 }}
          >
            Você não tem permissão para acessar esta página.
          </Alert>
        </Center>
      );
    }
  }

  // Se passou por todas as verificações, renderizar o conteúdo
  return <>{children}</>;
};

export default ProtectedRoute;

// Hook para verificar permissões em componentes
export const usePermissions = () => {
  const { userData } = useUserData();

  const hasRole = (roles: UserRole[]) => {
    if (!userData) return false;
    return roles.includes(userData.funcao);
  };

  const isAdmin = () => hasRole(['admin']);
  const isAdminOrSecretary = () => hasRole(['admin', 'secretario']);
  const isProfessor = () => hasRole(['professor']);
  const isAluno = () => hasRole(['aluno']);

  const canManageSchool = () => isAdmin();
  const canManageUsers = () => isAdminOrSecretary();
  const canManageCourses = () => isAdminOrSecretary();
  const canManageClasses = () => isAdminOrSecretary();
  const canViewReports = () => isAdminOrSecretary();
  const canManageFinances = () => isAdminOrSecretary();

  return {
    userData,
    hasRole,
    isAdmin,
    isAdminOrSecretary,
    isProfessor,
    isAluno,
    canManageSchool,
    canManageUsers,
    canManageCourses,
    canManageClasses,
    canViewReports,
    canManageFinances
  };
};