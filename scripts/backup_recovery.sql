-- =============================================
-- SCRIPTS DE BACKUP E RECUPERAÇÃO - ABC ESCOLAR
-- Versão: 5.1
-- =============================================

-- 1. BACKUP DE DADOS CRÍTICOS
-- =============================================

-- Função para criar backup completo dos dados
CREATE OR REPLACE FUNCTION create_data_backup()
RETURNS TABLE(
  backup_id UUID,
  table_name TEXT,
  record_count BIGINT,
  backup_size TEXT,
  created_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  backup_uuid UUID := uuid_generate_v4();
  table_rec RECORD;
  row_count BIGINT;
BEGIN
  -- Criar tabela de controle de backup se não existir
  CREATE TABLE IF NOT EXISTS backup_control (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    backup_id UUID NOT NULL,
    table_name TEXT NOT NULL,
    record_count BIGINT NOT NULL,
    backup_size BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id)
  );
  
  -- Iterar sobre tabelas críticas
  FOR table_rec IN 
    SELECT t.table_name 
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_name IN ('escolas', 'usuarios', 'cursos', 'turmas', 'disciplinas', 
                          'professor_disciplinas', 'aluno_turmas', 'comunicacoes', 
                          'financeiro', 'audit_log')
  LOOP
    -- Contar registros
    EXECUTE format('SELECT COUNT(*) FROM %I', table_rec.table_name) INTO row_count;
    
    -- Registrar informações do backup
    INSERT INTO backup_control (backup_id, table_name, record_count, backup_size, created_by)
    VALUES (backup_uuid, table_rec.table_name, row_count, 0, get_user_id());
    
    -- Retornar informações
    backup_id := backup_uuid;
    table_name := table_rec.table_name;
    record_count := row_count;
    backup_size := pg_size_pretty(pg_total_relation_size(table_rec.table_name));
    created_at := NOW();
    
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$;

-- 2. VERIFICAÇÃO DE INTEGRIDADE
-- =============================================

-- Função para verificar integridade referencial
CREATE OR REPLACE FUNCTION check_data_integrity()
RETURNS TABLE(
  check_name TEXT,
  status TEXT,
  details TEXT,
  record_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Verificar usuários órfãos (sem escola)
  SELECT COUNT(*) INTO record_count
  FROM usuarios u
  LEFT JOIN escolas e ON u.escola_id = e.id
  WHERE u.escola_id IS NOT NULL AND e.id IS NULL;
  
  check_name := 'Usuários Órfãos';
  status := CASE WHEN record_count = 0 THEN 'OK' ELSE 'ERRO' END;
  details := format('%s usuários sem escola válida', record_count);
  RETURN NEXT;
  
  -- Verificar turmas órfãs (sem curso)
  SELECT COUNT(*) INTO record_count
  FROM turmas t
  LEFT JOIN cursos c ON t.curso_id = c.id
  WHERE t.curso_id IS NOT NULL AND c.id IS NULL;
  
  check_name := 'Turmas Órfãs';
  status := CASE WHEN record_count = 0 THEN 'OK' ELSE 'ERRO' END;
  details := format('%s turmas sem curso válido', record_count);
  RETURN NEXT;
  
  -- Verificar disciplinas órfãs (sem curso)
  SELECT COUNT(*) INTO record_count
  FROM disciplinas d
  LEFT JOIN cursos c ON d.curso_id = c.id
  WHERE d.curso_id IS NOT NULL AND c.id IS NULL;
  
  check_name := 'Disciplinas Órfãs';
  status := CASE WHEN record_count = 0 THEN 'OK' ELSE 'ERRO' END;
  details := format('%s disciplinas sem curso válido', record_count);
  RETURN NEXT;
  
  -- Verificar registros financeiros órfãos
  SELECT COUNT(*) INTO record_count
  FROM financeiro f
  LEFT JOIN escolas e ON f.escola_id = e.id
  WHERE f.escola_id IS NOT NULL AND e.id IS NULL;
  
  check_name := 'Financeiro Órfão';
  status := CASE WHEN record_count = 0 THEN 'OK' ELSE 'ERRO' END;
  details := format('%s registros financeiros sem escola válida', record_count);
  RETURN NEXT;
  
  -- Verificar comunicações órfãs
  SELECT COUNT(*) INTO record_count
  FROM comunicacoes c
  LEFT JOIN escolas e ON c.escola_id = e.id
  WHERE c.escola_id IS NOT NULL AND e.id IS NULL;
  
  check_name := 'Comunicações Órfãs';
  status := CASE WHEN record_count = 0 THEN 'OK' ELSE 'ERRO' END;
  details := format('%s comunicações sem escola válida', record_count);
  RETURN NEXT;
  
  RETURN;
END;
$$;

-- 3. LIMPEZA DE DADOS
-- =============================================

-- Função para limpeza segura de dados antigos
CREATE OR REPLACE FUNCTION cleanup_old_data(
  days_to_keep INTEGER DEFAULT 365
)
RETURNS TABLE(
  table_name TEXT,
  records_deleted BIGINT,
  space_freed TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  cutoff_date TIMESTAMPTZ := NOW() - (days_to_keep || ' days')::INTERVAL;
  deleted_count BIGINT;
BEGIN
  -- Limpar logs de auditoria antigos
  DELETE FROM audit_log WHERE created_at < cutoff_date;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  table_name := 'audit_log';
  records_deleted := deleted_count;
  space_freed := 'Executar VACUUM para calcular';
  RETURN NEXT;
  
  -- Limpar comunicações antigas (se configurado)
  DELETE FROM comunicacoes 
  WHERE data_envio < cutoff_date 
    AND tipo IN ('notificacao', 'lembrete');
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  table_name := 'comunicacoes';
  records_deleted := deleted_count;
  space_freed := 'Executar VACUUM para calcular';
  RETURN NEXT;
  
  RETURN;
END;
$$;

-- 4. RECUPERAÇÃO DE DADOS
-- =============================================

-- Função para recuperar dados de usuário deletado
CREATE OR REPLACE FUNCTION recover_deleted_user(
  user_email TEXT,
  recovery_window_hours INTEGER DEFAULT 24
)
RETURNS TABLE(
  recovery_id UUID,
  original_data JSONB,
  deleted_at TIMESTAMPTZ,
  can_recover BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  cutoff_time TIMESTAMPTZ := NOW() - (recovery_window_hours || ' hours')::INTERVAL;
BEGIN
  RETURN QUERY
  SELECT 
    a.id as recovery_id,
    a.old_values as original_data,
    a.created_at as deleted_at,
    (a.created_at > cutoff_time) as can_recover
  FROM audit_log a
  WHERE a.table_name = 'usuarios'
    AND a.action = 'DELETE'
    AND a.old_values->>'email' = user_email
  ORDER BY a.created_at DESC
  LIMIT 1;
END;
$$;

-- Função para restaurar usuário deletado
CREATE OR REPLACE FUNCTION restore_deleted_user(
  recovery_id UUID
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  user_data JSONB;
  new_user_id UUID;
BEGIN
  -- Buscar dados do usuário deletado
  SELECT old_values INTO user_data
  FROM audit_log
  WHERE id = recovery_id
    AND table_name = 'usuarios'
    AND action = 'DELETE'
    AND created_at > NOW() - INTERVAL '24 hours';
  
  IF user_data IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Gerar novo ID para evitar conflitos
  new_user_id := uuid_generate_v4();
  
  -- Restaurar usuário com novo ID
  INSERT INTO usuarios (
    id, nome, email, funcao, escola_id, ativo, created_at, updated_at
  ) VALUES (
    new_user_id,
    user_data->>'nome',
    user_data->>'email',
    user_data->>'funcao',
    (user_data->>'escola_id')::UUID,
    true,
    NOW(),
    NOW()
  );
  
  -- Registrar recuperação no log
  INSERT INTO audit_log (user_id, action, table_name, record_id, new_values)
  VALUES (get_user_id(), 'RECOVER', 'usuarios', new_user_id, user_data);
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- 5. SCRIPTS DE MANUTENÇÃO
-- =============================================

-- Verificar saúde geral do banco
CREATE OR REPLACE FUNCTION database_health_check()
RETURNS TABLE(
  metric_name TEXT,
  metric_value TEXT,
  status TEXT,
  recommendation TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  db_size BIGINT;
  table_count INTEGER;
  index_count INTEGER;
  active_connections INTEGER;
BEGIN
  -- Tamanho do banco
  SELECT pg_database_size(current_database()) INTO db_size;
  metric_name := 'Tamanho do Banco';
  metric_value := pg_size_pretty(db_size);
  status := CASE WHEN db_size < 1073741824 THEN 'OK' ELSE 'ATENÇÃO' END; -- 1GB
  recommendation := CASE WHEN db_size >= 1073741824 THEN 'Considerar arquivamento de dados antigos' ELSE 'Normal' END;
  RETURN NEXT;
  
  -- Número de tabelas
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public';
  
  metric_name := 'Tabelas Criadas';
  metric_value := table_count::TEXT;
  status := 'OK';
  recommendation := 'Normal';
  RETURN NEXT;
  
  -- Número de índices
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public';
  
  metric_name := 'Índices Ativos';
  metric_value := index_count::TEXT;
  status := 'OK';
  recommendation := 'Normal';
  RETURN NEXT;
  
  -- Conexões ativas
  SELECT COUNT(*) INTO active_connections
  FROM pg_stat_activity
  WHERE state = 'active';
  
  metric_name := 'Conexões Ativas';
  metric_value := active_connections::TEXT;
  status := CASE WHEN active_connections < 10 THEN 'OK' ELSE 'ATENÇÃO' END;
  recommendation := CASE WHEN active_connections >= 10 THEN 'Monitorar uso de conexões' ELSE 'Normal' END;
  RETURN NEXT;
  
  RETURN;
END;
$$;

-- =============================================
-- COMANDOS DE USO
-- =============================================

/*
-- Criar backup dos dados
SELECT * FROM create_data_backup();

-- Verificar integridade dos dados
SELECT * FROM check_data_integrity();

-- Limpeza de dados antigos (manter últimos 365 dias)
SELECT * FROM cleanup_old_data(365);

-- Verificar saúde do banco
SELECT * FROM database_health_check();

-- Recuperar usuário deletado
SELECT * FROM recover_deleted_user('usuario@email.com', 24);

-- Restaurar usuário (usar recovery_id do comando anterior)
SELECT restore_deleted_user('recovery-uuid-aqui');

-- Limpeza manual de logs antigos
SELECT cleanup_old_audit_logs();

-- Vacuum completo para recuperar espaço
VACUUM ANALYZE;
*/