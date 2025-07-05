# 🚀 Melhorias Avançadas para o Código ABC Escolar

## 📋 Visão Geral

Este documento apresenta sugestões avançadas para melhorar a qualidade, manutenibilidade, performance e escalabilidade do sistema ABC Escolar.

## 🏗️ Arquitetura e Estrutura

### 1. 📁 Reorganização da Estrutura de Pastas

```
src/
├── components/
│   ├── ui/           # Componentes reutilizáveis (Button, Input, etc.)
│   ├── forms/        # Componentes de formulário específicos
│   ├── layout/       # Componentes de layout
│   └── features/     # Componentes específicos por funcionalidade
├── hooks/
│   ├── api/          # Hooks para chamadas de API
│   ├── auth/         # Hooks de autenticação
│   └── utils/        # Hooks utilitários
├── services/
│   ├── api/          # Serviços de API organizados por entidade
│   ├── auth/         # Serviços de autenticação
│   └── validation/   # Schemas de validação
├── types/            # Definições de tipos TypeScript
├── constants/        # Constantes da aplicação
├── utils/            # Funções utilitárias
└── store/            # Estado global (se necessário)
```

### 2. 🔧 Implementação de Design System

```typescript
// src/components/ui/Button/Button.tsx
import { forwardRef } from 'react';
import { Button as MantineButton, ButtonProps } from '@mantine/core';
import { cn } from '../../../utils/cn';

interface CustomButtonProps extends ButtonProps {
  intent?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, CustomButtonProps>(
  ({ className, intent = 'primary', size = 'md', ...props }, ref) => {
    return (
      <MantineButton
        ref={ref}
        className={cn(
          'transition-all duration-200',
          {
            'bg-blue-600 hover:bg-blue-700': intent === 'primary',
            'bg-gray-600 hover:bg-gray-700': intent === 'secondary',
            'bg-red-600 hover:bg-red-700': intent === 'danger',
            'bg-green-600 hover:bg-green-700': intent === 'success',
          },
          className
        )}
        size={size}
        {...props}
      />
    );
  }
);

export { Button };
```

## 🔒 Segurança e Validação

### 1. 📝 Schema de Validação com Zod

```typescript
// src/services/validation/schemas.ts
import { z } from 'zod';

export const EscolaSchema = z.object({
  nome_instituicao: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(255, 'Nome muito longo'),
  cnpj_cpf: z.string()
    .refine((val) => {
      const cleaned = val.replace(/\D/g, '');
      return cleaned.length === 11 || cleaned.length === 14;
    }, 'CNPJ/CPF inválido'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  logradouro: z.string().min(1, 'Logradouro é obrigatório'),
  numero: z.string().min(1, 'Número é obrigatório'),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  pais: z.string().default('Brasil')
});

export const UsuarioSchema = z.object({
  nome_completo: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  funcao: z.enum(['admin', 'secretario', 'professor', 'aluno']),
  senha: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter ao menos uma letra minúscula, maiúscula e um número')
});

export type EscolaData = z.infer<typeof EscolaSchema>;
export type UsuarioData = z.infer<typeof UsuarioSchema>;
```

### 2. 🛡️ Middleware de Autenticação

```typescript
// src/components/auth/AuthGuard.tsx
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';
import { UserRole } from '../../types/auth';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorBoundary } from '../ui/ErrorBoundary';

interface AuthGuardProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
  fallback?: ReactNode;
}

export const AuthGuard = ({ 
  children, 
  requiredRoles, 
  fallback 
}: AuthGuardProps) => {
  const { user, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    return fallback || <Navigate to="/unauthorized" replace />;
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
};
```

## 🎯 Performance e Otimização

### 1. ⚡ React Query para Cache de Dados

```typescript
// src/hooks/api/useEscolas.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { escolaService } from '../../services/api/escolaService';
import { EscolaData } from '../../types/escola';

export const useEscolas = () => {
  return useQuery({
    queryKey: ['escolas'],
    queryFn: escolaService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
};

export const useCreateEscola = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: escolaService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escolas'] });
    },
    onError: (error) => {
      console.error('Erro ao criar escola:', error);
    }
  });
};
```

### 2. 🔄 Lazy Loading de Componentes

```typescript
// src/pages/index.ts
import { lazy } from 'react';

export const Dashboard = lazy(() => import('./Dashboard'));
export const Alunos = lazy(() => import('./Alunos'));
export const Professores = lazy(() => import('./Professores'));
export const Cursos = lazy(() => import('./Cursos'));
export const Financeiro = lazy(() => import('./Financeiro'));

// src/App.tsx
import { Suspense } from 'react';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

const App = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {/* Rotas */}
    </Suspense>
  );
};
```

## 🧪 Testes e Qualidade

### 1. 🔬 Configuração de Testes

```typescript
// src/utils/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MantineProvider>
          {children}
        </MantineProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### 2. 📊 Exemplo de Teste de Componente

```typescript
// src/components/forms/EscolaForm.test.tsx
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../../utils/test-utils';
import { EscolaForm } from './EscolaForm';

describe('EscolaForm', () => {
  it('deve validar campos obrigatórios', async () => {
    const onSubmit = jest.fn();
    render(<EscolaForm onSubmit={onSubmit} />);

    const submitButton = screen.getByRole('button', { name: /cadastrar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument();
      expect(screen.getByText('CNPJ/CPF é obrigatório')).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('deve submeter dados válidos', async () => {
    const onSubmit = jest.fn();
    render(<EscolaForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/nome/i), {
      target: { value: 'Escola Teste' }
    });
    fireEvent.change(screen.getByLabelText(/cnpj/i), {
      target: { value: '12.345.678/0001-90' }
    });

    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        nome_instituicao: 'Escola Teste',
        cnpj_cpf: '12.345.678/0001-90',
        // ... outros campos
      });
    });
  });
});
```

## 📱 Responsividade e UX

### 1. 🎨 Sistema de Breakpoints

```typescript
// src/constants/breakpoints.ts
export const breakpoints = {
  xs: '480px',
  sm: '768px',
  md: '1024px',
  lg: '1280px',
  xl: '1536px',
} as const;

// src/hooks/utils/useBreakpoint.ts
import { useMediaQuery } from '@mantine/hooks';
import { breakpoints } from '../../constants/breakpoints';

export const useBreakpoint = () => {
  const isMobile = useMediaQuery(`(max-width: ${breakpoints.sm})`);
  const isTablet = useMediaQuery(`(max-width: ${breakpoints.md})`);
  const isDesktop = useMediaQuery(`(min-width: ${breakpoints.lg})`);

  return { isMobile, isTablet, isDesktop };
};
```

### 2. 🌙 Tema Avançado

```typescript
// src/contexts/ThemeContext.tsx
import { createContext, useContext, ReactNode } from 'react';
import { MantineProvider, MantineTheme, createTheme } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';

const customTheme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Inter, sans-serif',
  headings: {
    fontFamily: 'Inter, sans-serif',
    fontWeight: '600',
  },
  components: {
    Button: {
      styles: {
        root: {
          borderRadius: '8px',
          fontWeight: 500,
        },
      },
    },
    Paper: {
      styles: {
        root: {
          borderRadius: '12px',
        },
      },
    },
  },
});

interface ThemeContextType {
  colorScheme: 'light' | 'dark';
  toggleColorScheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [colorScheme, setColorScheme] = useLocalStorage<'light' | 'dark'>({
    key: 'abc-escolar-theme',
    defaultValue: 'light',
  });

  const toggleColorScheme = () => {
    setColorScheme(colorScheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ colorScheme, toggleColorScheme }}>
      <MantineProvider theme={customTheme} forceColorScheme={colorScheme}>
        {children}
      </MantineProvider>
    </ThemeContext.Provider>
  );
};
```

## 🔍 Monitoramento e Logs

### 1. 📊 Sistema de Logs Estruturado

```typescript
// src/utils/logger.ts
interface LogContext {
  userId?: string;
  escolaId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private formatMessage(level: string, message: string, context?: LogContext) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };
  }

  info(message: string, context?: LogContext) {
    const logData = this.formatMessage('INFO', message, context);
    
    if (this.isDevelopment) {
      console.log('📘', logData);
    }
    
    // Em produção, enviar para serviço de monitoramento
    this.sendToMonitoring(logData);
  }

  error(message: string, error?: Error, context?: LogContext) {
    const logData = this.formatMessage('ERROR', message, {
      ...context,
      error: error?.message,
      stack: error?.stack,
    });
    
    if (this.isDevelopment) {
      console.error('🔴', logData);
    }
    
    this.sendToMonitoring(logData);
  }

  warn(message: string, context?: LogContext) {
    const logData = this.formatMessage('WARN', message, context);
    
    if (this.isDevelopment) {
      console.warn('🟡', logData);
    }
    
    this.sendToMonitoring(logData);
  }

  private sendToMonitoring(logData: any) {
    // Implementar integração com Sentry, LogRocket, etc.
    if (!this.isDevelopment) {
      // fetch('/api/logs', { method: 'POST', body: JSON.stringify(logData) });
    }
  }
}

export const logger = new Logger();
```

### 2. 🚨 Error Boundary Avançado

```typescript
// src/components/ui/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';
import { Alert, Button, Stack, Text } from '@mantine/core';
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';
import { logger } from '../../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Erro capturado pelo Error Boundary', error, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Alert
          icon={<IconAlertTriangle size={16} />}
          color="red"
          title="Ops! Algo deu errado"
        >
          <Stack spacing="sm">
            <Text size="sm">
              Ocorreu um erro inesperado. Nossa equipe foi notificada.
            </Text>
            <Button
              variant="outline"
              size="sm"
              leftSection={<IconRefresh size={16} />}
              onClick={this.handleRetry}
            >
              Tentar novamente
            </Button>
          </Stack>
        </Alert>
      );
    }

    return this.props.children;
  }
}
```

## 🚀 Deploy e CI/CD

### 1. 🐳 Dockerfile Otimizado

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Estágio de produção
FROM nginx:alpine

# Copiar build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração do nginx
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2. ⚙️ GitHub Actions

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # Script de deploy
```

## 📈 Métricas e Analytics

### 1. 📊 Hook de Analytics

```typescript
// src/hooks/utils/useAnalytics.ts
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

export const useAnalytics = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Rastrear mudanças de página
    if (typeof gtag !== 'undefined') {
      gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: location.pathname,
        user_id: user?.id,
      });
    }
  }, [location, user]);

  const trackEvent = ({ action, category, label, value }: AnalyticsEvent) => {
    if (typeof gtag !== 'undefined') {
      gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
        user_id: user?.id,
      });
    }
  };

  return { trackEvent };
};
```

## 🎯 Próximos Passos

### Prioridade Alta
1. **Implementar validação com Zod** - Melhora significativa na qualidade dos dados
2. **Configurar React Query** - Performance e experiência do usuário
3. **Adicionar Error Boundary** - Estabilidade da aplicação
4. **Implementar testes básicos** - Confiabilidade do código

### Prioridade Média
1. **Reorganizar estrutura de pastas** - Manutenibilidade
2. **Implementar design system** - Consistência visual
3. **Adicionar lazy loading** - Performance
4. **Configurar CI/CD** - Automação de deploy

### Prioridade Baixa
1. **Sistema de logs avançado** - Monitoramento
2. **Analytics** - Insights de uso
3. **PWA** - Experiência mobile
4. **Internacionalização** - Suporte a múltiplos idiomas

## 🎉 Conclusão

Essas melhorias transformarão o ABC Escolar em uma aplicação robusta, escalável e de alta qualidade. Implemente gradualmente, priorizando as melhorias que trarão maior impacto para sua equipe e usuários.