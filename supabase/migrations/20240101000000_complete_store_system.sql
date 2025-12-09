-- Migration completa para o sistema de lojas

-- Tabela de Lojas com CNPJ/CPF único
CREATE TABLE IF NOT EXISTS lojas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  nome VARCHAR(255) NOT NULL,
  cnpj_cpf VARCHAR(20) UNIQUE,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  endereco TEXT,
  wait_time INTEGER DEFAULT 6, -- tempo padrão em horas (6h/8h/12h/24h)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(loja_id, nome)
);

-- Tabela de Produtos com variações de tamanho
CREATE TABLE IF NOT EXISTS produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  categoria_id UUID REFERENCES categorias(id),
  preco DECIMAL(10,2) NOT NULL,
  estoque INTEGER DEFAULT 0,
  tamanhos JSONB DEFAULT '[]', -- Array de tamanhos disponíveis ["P", "M", "G"]
  foto_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Funcionários
CREATE TABLE IF NOT EXISTS funcionarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  foto_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  selected_employee UUID REFERENCES funcionarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Reservas com controle de tempo atômico
CREATE TABLE IF NOT EXISTS reservas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  funcionario_id UUID REFERENCES funcionarios(id),
  quantidade INTEGER DEFAULT 1,
  tamanho VARCHAR(10),
  status VARCHAR(20) DEFAULT 'pendente', -- pendente, confirmado, cancelado, expirado, pego
  fim_reserva BIGINT NOT NULL, -- timestamp em milissegundos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Categorias de Interesse dos Clientes (para notificações)
CREATE TABLE IF NOT EXISTS categorias_clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cliente_id, categoria_id)
);

-- Tabela de Push Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  payload JSONB,
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_produtos_loja_id ON produtos(loja_id);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria_id ON produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_reservas_loja_id ON reservas(loja_id);
CREATE INDEX IF NOT EXISTS idx_reservas_status ON reservas(status);
CREATE INDEX IF NOT EXISTS idx_reservas_fim_reserva ON reservas(fim_reserva);
CREATE INDEX IF NOT EXISTS idx_funcionarios_loja_id ON funcionarios(loja_id);
CREATE INDEX IF NOT EXISTS idx_categorias_loja_id ON categorias(loja_id);

-- Função para decremento atômico do estoque
CREATE OR REPLACE FUNCTION decrementar_estoque_atomico(
  p_produto_id UUID,
  p_quantidade INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE produtos
  SET estoque = estoque - p_quantidade,
      updated_at = NOW()
  WHERE id = p_produto_id
    AND estoque >= p_quantidade;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Função para incremento atômico do estoque
CREATE OR REPLACE FUNCTION incrementar_estoque_atomico(
  p_produto_id UUID,
  p_quantidade INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE produtos
  SET estoque = estoque + p_quantidade,
      updated_at = NOW()
  WHERE id = p_produto_id;
END;
$$ LANGUAGE plpgsql;

-- Função para expirar reservas automaticamente
CREATE OR REPLACE FUNCTION expirar_reservas_automatico()
RETURNS VOID AS $$
BEGIN
  WITH reservas_expiradas AS (
    UPDATE reservas
    SET status = 'expirado',
        updated_at = NOW()
    WHERE status = 'pendente'
      AND fim_reserva <= EXTRACT(EPOCH FROM NOW()) * 1000
    RETURNING produto_id, quantidade
  )
  UPDATE produtos p
  SET estoque = p.estoque + r.quantidade
  FROM reservas_expiradas r
  WHERE p.id = r.produto_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lojas_updated_at BEFORE UPDATE ON lojas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON produtos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservas_updated_at BEFORE UPDATE ON reservas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas de segurança RLS
ALTER TABLE lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Políticas para Lojas
CREATE POLICY "Lojas: dono pode gerenciar própria loja" ON lojas
  FOR ALL USING (auth.uid() = owner_id);

-- Políticas para Produtos
CREATE POLICY "Produtos: dono da loja pode gerenciar" ON produtos
  FOR ALL USING (EXISTS (SELECT 1 FROM lojas WHERE lojas.id = produtos.loja_id AND lojas.owner_id = auth.uid()));

-- Políticas para Funcionários
CREATE POLICY "Funcionários: dono da loja pode gerenciar" ON funcionarios
  FOR ALL USING (EXISTS (SELECT 1 FROM lojas WHERE lojas.id = funcionarios.loja_id AND lojas.owner_id = auth.uid()));

-- Políticas para Reservas
CREATE POLICY "Reservas: dono da loja pode ver todas" ON reservas
  FOR ALL USING (EXISTS (SELECT 1 FROM lojas WHERE lojas.id = reservas.loja_id AND lojas.owner_id = auth.uid()));

CREATE POLICY "Reservas: clientes podem ver próprias" ON reservas
  FOR SELECT USING (auth.uid() = usuario_id);

-- Políticas para Categorias
CREATE POLICY "Categorias: dono da loja pode gerenciar" ON categorias
  FOR ALL USING (EXISTS (SELECT 1 FROM lojas WHERE lojas.id = categorias.loja_id AND lojas.owner_id = auth.uid()));
