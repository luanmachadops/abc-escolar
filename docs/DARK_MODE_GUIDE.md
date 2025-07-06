# Guia de Dark Mode - ABC Escolar

## 📋 Visão Geral

Este documento estabelece as melhores práticas para implementação e manutenção do dark mode no sistema ABC Escolar, seguindo os padrões de engenharia de software.

## 🎯 Princípios Fundamentais

### 1. **Cores Semânticas**
- ✅ **USAR**: Cores do sistema Mantine (`c="dimmed"`, `c="blue"`, etc.)
- ❌ **EVITAR**: Cores hardcoded (`#1a1b1e`, `#f8f9fa`, etc.)

### 2. **Variáveis CSS do Mantine**
- ✅ **USAR**: `var(--mantine-color-gray-1)`, `var(--mantine-color-body)`
- ❌ **EVITAR**: Condicionais baseadas em `colorScheme`

### 3. **Componentes Nativos**
- ✅ **USAR**: Componentes Mantine que já suportam dark mode
- ❌ **EVITAR**: Estilização manual para dark/light mode

## 🛠️ Implementação Correta

### ✅ Boas Práticas

```tsx
// ✅ Correto - Usando cores semânticas
<Text c="dimmed">Texto secundário</Text>
<Box bg="var(--mantine-color-gray-1)">Fundo adaptável</Box>
<Paper withBorder>Conteúdo com borda</Paper>

// ✅ Correto - Usando ThemeIcon com variant
<ThemeIcon variant="light" color="blue">
  <IconSchool size={24} />
</ThemeIcon>

// ✅ Correto - Usando componentes nativos
<Container size="xl">
  <Stack gap="lg">
    <Title order={2}>Título</Title>
    <Text>Conteúdo</Text>
  </Stack>
</Container>
```

### ❌ Práticas a Evitar

```tsx
// ❌ Incorreto - Cores hardcoded
<Box style={{ 
  background: colorScheme === 'dark' ? '#1a1b1e' : '#f8f9fa' 
}}>

// ❌ Incorreto - Condicionais desnecessárias
<Text color={colorScheme === 'dark' ? '#ffffff' : '#000000'}>

// ❌ Incorreto - Estilos inline complexos
<div style={{
  backgroundColor: colorScheme === 'dark' ? '#25262b' : '#e9ecef',
  color: colorScheme === 'dark' ? '#ffffff' : '#000000'
}}>
```

## 🏗️ Estrutura do Tema

### ThemeContext
```tsx
// src/contexts/ThemeContext.tsx
export const ThemeProvider = ({ children }) => {
  const [colorScheme, setColorScheme] = useState<MantineColorScheme>('light');
  
  // Persistência no localStorage
  useEffect(() => {
    const saved = localStorage.getItem('abc-escolar-theme');
    if (saved) setColorScheme(saved);
  }, []);
  
  const toggleColorScheme = () => {
    const newScheme = colorScheme === 'light' ? 'dark' : 'light';
    setColorScheme(newScheme);
    localStorage.setItem('abc-escolar-theme', newScheme);
  };
};
```

### App.tsx
```tsx
// src/App.tsx
const AppContent = () => {
  const { colorScheme } = useTheme();
  
  const theme = createTheme({
    colorScheme,
    primaryColor: 'blue',
  });
  
  return (
    <MantineProvider theme={theme}>
      <Notifications />
      <Routes>
        {/* Rotas */}
      </Routes>
    </MantineProvider>
  );
};
```

## 🎨 Paleta de Cores Recomendada

### Cores Principais
- **Primary**: `blue` (padrão Mantine)
- **Secondary**: `gray`
- **Success**: `green`
- **Warning**: `yellow`
- **Error**: `red`

### Uso de Cores
```tsx
// Textos
<Text c="dimmed">Texto secundário</Text>
<Text c="blue">Texto destacado</Text>

// Fundos
<Box bg="var(--mantine-color-gray-0)">Fundo claro</Box>
<Box bg="var(--mantine-color-gray-1)">Fundo alternativo</Box>

// Estados
<Alert color="red">Erro</Alert>
<Alert color="green">Sucesso</Alert>
<Alert color="yellow">Aviso</Alert>
```

## 🔧 Toggle de Dark Mode

### Implementação Padrão
```tsx
// Componente de toggle reutilizável
const ThemeToggle = () => {
  const { colorScheme, toggleColorScheme } = useTheme();
  
  return (
    <Button
      variant="subtle"
      onClick={toggleColorScheme}
      leftSection={
        colorScheme === 'dark' ? 
        <IconSun size={16} /> : 
        <IconMoon size={16} />
      }
    >
      {colorScheme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
    </Button>
  );
};
```

## 📱 Responsividade

### Breakpoints Mantine
```tsx
// Grid responsivo
<Grid>
  <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
    <Card>Conteúdo</Card>
  </Grid.Col>
</Grid>

// Stack com gaps responsivos
<Stack gap={{ base: 'sm', md: 'lg' }}>
  <Title order={{ base: 3, md: 2 }}>Título</Title>
</Stack>
```

## 🧪 Testes de Dark Mode

### Checklist de Verificação
- [ ] Todos os textos são legíveis em ambos os modos
- [ ] Contrastes atendem aos padrões de acessibilidade
- [ ] Ícones e imagens se adaptam corretamente
- [ ] Formulários funcionam em ambos os modos
- [ ] Navegação permanece consistente
- [ ] Estados de hover/focus são visíveis

### Ferramentas de Teste
1. **DevTools**: Simular preferência do sistema
2. **Lighthouse**: Verificar acessibilidade
3. **Contrast Checker**: Validar contrastes

## 📋 Padrões para Novas Páginas

### Template Base
```tsx
import { Container, Title, Text, Stack } from '@mantine/core';

const NovaPagina = () => {
  return (
    <Container size="xl">
      <Stack gap="lg">
        <Title order={2}>Título da Página</Title>
        <Text c="dimmed">Descrição da página</Text>
        
        {/* Conteúdo da página */}
      </Stack>
    </Container>
  );
};

export default NovaPagina;
```

### Componentes Comuns
```tsx
// Card padrão
<Card shadow="sm" padding="lg" radius="md" withBorder>
  <Stack gap="md">
    <Title order={4}>Título do Card</Title>
    <Text c="dimmed">Conteúdo</Text>
  </Stack>
</Card>

// Paper para formulários
<Paper withBorder shadow="md" p={30} radius="md">
  <form>
    {/* Campos do formulário */}
  </form>
</Paper>
```

## 🚀 Melhorias Implementadas

### ✅ Correções Realizadas
1. **Estrutura do Tema**:
   - Removido MantineProvider duplicado do `main.tsx`
   - Movido Notifications para dentro do MantineProvider no `App.tsx`
   - Corrigido fluxo de tema entre ThemeContext e MantineProvider

2. **Páginas Corrigidas**:
   - `LandingPage.tsx`: Removidas cores hardcoded
   - `LoginPage.tsx`: Removidas cores hardcoded
   - `RegisterPage.tsx`: Removidas cores hardcoded
   - `RegisterSchoolPage.tsx`: Removidas cores hardcoded
   - `RegisterAdminPage.tsx`: Removidas cores hardcoded
   - `RegisterConfirmPage.tsx`: Removidas cores hardcoded
   - `Alunos.tsx`: Recriada com padrões corretos

3. **Melhorias de UX**:
   - Toggle de dark mode em todas as páginas públicas
   - Persistência da preferência no localStorage
   - Transições suaves entre modos

### 🎯 Benefícios Alcançados
- **Consistência**: Todas as páginas seguem o mesmo padrão
- **Manutenibilidade**: Código mais limpo e fácil de manter
- **Acessibilidade**: Melhor contraste e legibilidade
- **Performance**: Menos código condicional
- **Escalabilidade**: Fácil adição de novas páginas

## 📚 Recursos Adicionais

- [Documentação Mantine - Dark Theme](https://mantine.dev/theming/dark-theme/)
- [Guia de Acessibilidade - Contraste](https://webaim.org/articles/contrast/)
- [CSS Variables - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)

---

**Última atualização**: Dezembro 2024  
**Versão**: 1.0  
**Responsável**: Equipe de Desenvolvimento ABC Escolar