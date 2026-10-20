-- backend-serverless/src/database/schema.sql

-- 1. Categorias de Alimentos
CREATE TABLE IF NOT EXISTS tb_categoriasAlimentos (
    id_categoria_alimento SERIAL PRIMARY KEY,
    nome_categoria VARCHAR(100) NOT NULL,
    nome_subcategoria VARCHAR(100) NOT NULL,
    descricao_categoria TEXT NOT NULL,
    status_ativo BOOLEAN DEFAULT TRUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Locais de Armazenamento (Sem ruas/corredores)
CREATE TABLE IF NOT EXISTS tb_locaisArmazenamento (
    id_local_armazenamento SERIAL PRIMARY KEY,
    nome_local VARCHAR(100) NOT NULL,
    tipo_local VARCHAR(20) NOT NULL CHECK (tipo_local IN ('armário', 'geladeira')),
    sublocal_compartimento VARCHAR(100) NOT NULL,
    localizacao_ambiente VARCHAR(100) NOT NULL,
    status_ativo BOOLEAN DEFAULT TRUE
);

-- 3. Catálogo de Produtos
CREATE TABLE IF NOT EXISTS tb_produtos (
    id_produto SERIAL PRIMARY KEY,
    id_categoria_alimento INT NOT NULL REFERENCES tb_categoriasAlimentos(id_categoria_alimento),
    codigo_barra_produto VARCHAR(50) UNIQUE NOT NULL,
    nome_produto VARCHAR(150) NOT NULL,
    marca_produto VARCHAR(100),
    unidade_medida_pacote VARCHAR(50) DEFAULT 'pacotes',
    url_foto_produto TEXT,
    estoque_minimo_pacote INT NOT NULL DEFAULT 5,
    data_cadastro_produto TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Lotes de Produtos (Controle FEFO e saldo restrito)
CREATE TABLE IF NOT EXISTS tb_lotesProdutos (
    id_lote_produto SERIAL PRIMARY KEY,
    id_produto INT NOT NULL REFERENCES tb_produtos(id_produto),
    id_local_armazenamento INT NOT NULL REFERENCES tb_locaisArmazenamento(id_local_armazenamento),
    numero_codigo_lote VARCHAR(50) NOT NULL,
    quantidade_atual_pacote INT NOT NULL CHECK (quantidade_atual_pacote >= 0), -- Impede saldo negativo
    quantidade_inicial_pacote INT NOT NULL CHECK (quantidade_inicial_pacote > 0),
    data_entrada_lote TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_validade_lote DATE NOT NULL,
    status_validade_lote VARCHAR(30) DEFAULT 'regular'
);

-- 5. Motivos de Saída Homologados
CREATE TABLE IF NOT EXISTS tb_motivosSaidas (
    id_motivo_saida SERIAL PRIMARY KEY,
    nome_motivo_saida VARCHAR(100) NOT NULL,
    descricao_motivo_saida TEXT NOT NULL,
    exige_confirmacao_perda BOOLEAN DEFAULT FALSE
);

-- 6. Movimentações de Estoque (Auditoria)
CREATE TABLE IF NOT EXISTS tb_movimentacoesEstoques (
    id_movimentacao_estoque SERIAL PRIMARY KEY,
    id_lote_produto INT NOT NULL REFERENCES tb_lotesProdutos(id_lote_produto),
    id_produto INT NOT NULL REFERENCES tb_produtos(id_produto),
    id_local_origem INT REFERENCES tb_locaisArmazenamento(id_local_armazenamento),
    id_local_destino INT REFERENCES tb_locaisArmazenamento(id_local_armazenamento),
    id_motivo_saida INT REFERENCES tb_motivosSaidas(id_motivo_saida),
    id_usuario_responsavel VARCHAR(100) NOT NULL,
    tipo_operacao VARCHAR(30) NOT NULL CHECK (tipo_operacao IN ('entrada', 'saída', 'movimentação interna')),
    quantidade_movimentada_pacote INT NOT NULL CHECK (quantidade_movimentada_pacote > 0),
    justificativa_detalhe TEXT,
    palavra_confirmacao_perda VARCHAR(10),
    confirmacao_divisao_lote BOOLEAN DEFAULT FALSE,
    data_hora_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);