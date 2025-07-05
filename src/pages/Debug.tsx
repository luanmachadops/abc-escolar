import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const Debug = () => {
  const { user } = useAuth();
  const [dbData, setDbData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testDatabase = async () => {
      try {
        console.log('Debug - Usuário autenticado:', user);
        
        // Testar conexão básica
        const { data: escolas, error: escolasError } = await supabase
          .from('escolas')
          .select('*')
          .limit(5);
        
        console.log('Debug - Escolas:', escolas, escolasError);
        
        // Testar usuários
        const { data: usuarios, error: usuariosError } = await supabase
          .from('usuarios')
          .select('*')
          .limit(5);
        
        console.log('Debug - Usuários:', usuarios, usuariosError);
        
        if (user) {
          // Testar busca do usuário atual
          const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('auth_user_id', user.id)
            .single();
          
          console.log('Debug - Dados do usuário atual:', userData, userError);
          
          setDbData({
            user,
            escolas,
            usuarios,
            userData,
            errors: {
              escolasError,
              usuariosError,
              userError
            }
          });
        } else {
          setDbData({
            user: null,
            escolas,
            usuarios,
            errors: {
              escolasError,
              usuariosError
            }
          });
        }
        
      } catch (err) {
        console.error('Debug - Erro:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };
    
    testDatabase();
  }, [user]);

  if (loading) {
    return <div className="p-4">Carregando debug...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Debug - Dados do Sistema</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Erro:</strong> {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Usuário Autenticado:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(dbData?.user, null, 2)}
          </pre>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Escolas ({dbData?.escolas?.length || 0}):</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(dbData?.escolas, null, 2)}
          </pre>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Usuários ({dbData?.usuarios?.length || 0}):</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(dbData?.usuarios, null, 2)}
          </pre>
        </div>
        
        {dbData?.userData && (
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-bold mb-2">Dados do Usuário Atual:</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(dbData.userData, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Erros:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(dbData?.errors, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default Debug;