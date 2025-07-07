import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Button,
  TextInput,
  Select,
  Modal,
  Group,
  Stack,
  Grid,
  Card,
  Badge,
  ActionIcon,
  Notification,
  Loader,
  Table,
  Paper,
  Flex,
  Box,
  Switch,
  PasswordInput,
  Divider
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconUsers,
  IconCheck,
  IconX,
  IconEye,
  IconEyeOff,
  IconRefresh,
  IconShare,
  IconMail,
  IconBrandWhatsapp,
  IconCopy,
  IconDice
} from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, UserRole } from '../lib/supabase';
import { notifications } from '@mantine/notifications';
import { useUserAccess, CreateUserAccessParams } from '../hooks/useUserAccess';

interface Usuario {
  id: string;
  nome_completo: string;
  email: string;
  telefone?: string;
  funcao: UserRole;
  ativo: boolean;
  created_at: string;
  auth_user_id?: string;
}

interface FormData {
  nome_completo: string;
  email: string;
  telefone: string;
  funcao: UserRole;
  ativo: boolean;
  senha?: string;
  tipo_acesso: 'email' | 'simplificado';
}

const AcessoUsuarios = () => {
  const { user } = useAuth();
  const { createUserAccess, resetUserPassword, generateSecurePassword } = useUserAccess();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    nome_completo: '',
    email: '',
    telefone: '',
    funcao: 'aluno',
    ativo: true,
    tipo_acesso: 'email'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [shareModalOpened, setShareModalOpened] = useState(false);
  const [accessData, setAccessData] = useState<{email: string, password: string, name: string, ra?: string} | null>(null);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<string>('');

  // Verificar se o usuário tem permissão para gerenciar usuários
  const canManageUsers = user?.user_metadata?.funcao === 'admin' || user?.user_metadata?.funcao === 'secretario';

  // Carregar usuários
  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('nome_completo');

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      notifications.show({
        title: 'Erro',
        message: 'Erro ao carregar usuários',
        color: 'red',
        icon: <IconX size={16} />
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar turmas
  const loadTurmas = async () => {
    try {
      const { data, error } = await supabase
        .from('turmas')
        .select(`
          *,
          cursos(
            nome
          )
        `)
        .order('nome');

      if (error) throw error;
      setTurmas(data || []);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    }
  };

  useEffect(() => {
    loadUsuarios();
    loadTurmas();
  }, []);

  // Filtrar usuários
  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = usuario.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === '' || usuario.funcao === filterRole;
    const matchesStatus = filterStatus === '' || 
                         (filterStatus === 'ativo' && usuario.ativo) ||
                         (filterStatus === 'inativo' && !usuario.ativo);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Gerar senha aleatória com padrões de segurança
  const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%&*';
    
    // Garantir pelo menos um caractere de cada tipo
    let password = '';
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    
    // Completar com caracteres aleatórios até 12 caracteres
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = 4; i < 12; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Embaralhar a senha
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setGeneratedPassword(password);
    setFormData(prev => ({ ...prev, senha: password }));
  };

  // Gerar username automático
  const generateUsername = (nome: string) => {
    const username = nome.toLowerCase()
      .replace(/\s+/g, '.')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z.]/g, '');
    return `${username}.${new Date().getFullYear()}`;
  };

  // Abrir modal
  const openModal = (usuario?: Usuario) => {
    if (usuario) {
      setEditingUser(usuario);
      setFormData({
        nome_completo: usuario.nome_completo,
        email: usuario.email,
        telefone: usuario.telefone || '',
        funcao: usuario.funcao,
        ativo: usuario.ativo,
        tipo_acesso: 'email'
      });
    } else {
      setEditingUser(null);
      setFormData({
        nome_completo: '',
        email: '',
        telefone: '',
        funcao: 'aluno',
        ativo: true,
        tipo_acesso: 'email'
      });
      setGeneratedPassword('');
    }
    setModalOpened(true);
  };

  // Fechar modal
  const closeModal = () => {
    setModalOpened(false);
    setEditingUser(null);
    setFormData({
      nome_completo: '',
      email: '',
      telefone: '',
      funcao: 'aluno',
      ativo: true,
      tipo_acesso: 'email'
    });
    setGeneratedPassword('');
    setAccessData(null);
    setSelectedTurma('');
  };

  // Funções de compartilhamento
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    notifications.show({
      title: 'Copiado!',
      message: 'Dados de acesso copiados para a área de transferência',
      color: 'green',
      icon: <IconCheck size={16} />
    });
  };

  const shareViaEmail = (data: {email: string, password: string, name: string, ra?: string}) => {
    const subject = 'Dados de Acesso - Sistema Escolar';
    const raInfo = data.ra ? `\nRA: ${data.ra}` : '';
    const body = `Olá ${data.name},\n\nSeus dados de acesso ao sistema escolar:\n\nE-mail: ${data.email}${raInfo}\nSenha: ${data.password}\n\nPor favor, altere sua senha no primeiro acesso.\n\nAtenciosamente,\nEquipe Administrativa`;
    const mailtoLink = `mailto:${data.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  const shareViaWhatsApp = (data: {email: string, password: string, name: string, ra?: string}) => {
    const raInfo = data.ra ? `\n🎓 RA: ${data.ra}` : '';
    const message = `Olá ${data.name}! Seus dados de acesso ao sistema escolar:\n\n📧 E-mail: ${data.email}${raInfo}\n🔑 Senha: ${data.password}\n\n⚠️ Por favor, altere sua senha no primeiro acesso.`;
    const whatsappLink = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappLink, '_blank');
  };

  const getAccessText = (data: {email: string, password: string, name: string, ra?: string}) => {
    const raInfo = data.ra ? `\nRA: ${data.ra}` : '';
    return `Dados de Acesso - ${data.name}\n\nE-mail: ${data.email}${raInfo}\nSenha: ${data.password}\n\nPor favor, altere sua senha no primeiro acesso.`;
  };

  // Salvar usuário
  const handleSave = async () => {
    try {
      if (!formData.nome_completo || !formData.email) {
        notifications.show({
          title: 'Erro',
          message: 'Nome e email são obrigatórios',
          color: 'red',
          icon: <IconX size={16} />
        });
        return;
      }

      // Validar turma para alunos
      if (!editingUser && formData.funcao === 'aluno' && !selectedTurma) {
        notifications.show({
          title: 'Erro',
          message: 'Turma é obrigatória para alunos',
          color: 'red',
          icon: <IconX size={16} />
        });
        return;
      }

      if (editingUser) {
        // Atualizar usuário existente
        const { error } = await supabase
          .from('usuarios')
          .update({
            nome_completo: formData.nome_completo,
            email: formData.email,
            telefone: formData.telefone,
            funcao: formData.funcao,
            ativo: formData.ativo
          })
          .eq('id', editingUser.id);

        if (error) throw error;

        notifications.show({
          title: 'Sucesso',
          message: 'Usuário atualizado com sucesso',
          color: 'green',
          icon: <IconCheck size={16} />
        });
      } else {
        // Criar novo usuário
        if (formData.funcao === 'aluno' || formData.funcao === 'professor') {
          // Usar o hook useUserAccess para alunos e professores
          const accessParams: CreateUserAccessParams = {
            nome: formData.nome_completo,
            email: formData.tipo_acesso === 'email' ? formData.email : undefined,
            role: formData.funcao,
            escola_id: user?.user_metadata?.escola_id || '',
            telefone: formData.telefone || undefined,
            turma_id: formData.funcao === 'aluno' ? selectedTurma : undefined
          };

          const accessData = await createUserAccess(accessParams);
          
          if (accessData) {
            // Preparar dados para compartilhamento
            setAccessData({
              email: accessData.email || accessData.ficticiousEmail || '',
              password: accessData.password || '',
              name: formData.nome_completo,
              ra: accessData.ra
            });
          }
        } else {
          // Para admin e secretario, usar o método tradicional
          let authUserId = null;
          
          if (formData.tipo_acesso === 'email' && formData.senha) {
            // Criar usuário usando Admin API para não afetar a sessão atual
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
              email: formData.email,
              password: formData.senha,
              user_metadata: {
                nome_completo: formData.nome_completo,
                funcao: formData.funcao
              },
              email_confirm: true // Confirmar email automaticamente
            });

            if (authError) throw authError;
            authUserId = authData.user?.id;
          }

          // Inserir na tabela usuarios
          const { error } = await supabase
            .from('usuarios')
            .insert({
              auth_user_id: authUserId,
              escola_id: user?.user_metadata?.escola_id,
              nome_completo: formData.nome_completo,
              email: formData.email,
              telefone: formData.telefone,
              funcao: formData.funcao,
              ativo: formData.ativo
            });

          if (error) throw error;

          // Preparar dados para compartilhamento
          if (formData.tipo_acesso === 'email' && formData.senha) {
            setAccessData({
              email: formData.email,
              password: formData.senha,
              name: formData.nome_completo
            });
          }
        }

        notifications.show({
          title: 'Sucesso',
          message: 'Usuário criado com sucesso',
          color: 'green',
          icon: <IconCheck size={16} />
        });
      }

      closeModal();
      loadUsuarios();
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      notifications.show({
        title: 'Erro',
        message: error.message || 'Erro ao salvar usuário',
        color: 'red',
        icon: <IconX size={16} />
      });
    }
  };

  // Excluir usuário
  const handleDelete = async (usuario: Usuario) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${usuario.nome_completo}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', usuario.id);

      if (error) throw error;

      notifications.show({
        title: 'Sucesso',
        message: 'Usuário excluído com sucesso',
        color: 'green',
        icon: <IconCheck size={16} />
      });

      loadUsuarios();
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      notifications.show({
        title: 'Erro',
        message: error.message || 'Erro ao excluir usuário',
        color: 'red',
        icon: <IconX size={16} />
      });
    }
  };

  // Resetar senha
  const handleResetPassword = async (usuario: Usuario) => {
    try {
      const result = await resetUserPassword(usuario.auth_user_id);
      
      if (result.success && result.password) {
        // Preparar dados para compartilhamento
        setAccessData({
          email: usuario.email,
          password: result.password,
          name: usuario.nome_completo,
          ra: usuario.ra
        });
        
        // Abrir modal de compartilhamento
        setShareModalOpened(true);
        
        notifications.show({
          title: 'Sucesso',
          message: 'Senha redefinida com sucesso! Use o modal para compartilhar os dados.',
          color: 'green',
          icon: <IconCheck size={16} />
        });
      }
    } catch (error: any) {
      console.error('Erro ao resetar senha:', error);
      notifications.show({
        title: 'Erro',
        message: error.message || 'Erro ao resetar senha',
        color: 'red',
        icon: <IconX size={16} />
      });
    }
  };

  if (!canManageUsers) {
    return (
      <Container size="xl" mih="100vh">
        <Stack align="center" justify="center" mih="60vh">
          <IconUsers size={64} color="gray" />
          <Title order={2} ta="center">Acesso Negado</Title>
          <Text c="dimmed" ta="center">
            Você não tem permissão para acessar esta página.
            Apenas administradores e secretários podem gerenciar usuários.
          </Text>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl" py="md">
      {/* Header */}
      <Flex justify="space-between" align="center" mb="xl">
        <div>
          <Title order={1} size="h1" mb="xs">Gestão de Usuários</Title>
          <Text c="dimmed">Gerencie usuários da sua instituição</Text>
        </div>
        <Button
          leftSection={<IconRefresh size={16} />}
          variant="light"
          onClick={loadUsuarios}
          loading={loading}
        >
          Atualizar
        </Button>
      </Flex>

      {/* Filtros e Busca */}
      <Paper p="md" mb="xl" withBorder>
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              placeholder="Pesquisar por nome ou email..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 2 }}>
            <Select
              placeholder="Função"
              data={[
                { value: '', label: 'Todas as Funções' },
                { value: 'admin', label: 'Administrador' },
                { value: 'secretario', label: 'Secretário' },
                { value: 'professor', label: 'Professor' },
                { value: 'aluno', label: 'Aluno' }
              ]}
              value={filterRole}
              onChange={(value) => setFilterRole(value || '')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 2 }}>
            <Select
              placeholder="Status"
              data={[
                { value: '', label: 'Todos os Status' },
                { value: 'ativo', label: 'Ativo' },
                { value: 'inativo', label: 'Inativo' }
              ]}
              value={filterStatus}
              onChange={(value) => setFilterStatus(value || '')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 2 }}>
            <Button
              fullWidth
              leftSection={<IconPlus size={16} />}
              onClick={() => openModal()}
            >
              Adicionar Usuário
            </Button>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Lista de Usuários */}
      <Paper withBorder>
        {loading ? (
          <Stack align="center" py="xl">
            <Loader size="lg" />
            <Text>Carregando usuários...</Text>
          </Stack>
        ) : filteredUsuarios.length === 0 ? (
          <Stack align="center" py="xl">
            <IconUsers size={48} color="gray" />
            <Text c="dimmed">Nenhum usuário encontrado</Text>
          </Stack>
        ) : (
          <Table.ScrollContainer minWidth={800}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nome</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Função</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Ações</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredUsuarios.map((usuario) => (
                  <Table.Tr key={usuario.id}>
                    <Table.Td>
                      <div>
                        <Text fw={500}>{usuario.nome_completo}</Text>
                        {usuario.telefone && (
                          <Text size="sm" c="dimmed">{usuario.telefone}</Text>
                        )}
                      </div>
                    </Table.Td>
                    <Table.Td>{usuario.email}</Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          usuario.funcao === 'admin' ? 'red' :
                          usuario.funcao === 'secretario' ? 'orange' :
                          usuario.funcao === 'professor' ? 'blue' : 'green'
                        }
                        variant="light"
                      >
                        {usuario.funcao === 'admin' ? 'Administrador' :
                         usuario.funcao === 'secretario' ? 'Secretário' :
                         usuario.funcao === 'professor' ? 'Professor' : 'Aluno'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={usuario.ativo ? 'green' : 'red'}
                        variant="light"
                      >
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => openModal(usuario)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="orange"
                          onClick={() => handleResetPassword(usuario)}
                        >
                          <IconRefresh size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDelete(usuario)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>

      {/* Modal de Usuário */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={editingUser ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
        size="lg"
      >
        <Stack>
          {!editingUser && (
            <>
              <Text size="sm" fw={500} mb="xs">Como deseja criar o acesso?</Text>
              <Grid>
                <Grid.Col span={6}>
                  <Card
                    p="md"
                    withBorder
                    style={{
                      cursor: 'pointer',
                      borderColor: formData.tipo_acesso === 'email' ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-4)',
                      borderWidth: formData.tipo_acesso === 'email' ? 2 : 1
                    }}
                    onClick={() => setFormData(prev => ({ ...prev, tipo_acesso: 'email' }))}
                  >
                    <Text fw={500} size="sm">Usar E-mail</Text>
                    <Text size="xs" c="dimmed">Vincular perfil com e-mail real</Text>
                  </Card>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Card
                    p="md"
                    withBorder
                    style={{
                      cursor: 'pointer',
                      borderColor: formData.tipo_acesso === 'simplificado' ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-4)',
                      borderWidth: formData.tipo_acesso === 'simplificado' ? 2 : 1
                    }}
                    onClick={() => setFormData(prev => ({ ...prev, tipo_acesso: 'simplificado' }))}
                  >
                    <Text fw={500} size="sm">Acesso Simplificado</Text>
                    <Text size="xs" c="dimmed">Gerar usuário e senha</Text>
                  </Card>
                </Grid.Col>
              </Grid>
              <Divider />
            </>
          )}

          <TextInput
            label="Nome Completo"
            placeholder="Digite o nome completo"
            value={formData.nome_completo}
            onChange={(e) => {
              const nome = e.target.value;
              setFormData(prev => ({ ...prev, nome_completo: nome }));
              
              // Gerar username automaticamente para acesso simplificado
              if (!editingUser && formData.tipo_acesso === 'simplificado' && nome) {
                const username = generateUsername(nome);
                setFormData(prev => ({ ...prev, email: `${username}@escola.local` }));
              }
            }}
            required
          />

          <TextInput
            label="E-mail"
            placeholder="Digite o e-mail"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
            disabled={!editingUser && formData.tipo_acesso === 'simplificado'}
          />

          <TextInput
            label="Telefone"
            placeholder="Digite o telefone"
            value={formData.telefone}
            onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
          />

          <Grid>
            <Grid.Col span={6}>
              <Select
                label="Função"
                data={[
                  { value: 'aluno', label: 'Aluno' },
                  { value: 'professor', label: 'Professor' },
                  { value: 'secretario', label: 'Secretário' },
                  { value: 'admin', label: 'Administrador' }
                ]}
                value={formData.funcao}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, funcao: value as UserRole }));
                  // Limpar turma selecionada quando mudar a função
                  if (value !== 'aluno') {
                    setSelectedTurma('');
                  }
                }}
                required
                disabled={user?.user_metadata?.funcao !== 'admin'}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Box pt="lg">
                <Switch
                  label="Usuário Ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
                />
              </Box>
            </Grid.Col>
          </Grid>

          {/* Campo de Turma - apenas para alunos */}
          {formData.funcao === 'aluno' && !editingUser && (
            <Select
              label="Turma"
              placeholder="Selecione uma turma"
              data={turmas.map(turma => ({
                value: turma.id,
                label: `${turma.nome} - ${turma.cursos?.nome || 'Curso não definido'}`
              }))}
              value={selectedTurma}
              onChange={(value) => setSelectedTurma(value || '')}
              required
              searchable
            />
          )}

          {!editingUser && formData.tipo_acesso === 'email' && (
             <>
               <PasswordInput
                 label="Senha Provisória"
                 placeholder="Digite uma senha"
                 value={formData.senha || ''}
                 onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
                 visible={showPassword}
                 onVisibilityChange={setShowPassword}
                 rightSection={
                   <Group gap="xs">
                     <ActionIcon
                       variant="light"
                       color="blue"
                       onClick={generatePassword}
                       title="Gerar senha segura"
                     >
                       <IconDice size={16} />
                     </ActionIcon>
                   </Group>
                 }
                 required
               />
               
               {formData.senha && (
                 <Paper p="sm" withBorder bg="var(--mantine-color-gray-0)">
                   <Group justify="space-between" align="center">
                     <div>
                       <Text size="sm" fw={500}>Senha gerada:</Text>
                       <Text size="sm" ff="monospace" c="blue">{formData.senha}</Text>
                     </div>
                     <ActionIcon
                       variant="light"
                       color="green"
                       onClick={() => copyToClipboard(formData.senha || '')}
                       title="Copiar senha"
                     >
                       <IconCopy size={16} />
                     </ActionIcon>
                   </Group>
                 </Paper>
               )}
             </>
           )}

          {editingUser && (
            <Button
              variant="light"
              color="orange"
              onClick={() => handleResetPassword(editingUser)}
            >
              Redefinir Acesso
            </Button>
          )}

          <Group justify="space-between" mt="md">
             <div>
               {accessData && (
                 <Button
                   variant="light"
                   color="blue"
                   leftSection={<IconShare size={16} />}
                   onClick={() => setShareModalOpened(true)}
                 >
                   Compartilhar Acesso
                 </Button>
               )}
             </div>
             <Group>
               <Button variant="light" onClick={closeModal}>
                 Cancelar
               </Button>
               <Button onClick={handleSave}>
                 {editingUser ? 'Atualizar' : 'Criar'} Usuário
               </Button>
             </Group>
           </Group>
        </Stack>
      </Modal>

       {/* Modal de Compartilhamento */}
       <Modal
         opened={shareModalOpened}
         onClose={() => setShareModalOpened(false)}
         title="Compartilhar Dados de Acesso"
         size="md"
         centered
       >
         {accessData && (
           <Stack>
             <Paper p="md" withBorder bg="gray.0">
               <Text size="sm" fw={500} mb="xs">Dados de Acesso:</Text>
               <Text size="sm"><strong>Nome:</strong> {accessData.name}</Text>
               <Text size="sm"><strong>E-mail:</strong> {accessData.email}</Text>
               {accessData.ra && (
                 <Text size="sm"><strong>RA:</strong> {accessData.ra}</Text>
               )}
               <Text size="sm"><strong>Senha:</strong> <Text component="span" ff="monospace" c="blue">{accessData.password}</Text></Text>
             </Paper>

             <Text size="sm" c="dimmed" ta="center">
               Escolha como deseja compartilhar os dados de acesso:
             </Text>

             <Grid>
               <Grid.Col span={4}>
                 <Button
                   fullWidth
                   variant="light"
                   color="blue"
                   leftSection={<IconMail size={16} />}
                   onClick={() => shareViaEmail(accessData)}
                 >
                   E-mail
                 </Button>
               </Grid.Col>
               <Grid.Col span={4}>
                 <Button
                   fullWidth
                   variant="light"
                   color="green"
                   leftSection={<IconBrandWhatsapp size={16} />}
                   onClick={() => shareViaWhatsApp(accessData)}
                 >
                   WhatsApp
                 </Button>
               </Grid.Col>
               <Grid.Col span={4}>
                 <Button
                   fullWidth
                   variant="light"
                   color="gray"
                   leftSection={<IconCopy size={16} />}
                   onClick={() => copyToClipboard(getAccessText(accessData))}
                 >
                   Copiar
                 </Button>
               </Grid.Col>
             </Grid>

             <Group justify="flex-end" mt="md">
               <Button variant="light" onClick={() => setShareModalOpened(false)}>
                 Fechar
               </Button>
             </Group>
           </Stack>
         )}
       </Modal>
     </Container>
   );
 };

 export default AcessoUsuarios;