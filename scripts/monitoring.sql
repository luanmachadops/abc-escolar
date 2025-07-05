-- =============================================
-- SCRIPTS DE MONITORAMENTO - ABC ESCOLAR
-- Versão: 5.1
-- =============================================

-- 1. VERIFICAR SAÚDE DO SISTEMA
-- =============================================

-- Contagem de registros por tabela
SELECT 
  'escolas' as tabela, COUNT(*) as total, COUNT(*) FILTER (WHERE ativo = true) as ativos
FROM escolas
UNION ALL
SELECT 
  'usuarios' as tabela, COUNT(*) as total, COUNT(*) FILTER (WHERE ativo = true) as ativos
FROM usuarios
UNION ALL
SELECT 
  'cursos' as tabela, COUNT(*) as total, COUNT(*) FILTER (WHERE ativo = true) as ativos
FROM cursos
UNION ALL
SELECT 
  'turmas' as tabela, COUNT(*) as total, COUNT(*) FILTER (WHERE ativo = true) as ativos
FROM turmas
UNION ALL
SELECT 
  'disciplinas' as tabela, COUNT(*) as total, COUNT(*) FILTER (WHERE ativo = true) as ativos
FROM disciplinas;

-- 2. AUDITORIA E SEGURANÇA
-- =============================================

-- Atividade recente por usuário (últimos 7 dias)
SELECT 
  u.nome,
  u.funcao,
  COUNT(*) as total_acoes,
  COUNT(*) FILTER (WHERE a.action = 'INSERT') as insercoes,
  COUNT(*) FILTER (WHERE a.action = 'UPDATE') as atualizacoes,
  COUNT(*) FILTER (WHERE a.action = 'DELETE') as exclusoes,
  MAX(a.created_at) as ultima_atividade
FROM audit_log a
JOIN usuarios u ON a.user_id = u.id
WHERE a.created_at >= NOW() - INTERVAL '7 days'
GROUP BY u.id, u.nome, u.funcao
ORDER BY total_acoes DESC;

-- Operações suspeitas (muitas exclusões)
SELECT 
  u.nome,
  a.table_name,
  COUNT(*) as total_exclusoes,
  MAX(a.created_at) as ultima_exclusao
FROM audit_log a
JOIN usuarios u ON a.user_id = u.id
WHERE a.action = 'DELETE'
  AND a.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY u.id, u.nome, a.table_name
HAVING COUNT(*) > 5
ORDER BY total_exclusoes DESC;

-- 3. PERFORMANCE E ÍNDICES
-- =============================================

-- Verificar uso dos índices
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as uso_indice,
  idx_tup_read as tuplas_lidas,
  idx_tup_fetch as tuplas_buscadas
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Tabelas com mais atividade
SELECT 
  schemaname,
  relname as tabela,
  seq_scan as varreduras_sequenciais,
  seq_tup_read as tuplas_lidas_seq,
  idx_scan as varreduras_indice,
  idx_tup_fetch as tuplas_buscadas_idx,
  n_tup_ins as insercoes,
  n_tup_upd as atualizacoes,
  n_tup_del as exclusoes
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY (n_tup_ins + n_tup_upd + n_tup_del) DESC;

-- 4. DADOS FINANCEIROS
-- =============================================

-- Resumo financeiro por escola
SELECT 
  e.nome as escola,
  COUNT(*) as total_registros,
  COUNT(*) FILTER (WHERE f.status = 'pendente') as pendentes,
  COUNT(*) FILTER (WHERE f.status = 'pago') as pagos,
  COUNT(*) FILTER (WHERE f.status = 'vencido') as vencidos,
  SUM(f.valor) FILTER (WHERE f.status = 'pendente') as valor_pendente,
  SUM(f.valor) FILTER (WHERE f.status = 'pago') as valor_pago
FROM financeiro f
JOIN escolas e ON f.escola_id = e.id
WHERE f.created_at >= NOW() - INTERVAL '30 days'
GROUP BY e.id, e.nome
ORDER BY valor_pendente DESC NULLS LAST;

-- Vencimentos próximos (próximos 7 dias)
SELECT 
  e.nome as escola,
  f.descricao,
  f.valor,
  f.data_vencimento,
  (f.data_vencimento - CURRENT_DATE) as dias_para_vencimento
FROM financeiro f
JOIN escolas e ON f.escola_id = e.id
WHERE f.status = 'pendente'
  AND f.data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
ORDER BY f.data_vencimento;

-- 5. COMUNICAÇÕES
-- =============================================

-- Estatísticas de comunicação por escola
SELECT 
  e.nome as escola,
  c.tipo,
  COUNT(*) as total_enviadas,
  COUNT(*) FILTER (WHERE c.data_envio >= CURRENT_DATE - INTERVAL '7 days') as ultimos_7_dias,
  MAX(c.data_envio) as ultimo_envio
FROM comunicacoes c
JOIN escolas e ON c.escola_id = e.id
GROUP BY e.id, e.nome, c.tipo
ORDER BY e.nome, total_enviadas DESC;

-- 6. USUÁRIOS E ACESSOS
-- =============================================

-- Usuários por função e escola
SELECT 
  e.nome as escola,
  u.funcao,
  COUNT(*) as total_usuarios,
  COUNT(*) FILTER (WHERE u.ativo = true) as usuarios_ativos,
  COUNT(*) FILTER (WHERE u.last_sign_in_at >= NOW() - INTERVAL '30 days') as ativos_30_dias
FROM usuarios u
JOIN escolas e ON u.escola_id = e.id
GROUP BY e.id, e.nome, u.funcao
ORDER BY e.nome, u.funcao;

-- Usuários inativos há mais de 90 dias
SELECT 
  u.nome,
  u.email,
  u.funcao,
  e.nome as escola,
  u.last_sign_in_at,
  (NOW() - u.last_sign_in_at) as tempo_inativo
FROM usuarios u
JOIN escolas e ON u.escola_id = e.id
WHERE u.ativo = true
  AND (u.last_sign_in_at IS NULL OR u.last_sign_in_at < NOW() - INTERVAL '90 days')
ORDER BY u.last_sign_in_at NULLS FIRST;

-- 7. LIMPEZA E MANUTENÇÃO
-- =============================================

-- Tamanho das tabelas
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as tamanho_total,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as tamanho_dados,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as tamanho_indices
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Logs de auditoria antigos (candidatos à limpeza)
SELECT 
  DATE_TRUNC('month', created_at) as mes,
  COUNT(*) as total_logs,
  pg_size_pretty(SUM(LENGTH(old_values::text) + LENGTH(new_values::text))) as tamanho_estimado
FROM audit_log
WHERE created_at < NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY mes;

-- =============================================
-- COMANDOS DE MANUTENÇÃO
-- =============================================

-- Para executar limpeza de logs antigos:
-- SELECT cleanup_old_audit_logs();

-- Para atualizar estatísticas das tabelas:
-- ANALYZE;

-- Para reindexar tabelas (se necessário):
-- REINDEX TABLE audit_log;
-- REINDEX TABLE financeiro;
-- REINDEX TABLE comunicacoes;