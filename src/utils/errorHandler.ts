// =============================================
// SISTEMA DE TRATAMENTO DE ERROS APRIMORADO
// =============================================

import { AuthError } from '@supabase/supabase-js';
import { notifications } from '@mantine/notifications';

// Tipos de erro personalizados
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  context?: string;
}

// Códigos de erro específicos da aplicação
export const ERROR_CODES = {
  // Autenticação
  AUTH_INVALID_CREDENTIALS: 'auth/invalid-credentials',
  AUTH_USER_NOT_FOUND: 'auth/user-not-found',
  AUTH_EMAIL_NOT_CONFIRMED: 'auth/email-not-confirmed',
  AUTH_WEAK_PASSWORD: 'auth/weak-password',
  AUTH_EMAIL_ALREADY_EXISTS: 'auth/email-already-exists',
  
  // Autorização
  PERMISSION_DENIED: 'permission/denied',
  INSUFFICIENT_PRIVILEGES: 'permission/insufficient-privileges',
  
  // Dados
  DATA_NOT_FOUND: 'data/not-found',
  DATA_VALIDATION_ERROR: 'data/validation-error',
  DATA_CONSTRAINT_VIOLATION: 'data/constraint-violation',
  
  // Rede
  NETWORK_ERROR: 'network/error',
  NETWORK_TIMEOUT: 'network/timeout',
  
  // Sistema
  SYSTEM_ERROR: 'system/error',
  UNKNOWN_ERROR: 'unknown/error'
} as const;

// Mensagens de erro em português
const ERROR_MESSAGES: Record<string, string> = {
  // Autenticação
  'auth/invalid-credentials': 'Email ou senha incorretos',
  'auth/user-not-found': 'Usuário não encontrado',
  'auth/email-not-confirmed': 'Email não confirmado. Verifique sua caixa de entrada',
  'auth/weak-password': 'A senha deve ter pelo menos 8 caracteres',
  'auth/email-already-exists': 'Este email já está em uso',
  'Invalid login credentials': 'Email ou senha incorretos',
  'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
  'User already registered': 'Este email já está cadastrado',
  
  // Autorização
  'permission/denied': 'Acesso negado',
  'permission/insufficient-privileges': 'Privilégios insuficientes para esta operação',
  'new row violates row-level security policy': 'Você não tem permissão para realizar esta operação',
  
  // Dados
  'data/not-found': 'Dados não encontrados',
  'data/validation-error': 'Erro de validação dos dados',
  'data/constraint-violation': 'Violação de restrição dos dados',
  'duplicate key value violates unique constraint': 'Este registro já existe',
  'violates foreign key constraint': 'Referência inválida nos dados',
  
  // Rede
  'network/error': 'Erro de conexão. Verifique sua internet',
  'network/timeout': 'Tempo limite de conexão excedido',
  'Failed to fetch': 'Erro de conexão. Verifique sua internet',
  
  // Sistema
  'system/error': 'Erro interno do sistema',
  'unknown/error': 'Erro desconhecido'
};

// Classe para logging estruturado
class Logger {
  private static instance: Logger;
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  error(error: any, context?: string, additionalData?: any) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      context: context || 'Unknown',
      error: {
        message: error?.message || 'Unknown error',
        code: error?.code || 'UNKNOWN',
        stack: error?.stack,
        details: error?.details || error
      },
      additionalData,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    console.group(`🚨 [ABC ESCOLAR] Erro em ${context}`);
    console.error('Detalhes do erro:', errorInfo);
    console.error('Erro original:', error);
    console.groupEnd();
    
    // Em produção, aqui você enviaria para um serviço de monitoramento
    // como Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // this.sendToMonitoringService(errorInfo);
    }
  }
  
  warn(message: string, context?: string, data?: any) {
    console.group(`⚠️ [ABC ESCOLAR] Aviso em ${context}`);
    console.warn(message, data);
    console.groupEnd();
  }
  
  info(message: string, context?: string, data?: any) {
    console.group(`ℹ️ [ABC ESCOLAR] Info em ${context}`);
    console.info(message, data);
    console.groupEnd();
  }
  
  debug(message: string, context?: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🐛 [ABC ESCOLAR] Debug em ${context}`);
      console.debug(message, data);
      console.groupEnd();
    }
  }
}

export const logger = Logger.getInstance();

// Função para mapear erros do Supabase
function mapSupabaseError(error: any): AppError {
  const timestamp = new Date();
  
  // Erros de autenticação
  if (error instanceof AuthError) {
    return {
      code: `auth/${error.message.toLowerCase().replace(/\s+/g, '-')}`,
      message: ERROR_MESSAGES[error.message] || error.message,
      details: error,
      timestamp
    };
  }
  
  // Erros de RLS (Row Level Security)
  if (error?.message?.includes('row-level security policy')) {
    return {
      code: ERROR_CODES.PERMISSION_DENIED,
      message: ERROR_MESSAGES['new row violates row-level security policy'],
      details: error,
      timestamp
    };
  }
  
  // Erros de constraint
  if (error?.message?.includes('duplicate key')) {
    return {
      code: ERROR_CODES.DATA_CONSTRAINT_VIOLATION,
      message: ERROR_MESSAGES['duplicate key value violates unique constraint'],
      details: error,
      timestamp
    };
  }
  
  if (error?.message?.includes('foreign key')) {
    return {
      code: ERROR_CODES.DATA_CONSTRAINT_VIOLATION,
      message: ERROR_MESSAGES['violates foreign key constraint'],
      details: error,
      timestamp
    };
  }
  
  // Erros de rede
  if (error?.message?.includes('Failed to fetch') || error?.name === 'NetworkError') {
    return {
      code: ERROR_CODES.NETWORK_ERROR,
      message: ERROR_MESSAGES['Failed to fetch'],
      details: error,
      timestamp
    };
  }
  
  // Buscar mensagem conhecida
  const knownMessage = ERROR_MESSAGES[error?.message];
  if (knownMessage) {
    return {
      code: error?.code || ERROR_CODES.UNKNOWN_ERROR,
      message: knownMessage,
      details: error,
      timestamp
    };
  }
  
  // Erro genérico
  return {
    code: error?.code || ERROR_CODES.UNKNOWN_ERROR,
    message: error?.message || 'Erro desconhecido',
    details: error,
    timestamp
  };
}

// Função principal para tratar erros
export function handleError(error: any, context?: string, showToast = true): AppError {
  const appError = mapSupabaseError(error);
  appError.context = context;
  
  // Log estruturado
  logger.error(error, context, { appError });
  
  // Mostrar notificação para o usuário
  if (showToast) {
    notifications.show({
      title: 'Erro',
      message: appError.message,
      color: 'red',
      autoClose: 5000
    });
  }
  
  return appError;
}

// Função para tratar erros de validação
export function handleValidationError(field: string, message: string, context?: string): AppError {
  const appError: AppError = {
    code: ERROR_CODES.DATA_VALIDATION_ERROR,
    message: `${field}: ${message}`,
    timestamp: new Date(),
    context,
    details: { field, validationMessage: message }
  };
  
  logger.warn(`Erro de validação: ${field}`, context, { message });
  
  notifications.show({
    title: 'Erro de Validação',
    message: appError.message,
    color: 'orange',
    autoClose: 4000
  });
  
  return appError;
}

// Função para tratar sucessos
export function handleSuccess(message: string, context?: string) {
  logger.info(message, context);
  
  notifications.show({
    title: 'Sucesso',
    message: message,
    color: 'green',
    autoClose: 3000
  });
}

// Hook para capturar erros não tratados
export function setupGlobalErrorHandling() {
  // Capturar erros JavaScript não tratados
  window.addEventListener('error', (event) => {
    handleError(event.error, 'Global Error Handler', false);
  });
  
  // Capturar promises rejeitadas não tratadas
  window.addEventListener('unhandledrejection', (event) => {
    handleError(event.reason, 'Unhandled Promise Rejection', false);
  });
  
  logger.info('Sistema de tratamento de erros inicializado', 'Error Handler');
}

// Wrapper para funções assíncronas
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: string
) {
  return async (...args: T): Promise<R | null> => {
    try {
      const result = await fn(...args);
      return result;
    } catch (error) {
      handleError(error, context);
      return null;
    }
  };
}

// Tipos para TypeScript
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
export type ErrorHandler = (error: any, context?: string, showToast?: boolean) => AppError;