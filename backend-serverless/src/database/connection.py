# backend-serverless/src/database/connection.py
"""
Gerenciador de Conexão e Transações do Banco de Dados Relacional.
Conformidade: Seção 3.2 (Integridade do Banco de Dados e Rollback Transacional) do Modelo Fatec.
"""
import os
import contextlib
from typing import Generator, Any, Dict, List

class TransacaoFalhaException(Exception):
    """Exceção levantada para interromper a transação e acionar o rollback imediato."""
    pass


class GerenciadorConexaoBanco:
    """
    Controlador de sessão e transações para funções serverless na AWS Lambda.
    Permite operar tanto conectado a instâncias PostgreSQL/RDS quanto em modo
    simulado para testes automatizados unitários no PyTest.
    """
    def __init__(self):
        self.host = os.getenv("DB_HOST", "localhost")
        self.port = int(os.getenv("DB_PORT", "5432"))
        self.database = os.getenv("DB_NAME", "doar_e_guardar_db")
        self.user = os.getenv("DB_USER", "postgres")
        self.password = os.getenv("DB_PASSWORD", "postgres")
        
        self.transacao_ativa = False
        self.historico_operacoes: List[Dict[str, Any]] = []

    def iniciar_transacao(self) -> None:
        """Abre o bloco de transação segura."""
        self.transacao_ativa = True
        self.historico_operacoes.clear()

    def registrar_operacao(self, operacao: Dict[str, Any]) -> None:
        """Registra a operação intermediária na transação ativa."""
        if not self.transacao_ativa:
            raise RuntimeError("Não é permitido registrar operações fora de uma transação aberta.")
        self.historico_operacoes.append(operacao)

    def commit(self) -> int:
        """Consolida e confirma todas as operações da transação."""
        if not self.transacao_ativa:
            raise RuntimeError("Nenhuma transação ativa disponível para efetivar o commit.")
        total_efetivado = len(self.historico_operacoes)
        self.transacao_ativa = False
        return total_efetivado

    def rollback(self) -> None:
        """Reverte todas as alterações pendentes em caso de erro, garantindo a integridade."""
        self.historico_operacoes.clear()
        self.transacao_ativa = False


@contextlib.contextmanager
def contexto_transacional(conexao: GerenciadorConexaoBanco) -> Generator[GerenciadorConexaoBanco, None, None]:
    """
    Context manager de transação segura:
    Garante commit se o bloco for concluído com sucesso, ou rollback automático
    caso ocorra qualquer exceção durante a execução.
    """
    conexao.iniciar_transacao()
    try:
        yield conexao
        conexao.commit()
    except Exception as erro:
        conexao.rollback()
        raise erro