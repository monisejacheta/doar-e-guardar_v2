-- backend-serverless/src/database/schema.sql
-- Banco de Dados Relacional (SQL) - Sistema Doar&Guardar 2.0 (Casa da Criança)

-- 1. Categorias e Subcategorias de Alimentos
CREATE TABLE IF NOT EXISTS tb_categoriasAlimentos (
    id_categoria_alimento SERIAL PRIMARY KEY,
    nome_categoria VARCHAR(100) NOT NULL,
    nome_subcategoria VARCHAR(100) NOT NULL,
    descricao_categoria TEXT NOT NULL,
    status_ativo BOOLEAN DEFAULT TRUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Locais de Armazenamento (Armários e Geladeiras - Proibidas ruas e corredores)
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
    estoque_minimo_pacote INT NOT NULL DEFAULT 5 CHECK (estoque_minimo_pacote >= 0),
    data_cadastro_produto TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Doadores (Pessoa Física)
CREATE TABLE IF NOT EXISTS tb_doadores (
    id_doador SERIAL PRIMARY KEY,
    id_usuario_conta VARCHAR(128),
    nome_completo_doador VARCHAR(150) NOT NULL,
    cpf_doador VARCHAR(14) UNIQUE NOT NULL,
    email_doador VARCHAR(100) NOT NULL,
    telefone_doador VARCHAR(20) NOT NULL,
    endereco_doador TEXT,
    data_nascimento_doador DATE,
    data_cadastro_doador TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Lotes de Produtos (Controle FEFO / PVPS)
CREATE TABLE IF NOT EXISTS tb_lotesProdutos (
    id_lote_produto SERIAL PRIMARY KEY,
    id_produto INT NOT NULL REFERENCES tb_produtos(id_produto),
    id_local_armazenamento INT NOT NULL REFERENCES tb_locaisArmazenamento(id_local_armazenamento),
    id_doador INT REFERENCES tb_doadores(id_doador),
    numero_codigo_lote VARCHAR(50) NOT NULL,
    quantidade_atual_pacote INT NOT NULL CHECK (quantidade_atual_pacote >= 0), -- Bloqueio de saldo negativo
    quantidade_inicial_pacote INT NOT NULL CHECK (quantidade_inicial_pacote > 0),
    data_entrada_lote TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_validade_lote DATE NOT NULL,
    status_validade_lote VARCHAR(30) DEFAULT 'regular' CHECK (status_validade_lote IN ('regular', 'próximo do vencimento', 'vencido'))
);

-- 6. Motivos de Saída Homologados
CREATE TABLE IF NOT EXISTS tb_motivosSaidas (
    id_motivo_saida SERIAL PRIMARY KEY,
    nome_motivo_saida VARCHAR(100) NOT NULL,
    descricao_motivo_saida TEXT NOT NULL,
    exige_confirmacao_perda BOOLEAN DEFAULT FALSE
);

-- 7. Movimentações de Estoque (Auditoria Transacional)
CREATE TABLE IF NOT EXISTS tb_movimentacoesEstoques (
    id_movimentacao_estoque SERIAL PRIMARY KEY,
    id_lote_produto INT NOT NULL REFERENCES tb_lotesProdutos(id_lote_produto),
    id_produto INT NOT NULL REFERENCES tb_produtos(id_produto),
    id_local_origem INT REFERENCES tb_locaisArmazenamento(id_local_armazenamento),
    id_local_destino INT REFERENCES tb_locaisArmazenamento(id_local_armazenamento),
    id_motivo_saida INT REFERENCES tb_motivosSaidas(id_motivo_saida),
    id_usuario_responsavel VARCHAR(128) NOT NULL,
    tipo_operacao VARCHAR(30) NOT NULL CHECK (tipo_operacao IN ('entrada', 'saída', 'movimentação interna')),
    quantidade_movimentada_pacote INT NOT NULL CHECK (quantidade_movimentada_pacote > 0),
    justificativa_detalhe TEXT,
    palavra_confirmacao_perda VARCHAR(10),
    confirmacao_divisao_lote BOOLEAN DEFAULT FALSE,
    data_hora_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Instituições Parceiras
CREATE TABLE IF NOT EXISTS tb_instituicoes (
    id_instituicao SERIAL PRIMARY KEY,
    nome_instituicao VARCHAR(150) NOT NULL,
    cnpj_instituicao VARCHAR(18) UNIQUE NOT NULL,
    email_instituicao VARCHAR(100) NOT NULL,
    telefone_instituicao VARCHAR(20) NOT NULL,
    endereco_instituicao TEXT NOT NULL,
    data_cadastro_instituicao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Representantes das Instituições (Relação N:N)
CREATE TABLE IF NOT EXISTS tb_representantesInstituicoes (
    id_representante_instituicao SERIAL PRIMARY KEY,
    id_instituicao INT NOT NULL REFERENCES tb_instituicoes(id_instituicao) ON DELETE CASCADE,
    id_doador INT NOT NULL REFERENCES tb_doadores(id_doador) ON DELETE RESTRICT,
    data_vinculo_representante TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_instituicao_doador UNIQUE (id_instituicao, id_doador)
);

-- 10. Campanhas de Doação (Portal Web)
CREATE TABLE IF NOT EXISTS tb_campanhasDoacoes (
    id_campanha_doacao SERIAL PRIMARY KEY,
    id_doador_responsavel INT NOT NULL REFERENCES tb_doadores(id_doador),
    id_instituicao_envolvida INT REFERENCES tb_instituicoes(id_instituicao),
    id_usuario_moderador VARCHAR(128),
    nome_campanha VARCHAR(150) NOT NULL,
    objetivo_descricao_campanha TEXT NOT NULL,
    data_inicio_campanha DATE NOT NULL,
    data_termino_campanha DATE NOT NULL,
    status_campanha VARCHAR(30) DEFAULT 'Pendente de Análise' CHECK (status_campanha IN ('Pendente de Análise', 'Aprovada', 'Reprovada', 'Encerrada')),
    justificativa_parecer_tecnico TEXT,
    data_avaliacao_moderacao TIMESTAMP,
    CONSTRAINT chk_datas_campanha CHECK (data_termino_campanha >= data_inicio_campanha)
);

-- 11. Itens e Metas das Campanhas
CREATE TABLE IF NOT EXISTS tb_itensCampanhas (
    id_item_campanha SERIAL PRIMARY KEY,
    id_campanha_doacao INT NOT NULL REFERENCES tb_campanhasDoacoes(id_campanha_doacao) ON DELETE CASCADE,
    id_produto INT REFERENCES tb_produtos(id_produto),
    nome_item_solicitado VARCHAR(150) NOT NULL,
    unidade_medida_item VARCHAR(50) DEFAULT 'pacotes',
    quantidade_meta_pretendida INT NOT NULL CHECK (quantidade_meta_pretendida > 0),
    quantidade_final_arrecadada INT DEFAULT 0 CHECK (quantidade_final_arrecadada >= 0)
);

-- 12. Logs de Auditoria Imutáveis (RF08)
CREATE TABLE IF NOT EXISTS tb_logsAuditorias (
    id_log_auditoria SERIAL PRIMARY KEY,
    id_usuario_responsavel VARCHAR(128) NOT NULL,
    id_produto INT REFERENCES tb_produtos(id_produto),
    id_lote_produto INT REFERENCES tb_lotesProdutos(id_lote_produto),
    tipo_acao_executada VARCHAR(50) NOT NULL,
    detalhe_operacao TEXT NOT NULL,
    data_hora_acao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserção de Motivos Padrão Homologados (Tela 6.7)
INSERT INTO tb_motivosSaidas (nome_motivo_saida, descricao_motivo_saida, exige_confirmacao_perda)
VALUES
    ('saída para consumo', 'Alimentos direcionados para as refeições das crianças atendidas pela ONG.', FALSE),
    ('perda - descarte vencido', 'Alimentos que atingiram o prazo de validade expirado. Exige digitação obrigatória de PERDA.', TRUE),
    ('perda - descarte', 'Insumos avariados ou embalagens danificadas impróprias para consumo. Exige digitação de PERDA.', TRUE),
    ('saída - outro motivo', 'Outras baixas operacionais justificadas.', FALSE),
    ('saída - movimentação estoque', 'Transferência de insumo entre compartimentos físicos (armários/geladeiras).', FALSE)
ON CONFLICT DO NOTHING;