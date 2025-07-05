-- Adiciona a política de SELECT para a tabela escolas, permitindo que usuários não autenticados leiam os dados.
-- Isso é necessário para que o cliente Supabase possa retornar os dados da escola após a inserção.

CREATE POLICY "Public schools are viewable by everyone." ON public.escolas
FOR SELECT USING (true);