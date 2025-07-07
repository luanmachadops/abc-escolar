-- Script de Verificação das Políticas RLS
-- Este script verifica se as políticas RLS estão funcionando corretamente

-- 1. Verificar se RLS está habilitado em todas as tabelas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('escolas', 'usuarios', 'cursos', 'turmas', 'disciplinas', 
                  'professor_disciplinas', 'aluno_turmas', 'comunicacoes', 
                  'financeiro', 'conversas', 'conversa_participantes', 
                  'mensagens', 'mensagem_leituras')
ORDER BY tablename;

-- 2. Listar todas as políticas RLS ativas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Verificar funções auxiliares existem
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname IN ('get_user_id', 'get_user_escola_id', 'is_admin_or_secretary', 'get_user_role')
ORDER BY proname;

-- 4. Verificar dados de teste inseridos
SELECT 'escolas' as tabela, count(*) as registros FROM escolas
UNION ALL
SELECT 'usuarios' as tabela, count(*) as registros FROM usuarios
UNION ALL
SELECT 'cursos' as tabela, count(*) as registros FROM cursos
UNION ALL
SELECT 'turmas' as tabela, count(*) as registros FROM turmas
UNION ALL
SELECT 'disciplinas' as tabela, count(*) as registros FROM disciplinas
UNION ALL
SELECT 'professor_disciplinas' as tabela, count(*) as registros FROM professor_disciplinas
UNION ALL
SELECT 'aluno_turmas' as tabela, count(*) as registros FROM aluno_turmas
UNION ALL
SELECT 'comunicacoes' as tabela, count(*) as registros FROM comunicacoes
UNION ALL
SELECT 'financeiro' as tabela, count(*) as registros FROM financeiro
ORDER BY tabela;

-- 5. Verificar estrutura das tabelas principais
\d+ escolas
\d+ usuarios
\d+ conversas
\d+ mensagens

-- 6. Testar algumas consultas básicas (sem autenticação)
SELECT 'Teste de leitura escolas' as teste, count(*) as resultado FROM escolas;
SELECT 'Teste de leitura usuarios' as teste, count(*) as resultado FROM usuarios;

-- 7. Verificar índices criados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('escolas', 'usuarios', 'comunicacoes', 'financeiro', 'conversas', 'mensagens')
ORDER BY tablename, indexname;

-- 8. Verificar triggers de auditoria
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND event_object_table IN ('usuarios', 'escolas', 'financeiro')
ORDER BY event_object_table, trigger_name;

-- 9. Verificar tabela de auditoria
SELECT 'audit_log' as tabela, count(*) as registros FROM audit_log;

-- 10. Resumo do Status do Sistema
SELECT 
    'Sistema ABC Escolar - Status das Políticas RLS' as status_report,
    NOW() as data_verificacao;