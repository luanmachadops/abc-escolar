<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestão de Usuários - App Escolar</title>
    
    <script src="https://cdn.tailwindcss.com"></script>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <script src="https://unpkg.com/lucide@latest"></script>
    
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #f8fafc; /* slate-50 */
        }
        .modal-backdrop {
            background-color: rgba(0,0,0,0.6);
        }
        #toast-notification {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translate(-50%, 100px);
            background-color: #22c55e;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 100;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        #toast-notification.show {
            opacity: 1;
            visibility: visible;
            transform: translate(-50%, 0);
        }
    </style>
</head>
<body class="bg-slate-50">

    <div class="flex h-screen">
        <aside class="w-64 bg-slate-900 text-white flex flex-col">
            <div class="p-6 text-2xl font-bold">
                Gestor<span class="text-blue-500">.AI</span>
            </div>
            <nav class="flex-1 px-4 space-y-2">
                <a href="#" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white">
                    <i data-lucide="layout-dashboard" class="w-5 h-5"></i>
                    <span>Dashboard</span>
                </a>
                <a href="#" class="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-blue-600 text-white">
                    <i data-lucide="users" class="w-5 h-5"></i>
                    <span>Usuários</span>
                </a>
                <a href="#" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white">
                    <i data-lucide="school" class="w-5 h-5"></i>
                    <span>Turmas</span>
                </a>
                <a href="#" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white">
                    <i data-lucide="dollar-sign" class="w-5 h-5"></i>
                    <span>Financeiro</span>
                </a>
                <a href="#" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white">
                    <i data-lucide="file-text" class="w-5 h-5"></i>
                    <span>Relatórios</span>
                </a>
            </nav>
        </aside>

        <main class="flex-1 p-8 overflow-y-auto">
            <div class="max-w-7xl mx-auto">
                <header class="flex justify-between items-center mb-8">
                    <h1 class="text-4xl font-bold text-slate-800">Usuários</h1>
                    <div class="flex items-center gap-4">
                        <div class="relative">
                            <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"></i>
                            <input type="text" id="search-input" placeholder="Pesquisar..." class="w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                        </div>
                        <button class="text-slate-500 hover:text-slate-800">
                             <i data-lucide="bell" class="w-6 h-6"></i>
                        </button>
                    </div>
                </header>

                <div class="bg-white p-6 rounded-xl shadow-sm">
                    <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                         <div class="flex gap-2">
                             <select id="filter-role" class="border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                 <option value="">Todas as Funções</option>
                                 <option value="Aluno">Aluno</option>
                                 <option value="Professor">Professor</option>
                                 <option value="Admin">Admin</option>
                                 <option value="Secretaria">Secretaria</option>
                             </select>
                             <select id="filter-status" class="border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                 <option value="">Todos os Status</option>
                                 <option value="Ativo">Ativo</option>
                                 <option value="Inativo">Inativo</option>
                             </select>
                         </div>
                        <button id="add-user-btn" class="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 w-full md:w-auto">
                            <i data-lucide="plus" class="w-5 h-5"></i>
                            Adicionar Usuário
                        </button>
                    </div>

                    <div class="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-semibold text-slate-500 border-b">
                        <div class="col-span-3">Nome</div>
                        <div class="col-span-4">Email / Usuário</div>
                        <div class="col-span-2">Função</div>
                        <div class="col-span-1">Status</div>
                        <div class="col-span-2 text-right">Ações</div>
                    </div>

                    <div id="user-list-body" class="space-y-2 mt-2">
                        </div>
                </div>
            </div>
        </main>
    </div>

    <div id="user-modal" class="fixed inset-0 modal-backdrop z-50 flex justify-center items-center p-4 hidden">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <form id="user-form">
                <input type="hidden" id="user-id">
                <div class="p-6 border-b">
                    <h2 id="modal-title" class="text-2xl font-bold text-slate-800">Adicionar Novo Usuário</h2>
                </div>
                <div class="p-6 space-y-5">
                    <div id="access-type-container">
                        <label class="block text-sm font-medium text-slate-600 mb-2">Como deseja criar o acesso?</label>
                        <div class="grid grid-cols-2 gap-4">
                            <button type="button" id="access-type-email" class="access-type-btn ring-2 ring-blue-600 text-left p-4 border rounded-lg">
                                <h3 class="font-semibold text-slate-800">Usar E-mail</h3>
                                <p class="text-sm text-slate-500">Vincular perfil com e-mail real.</p>
                            </button>
                             <button type="button" id="access-type-auto" class="access-type-btn text-left p-4 border rounded-lg">
                                <h3 class="font-semibold text-slate-800">Acesso Simplificado</h3>
                                <p class="text-sm text-slate-500">Gerar usuário e senha (para alunos sem e-mail).</p>
                            </button>
                        </div>
                    </div>
                    
                    <div>
                        <label for="user-name" class="block text-sm font-medium text-slate-600 mb-1">Nome Completo</label>
                        <input type="text" id="user-name" class="w-full border border-slate-300 rounded-lg px-3 py-2" required>
                    </div>

                    <div id="email-field-container">
                        <label for="user-email" class="block text-sm font-medium text-slate-600 mb-1">E-mail</label>
                        <input type="email" id="user-email" class="w-full border border-slate-300 rounded-lg px-3 py-2" required>
                    </div>

                    <div id="username-field-container" class="hidden">
                         <label for="user-username" class="block text-sm font-medium text-slate-600 mb-1">Nome de Usuário Gerado</label>
                         <input type="text" id="user-username" readonly class="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="user-role" class="block text-sm font-medium text-slate-600 mb-1">Função</label>
                             <select id="user-role" class="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white" required>
                                 <option value="Aluno">Aluno</option>
                                 <option value="Professor">Professor</option>
                                 <option value="Secretaria">Secretaria</option>
                                 <option value="Admin">Admin</option>
                             </select>
                        </div>
                         <div>
                            <label for="user-status" class="block text-sm font-medium text-slate-600 mb-1">Status</option>
                             <select id="user-status" class="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white" required>
                                 <option value="Ativo">Ativo</option>
                                 <option value="Inativo">Inativo</option>
                             </select>
                        </div>
                    </div>

                    <div id="password-container" class="hidden">
                        <label for="user-password" class="block text-sm font-medium text-slate-600 mb-1">Senha Provisória</label>
                        <div class="relative flex items-center">
                            <input type="text" id="user-password" class="w-full border border-slate-300 rounded-lg px-3 py-2 pr-28">
                             <button type="button" id="generate-password-btn" class="absolute right-1 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-1.5 px-2 rounded">Gerar Aleatória</button>
                        </div>
                    </div>

                    <div id="reset-password-container" class="hidden">
                        <button type="button" id="reset-password-btn" class="text-sm font-semibold text-blue-600 hover:text-blue-800">Redefinir Senha</button>
                    </div>

                </div>
                <div class="p-6 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
                    <button type="button" id="cancel-btn" class="bg-white border border-slate-300 text-slate-800 px-5 py-2.5 rounded-lg font-semibold hover:bg-slate-100">Cancelar</button>
                    <button type="submit" class="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700">Salvar</button>
                </div>
            </form>
        </div>
    </div>
    
    <div id="toast-notification"></div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // --- DADOS SIMULADOS & ESTADO ---
            let users = [
                { id: 1, name: 'Ana Silva', email: 'ana.silva@example.com', username: null, role: 'Aluno', status: 'Ativo' },
                { id: 2, name: 'Carlos Oliveira', email: 'carlos.o@example.com', username: null, role: 'Professor', status: 'Ativo' },
                { id: 3, name: 'Mariana Costa', email: 'mari.costa@example.com', username: null, role: 'Aluno', status: 'Inativo' },
                { id: 4, name: 'João Pereira', email: 'joao.pereira@example.com', username: null, role: 'Admin', status: 'Ativo' },
                { id: 5, name: 'Beatriz Lima', email: null, username: 'beatriz.lima.2025', role: 'Aluno', status: 'Ativo' },
            ];
            const loggedInUser = { role: 'Admin' }; // Simula o usuário logado como Admin

            // --- ELEMENTOS DO DOM ---
            const userListBody = document.getElementById('user-list-body');
            const searchInput = document.getElementById('search-input');
            const filterRole = document.getElementById('filter-role');
            const filterStatus = document.getElementById('filter-status');
            const userModal = document.getElementById('user-modal');
            const modalTitle = document.getElementById('modal-title');
            const userForm = document.getElementById('user-form');
            const addUserBtn = document.getElementById('add-user-btn');
            const cancelBtn = document.getElementById('cancel-btn');
            
            // --- FUNÇÕES DE RENDERIZAÇÃO E LÓGICA ---
            const showToast = (message) => {
                const toast = document.getElementById('toast-notification');
                toast.textContent = message;
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 3000);
            };

            const renderUserList = () => {
                userListBody.innerHTML = '';
                const searchTerm = searchInput.value.toLowerCase();
                const role = filterRole.value;
                const status = filterStatus.value;
                
                const filteredUsers = users.filter(user => 
                    (user.name.toLowerCase().includes(searchTerm) || (user.email && user.email.toLowerCase().includes(searchTerm))) &&
                    (role === '' || user.role === role) &&
                    (status === '' || user.status === status)
                );

                if (filteredUsers.length === 0) {
                    userListBody.innerHTML = `<div class="text-center py-8 text-slate-500">Nenhum usuário encontrado.</div>`;
                    return;
                }

                filteredUsers.forEach(user => {
                    const userRow = document.createElement('div');
                    userRow.className = 'grid grid-cols-12 gap-4 px-4 py-3 items-center border-b last:border-b-0 hover:bg-slate-50';
                    const statusColor = user.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
                    
                    userRow.innerHTML = `
                        <div class="col-span-3 font-medium text-slate-800">${user.name}</div>
                        <div class="col-span-4 text-slate-600">${user.email || user.username}</div>
                        <div class="col-span-2 text-slate-600">${user.role}</div>
                        <div class="col-span-1"><span class="px-2 py-0.5 text-xs font-semibold rounded-full ${statusColor}">${user.status}</span></div>
                        <div class="col-span-2 text-right flex justify-end gap-2">
                            <button class="edit-btn text-slate-500 hover:text-blue-600" data-id="${user.id}"><i data-lucide="edit" class="w-5 h-5"></i></button>
                            <button class="delete-btn text-slate-500 hover:text-red-600" data-id="${user.id}"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
                        </div>
                    `;
                    userListBody.appendChild(userRow);
                });
                lucide.createIcons();
            };

            const openModal = (userId = null) => {
                userForm.reset();
                const userIdInput = document.getElementById('user-id');
                const accessTypeContainer = document.getElementById('access-type-container');
                const passwordContainer = document.getElementById('password-container');
                const resetPasswordContainer = document.getElementById('reset-password-container');
                const userRoleSelect = document.getElementById('user-role');
                
                // Habilita/desabilita o select de função com base no perfil do usuário logado
                if (loggedInUser.role === 'Admin') {
                    userRoleSelect.disabled = false;
                } else {
                    userRoleSelect.disabled = true;
                }
                
                if (userId) { // Modo Edição
                    modalTitle.textContent = 'Editar Usuário';
                    const user = users.find(u => u.id === userId);
                    userIdInput.value = user.id;
                    document.getElementById('user-name').value = user.name;
                    document.getElementById('user-email').value = user.email;
                    document.getElementById('user-username').value = user.username;
                    userRoleSelect.value = user.role;
                    document.getElementById('user-status').value = user.status;
                    
                    accessTypeContainer.classList.add('hidden');
                    resetPasswordContainer.classList.remove('hidden');
                    passwordContainer.classList.add('hidden');
                    if (user.email) {
                        document.getElementById('email-field-container').classList.remove('hidden');
                        document.getElementById('username-field-container').classList.add('hidden');
                    } else {
                        document.getElementById('email-field-container').classList.add('hidden');
                        document.getElementById('username-field-container').classList.remove('hidden');
                    }
                } else { // Modo Adição
                    modalTitle.textContent = 'Adicionar Novo Usuário';
                    userIdInput.value = '';
                    accessTypeContainer.classList.remove('hidden');
                    resetPasswordContainer.classList.add('hidden');
                    passwordContainer.classList.remove('hidden');
                    document.getElementById('access-type-email').click(); // Inicia com tipo email
                }
                userModal.classList.remove('hidden');
            };

            const closeModal = () => userModal.classList.add('hidden');

            // --- EVENT LISTENERS ---
            searchInput.addEventListener('input', renderUserList);
            filterRole.addEventListener('change', renderUserList);
            filterStatus.addEventListener('change', renderUserList);
            addUserBtn.addEventListener('click', () => openModal());
            cancelBtn.addEventListener('click', closeModal);

            userListBody.addEventListener('click', (e) => {
                const editBtn = e.target.closest('.edit-btn');
                const deleteBtn = e.target.closest('.delete-btn');
                if (editBtn) {
                    openModal(Number(editBtn.dataset.id));
                }
                if (deleteBtn) {
                    if(confirm('Tem certeza que deseja excluir este usuário?')) {
                        users = users.filter(u => u.id !== Number(deleteBtn.dataset.id));
                        renderUserList();
                        showToast('Usuário excluído.');
                    }
                }
            });
            
            // Lógica do Modal
            document.getElementById('access-type-email').addEventListener('click', function() {
                this.classList.add('ring-2', 'ring-blue-600');
                document.getElementById('access-type-auto').classList.remove('ring-2', 'ring-blue-600');
                document.getElementById('email-field-container').classList.remove('hidden');
                document.getElementById('username-field-container').classList.add('hidden');
                document.getElementById('user-email').required = true;
            });

             document.getElementById('access-type-auto').addEventListener('click', function() {
                this.classList.add('ring-2', 'ring-blue-600');
                document.getElementById('access-type-email').classList.remove('ring-2', 'ring-blue-600');
                document.getElementById('email-field-container').classList.add('hidden');
                document.getElementById('username-field-container').classList.remove('hidden');
                document.getElementById('user-email').required = false;
                const name = document.getElementById('user-name').value.split(' ').join('.').toLowerCase();
                document.getElementById('user-username').value = `${name || 'novo.usuario'}.${new Date().getFullYear()}`;
            });

            document.getElementById('generate-password-btn').addEventListener('click', () => {
                document.getElementById('user-password').value = Math.random().toString(36).slice(-8);
            });
             document.getElementById('reset-password-btn').addEventListener('click', () => {
                 document.getElementById('password-container').classList.toggle('hidden');
             });

            userForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const id = Number(document.getElementById('user-id').value);
                const isAutoAccess = !document.getElementById('email-field-container').classList.contains('hidden');
                const newUser = {
                    id: id || Date.now(), // Novo ID se não existir
                    name: document.getElementById('user-name').value,
                    email: isAutoAccess ? document.getElementById('user-email').value : null,
                    username: !isAutoAccess ? document.getElementById('user-username').value : null,
                    role: document.getElementById('user-role').value,
                    status: document.getElementById('user-status').value,
                };

                if (id) { // Editando
                    users = users.map(u => u.id === id ? newUser : u);
                    showToast('Usuário atualizado com sucesso!');
                } else { // Adicionando
                    users.push(newUser);
                    showToast('Usuário adicionado com sucesso!');
                }
                renderUserList();
                closeModal();
            });

            // --- INICIALIZAÇÃO ---
            renderUserList();
            lucide.createIcons();
        });
    </script>
</body>
</html>
```

### Como essa solução funciona e se integra ao Supabase:

* **Página e Componentes:** O código cria uma página visualmente completa e funcional. Toda a lógica está contida neste arquivo para facilitar o teste e a integração.
* **Simulação de Dados:** No topo do `<script>`, há um array `users` que simula os dados do seu banco. Para integrar, você substituirá o conteúdo deste array por uma chamada à sua API do Supabase (ex: `supabase.from('users').select('*')`).
* **Segurança de Edição de Função (Role):** A linha `loggedInUser = { role: 'Admin' }` simula o usuário atualmente logado. O código já verifica se `loggedInUser.role === 'Admin'` para habilitar a edição do campo "Função". No seu aplicativo real, você obterá essa informação do `supabase.auth.user()`.
* **Ações e RLS:**
    * **Adicionar/Editar:** O formulário do modal captura todos os dados. Ao salvar, você fará uma chamada `supabase.from('users').upsert(newUser)` para criar ou atualizar o usuário no banco.
    * **Excluir:** O botão de exclusão chamará `supabase.from('users').delete().match({ id: userId })`.
    * Suas regras de RLS no Supabase garantirão que apenas um administrador possa executar essas ações com sucesso, adicionando uma camada extra de segurança no backend.

Essa implementação lhe dá uma base extremamente sólida e moderna. Você pode adaptar e expandir a partir daqui, sabendo que a estrutura principal já contempla os casos de uso complexos da sua aplicaç