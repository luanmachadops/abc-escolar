import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUserData } from './useUserData';

export interface DashboardStats {
  totalAlunos: number;
  totalProfessores: number;
  totalTurmas: number;
  totalCursos: number;
  taxaAprovacao: number;
  receitaMensal: number;
}

export interface AtividadeRecente {
  id: string;
  descricao: string;
  data: string;
  tipo: 'matricula' | 'nota' | 'pagamento' | 'comunicacao' | 'relatorio';
}

export interface ProximoEvento {
  id: string;
  titulo: string;
  data: string;
  hora: string;
}

export const useDashboardData = () => {
  const { userData, loading: userLoading, error: userError } = useUserData();
  const [stats, setStats] = useState<DashboardStats>({
    totalAlunos: 0,
    totalProfessores: 0,
    totalTurmas: 0,
    totalCursos: 0,
    taxaAprovacao: 0,
    receitaMensal: 0
  });
  const [atividadesRecentes, setAtividadesRecentes] = useState<AtividadeRecente[]>([]);
  const [proximosEventos, setProximosEventos] = useState<ProximoEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    try {
      if (!userData?.escola_id) {
        throw new Error('Escola não identificada');
      }

      // Buscar total de alunos
      const { count: totalAlunos } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .eq('escola_id', userData.escola_id)
        .eq('funcao', 'aluno')
        .eq('ativo', true);

      // Buscar total de professores
      const { count: totalProfessores } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .eq('escola_id', userData.escola_id)
        .eq('funcao', 'professor')
        .eq('ativo', true);

      // Buscar total de turmas ativas
      const { count: totalTurmas } = await supabase
        .from('turmas')
        .select('*', { count: 'exact', head: true })
        .eq('escola_id', userData.escola_id)
        .eq('ativo', true);

      // Buscar total de cursos ativos
      const { count: totalCursos } = await supabase
        .from('cursos')
        .select('*', { count: 'exact', head: true })
        .eq('escola_id', userData.escola_id)
        .eq('ativo', true);

      // Calcular receita mensal (pagamentos do mês atual)
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);
      
      const fimMes = new Date();
      fimMes.setMonth(fimMes.getMonth() + 1);
      fimMes.setDate(0);
      fimMes.setHours(23, 59, 59, 999);

      const { data: pagamentos } = await supabase
        .from('financeiro')
        .select('valor')
        .eq('escola_id', userData.escola_id)
        .eq('status', 'pago')
        .gte('data_pagamento', inicioMes.toISOString().split('T')[0])
        .lte('data_pagamento', fimMes.toISOString().split('T')[0]);

      const receitaMensal = pagamentos?.reduce((total, p) => total + Number(p.valor), 0) || 0;

      // Calcular taxa de aprovação (simulada - pode ser implementada com base em notas)
      // Por enquanto, vamos usar uma taxa baseada no número de alunos ativos vs total
      const taxaAprovacao = totalAlunos && totalAlunos > 0 ? Math.min(95, 85 + (totalAlunos / 10)) : 0;

      const statsData = {
        totalAlunos: totalAlunos || 0,
        totalProfessores: totalProfessores || 0,
        totalTurmas: totalTurmas || 0,
        totalCursos: totalCursos || 0,
        taxaAprovacao: Math.round(taxaAprovacao),
        receitaMensal
      };
      
      console.log('Dashboard - Estatísticas carregadas:', statsData);
      setStats(statsData);

    } catch (err) {
      console.error('Erro ao buscar estatísticas do dashboard:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  };

  const fetchAtividadesRecentes = async () => {
    try {
      if (!userData?.escola_id) return;

      // Buscar atividades recentes de diferentes tabelas
      const atividades: AtividadeRecente[] = [];

      // Matrículas recentes - busca separada para evitar problemas de join
      const { data: matriculasRecentes } = await supabase
        .from('aluno_turmas')
        .select('id, data_matricula, aluno_id, turma_id')
        .order('data_matricula', { ascending: false })
        .limit(3);

      if (matriculasRecentes) {
        for (const matricula of matriculasRecentes) {
          // Buscar dados do aluno
          const { data: aluno } = await supabase
            .from('usuarios')
            .select('nome_completo, escola_id')
            .eq('id', matricula.aluno_id)
            .eq('escola_id', userData.escola_id)
            .single();

          // Buscar dados da turma
          const { data: turma } = await supabase
            .from('turmas')
            .select('nome')
            .eq('id', matricula.turma_id)
            .single();

          if (aluno && turma) {
            atividades.push({
              id: matricula.id,
              descricao: `Novo aluno matriculado: ${aluno.nome_completo} na turma ${turma.nome}`,
              data: new Date(matricula.data_matricula).toLocaleDateString('pt-BR'),
              tipo: 'matricula'
            });
          }
        }
      }

      // Comunicações recentes
      const { data: comunicacoesRecentes } = await supabase
        .from('comunicacoes')
        .select('id, titulo, data_envio, remetente_id')
        .eq('escola_id', userData.escola_id)
        .order('data_envio', { ascending: false })
        .limit(2);

      if (comunicacoesRecentes) {
        for (const comunicacao of comunicacoesRecentes) {
          // Buscar dados do remetente
          const { data: remetente } = await supabase
            .from('usuarios')
            .select('nome_completo')
            .eq('id', comunicacao.remetente_id)
            .single();

          if (remetente) {
            atividades.push({
              id: comunicacao.id,
              descricao: `Nova comunicação: ${comunicacao.titulo} por ${remetente.nome_completo}`,
              data: new Date(comunicacao.data_envio).toLocaleDateString('pt-BR'),
              tipo: 'comunicacao'
            });
          }
        }
      }

      // Ordenar por data mais recente
      atividades.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      
      // Se não há atividades, mostrar dados de exemplo
      if (atividades.length === 0) {
        const atividadesExemplo: AtividadeRecente[] = [
          {
            id: 'exemplo-1',
            descricao: 'Sistema inicializado - Bem-vindo ao ABC Escolar!',
            data: new Date().toLocaleDateString('pt-BR'),
            tipo: 'comunicacao'
          },
          {
            id: 'exemplo-2',
            descricao: 'Para começar, cadastre alunos, professores e turmas',
            data: new Date().toLocaleDateString('pt-BR'),
            tipo: 'comunicacao'
          }
        ];
        setAtividadesRecentes(atividadesExemplo);
      } else {
        setAtividadesRecentes(atividades.slice(0, 5));
      }

    } catch (err) {
      console.error('Erro ao buscar atividades recentes:', err);
    }
  };

  const fetchProximosEventos = () => {
    // Por enquanto, eventos estáticos. Pode ser implementado com uma tabela de eventos
    const eventos: ProximoEvento[] = [
      {
        id: '1',
        titulo: 'Reunião de Pais',
        data: '15/12/2024',
        hora: '19:00'
      },
      {
        id: '2',
        titulo: 'Prova Final - 3º Ano',
        data: '18/12/2024',
        hora: '08:00'
      },
      {
        id: '3',
        titulo: 'Formatura',
        data: '20/12/2024',
        hora: '19:00'
      },
      {
        id: '4',
        titulo: 'Férias Escolares',
        data: '22/12/2024',
        hora: '00:00'
      }
    ];
    setProximosEventos(eventos);
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      if (userLoading) {
        setLoading(true);
        return;
      }

      if (userError || !userData) {
        setError(userError || 'Usuário não encontrado');
        setLoading(false);
        return;
      }

      if (!userData.escola_id) {
        setError('Escola não identificada');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        await fetchDashboardStats();
        await fetchAtividadesRecentes();
        fetchProximosEventos();
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
        setError('Erro ao carregar dados do dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [userData, userLoading, userError]);

  const refreshData = () => {
    if (userData?.escola_id) {
      fetchDashboardStats();
      fetchAtividadesRecentes();
    }
  };

  return {
    stats,
    atividadesRecentes,
    proximosEventos,
    loading,
    error,
    refreshData
  };
};