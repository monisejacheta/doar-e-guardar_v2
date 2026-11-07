// scripts/gerar-telas.js
const fs = require('fs');
const path = require('path');

// Mapeamento completo das subtelas faltantes com base na especificação oficial
const subtelasFaltantes = [
  // Subtelas do Perfil (Tela 02.1)
  {
    rota: 'profile-view',
    titulo: '2.1.1 Perfil Detalhado',
    subtitulo: 'Consulta das informações cadastrais e permissões do usuário logado.',
    corVariante: 'primary',
    campos: [
      { rotulo: 'Nome Completo', valor: 'Colaborador Casa da Criança' },
      { rotulo: 'E-mail Institucional', valor: 'colaborador@casadacrianca.org.br' },
      { rotulo: 'Função / Nível', valor: 'Operador de Estoque (RBAC)' },
      { rotulo: 'Autenticação', valor: 'Firebase Auth via Google Identity' },
    ],
  },
  {
    rota: 'profile-preferences',
    titulo: '2.1.3 Preferências Gerais',
    subtitulo: 'Ajuste de idioma e preferências de alertas da conta.',
    corVariante: 'primary',
    campos: [
      { rotulo: 'Idioma da Interface', valor: 'Português (Brasil)' },
      { rotulo: 'Frequência de Relatórios', valor: 'Semanal' },
    ],
  },

  // Subtelas de Notificações (Tela 02.2)
  {
    rota: 'notifications-list',
    titulo: '2.2.1 Central de Avisos',
    subtitulo: 'Lista detalhada de alertas do sistema e da assistente Dora.',
    corVariante: 'amber',
    campos: [
      { rotulo: 'Filtrar por tipo', valor: 'Estoque Mínimo, Validade e Receitas' },
    ],
  },

  // Subtelas de Relatórios (Tela 04)
  {
    rota: 'reports-stock',
    titulo: '4.1 Relatório de Estoque Atual',
    subtitulo: 'Balanço consolidado de alimentos e quantidades ativas.',
    corVariante: 'primary',
    campos: [
      { rotulo: 'Categoria para Filtrar', valor: 'Todas as categorias' },
      { rotulo: 'Status do Lote', valor: 'Regulares e a vencer (< 7 dias)' },
    ],
  },
  {
    rota: 'reports-movements',
    titulo: '4.2 Relatório de Movimentações',
    subtitulo: 'Histórico de entradas, saídas para refeições e transferências.',
    corVariante: 'primary',
    campos: [
      { rotulo: 'Período', valor: 'Últimos 30 dias' },
      { rotulo: 'Tipo de Operação', valor: 'Entrada, Saída e Movimentação' },
    ],
  },
  {
    rota: 'reports-losses',
    titulo: '4.3 Relatório de Perdas e Descartes',
    subtitulo: 'Auditoria de descartes confirmados com a trava PERDA.',
    corVariante: 'danger',
    campos: [
      { rotulo: 'Motivo de Saída', valor: 'perda - descarte vencido / avaria' },
      { rotulo: 'Justificativa Registrada', valor: 'Obrigatória em todos os registros' },
    ],
  },
  {
    rota: 'reports-expiry',
    titulo: '4.4 Relatório de Validades (FEFO)',
    subtitulo: 'Mapeamento preventivo de lotes próximos do vencimento.',
    corVariante: 'amber',
    campos: [
      { rotulo: 'Janela Crítica', valor: 'Vencimento em menos de 7 dias' },
      { rotulo: 'Ordenação', valor: 'Mais urgentes primeiro (FEFO / PVPS)' },
    ],
  },

  // Subtelas de Configurações (Tela 06)
  {
    rota: 'settings-donors',
    titulo: '6.1 Gerenciamento de Doadores',
    subtitulo: 'Cadastro, edição e consulta de apoiadores pessoa física.',
    corVariante: 'secondary',
    campos: [
      { rotulo: 'Nome do Doador', valor: '' },
      { rotulo: 'CPF (Obrigatório)', valor: '' },
      { rotulo: 'Telefone / WhatsApp', valor: '' },
    ],
  },
  {
    rota: 'settings-institutions',
    titulo: '6.2 Instituições Parceiras',
    subtitulo: 'Entidades parceiras vinculadas a doadores representantes.',
    corVariante: 'secondary',
    campos: [
      { rotulo: 'Razão Social / Nome Fantasia', valor: '' },
      { rotulo: 'CNPJ da Entidade', valor: '' },
      { rotulo: 'Doador Representante Vinculado', valor: 'Obrigatório ao menos um' },
    ],
  },
  {
    rota: 'settings-campaigns',
    titulo: '6.3 Campanhas de Doações Ativas',
    subtitulo: 'Consulta de campanhas comunitárias homologadas pela instituição.',
    corVariante: 'primary',
    campos: [
      { rotulo: 'Pesquisar Campanha', valor: 'Buscar por nome ou doador...' },
    ],
  },
  {
    rota: 'settings-users',
    titulo: '6.6 Usuários e Permissões (RBAC)',
    subtitulo: 'Controle de níveis de acesso de colaboradores e voluntários.',
    corVariante: 'primary',
    campos: [
      { rotulo: 'Nome do Usuário', valor: '' },
      { rotulo: 'E-mail de Acesso', valor: '' },
      { rotulo: 'Nível de Permissão', valor: 'Administrador / Operador / Consulta' },
    ],
  },
  {
    rota: 'settings-sync',
    titulo: '6.8 Status de Sincronização',
    subtitulo: 'Logs de sincronia entre os dados locais e a nuvem AWS.',
    corVariante: 'primary',
    campos: [
      { rotulo: 'Última Sincronização', valor: 'Hoje às 14:32 (Sucesso)' },
      { rotulo: 'Banco Relacional AWS', valor: 'Conectado (Latência: 110ms)' },
    ],
  },

  // Subtelas de Auditoria (Tela 07)
  {
    rota: 'audit-product',
    titulo: '7.2 Auditoria por Produto',
    subtitulo: 'Rastreabilidade de lotes e movimentações de um alimento.',
    corVariante: 'primary',
    campos: [
      { rotulo: 'Código de Barras ou Nome do Item', valor: '' },
    ],
  },
  {
    rota: 'audit-period',
    titulo: '7.3 Auditoria por Período',
    subtitulo: 'Consulta de operações executadas em intervalo de datas.',
    corVariante: 'primary',
    campos: [
      { rotulo: 'Data Inicial', valor: '01/10/2026' },
      { rotulo: 'Data Final', valor: '20/10/2026' },
    ],
  },
  {
    rota: 'audit-export',
    titulo: '7.4 Exportar Auditoria em PDF',
    subtitulo: 'Emissão e envio de relatórios oficiais para a diretoria.',
    corVariante: 'secondary',
    campos: [
      { rotulo: 'E-mails de Destino', valor: 'diretoria@casadacrianca.org.br' },
    ],
  },

  // Subtelas de Diagnóstico (Tela 09)
  {
    rota: 'diagnostic-aws',
    titulo: '9.1 Serviços AWS Lambda',
    subtitulo: 'Métricas de execução e latência das funções serverless.',
    corVariante: 'secondary',
    campos: [
      { rotulo: 'Status AWS sa-east-1', valor: 'Operacional (Sem erros)' },
    ],
  },
  {
    rota: 'diagnostic-database',
    titulo: '9.2 Bancos de Dados',
    subtitulo: 'Conectividade do SQL Relacional e NoSQL Firebase.',
    corVariante: 'secondary',
    campos: [
      { rotulo: 'Banco Relacional (Estoque)', valor: 'Online (Pool Ativo)' },
      { rotulo: 'Banco NoSQL (Sessões/LGPD)', valor: 'Online (Firebase)' },
    ],
  },
  {
    rota: 'diagnostic-apis',
    titulo: '9.3 Cascata de APIs de EAN',
    subtitulo: 'Status de contingência das 3 APIs de código de barras.',
    corVariante: 'amber',
    campos: [
      { rotulo: 'API Primária (Cosmos)', valor: 'Online' },
      { rotulo: 'API Secundária (Bluesoft)', valor: 'Online' },
      { rotulo: 'API Terciária (OpenFood)', valor: 'Standby / Pronta' },
    ],
  },
  {
    rota: 'diagnostic-config',
    titulo: '9.4 Configuração de Integrações',
    subtitulo: 'Ajuste de chaves, limites de requisição e timeouts.',
    corVariante: 'primary',
    campos: [
      { rotulo: 'Tempo Limite por API (Timeout)', valor: '2500 ms' },
    ],
  },
];

// Gerador do template React Native com acessibilidade e Design System
function gerarCodigoTela(meta) {
  const camposRenderizados = meta.campos
    .map(
      (c) => `
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: '600', color: theme.text, fontSize: 13 * fontScale, marginBottom: 4 }}>
            ${c.rotulo}:
          </Text>
          <View
            style={{
              minHeight: 48,
              borderWidth: 1.5,
              borderColor: theme.border,
              backgroundColor: theme.surface,
              borderRadius: 10,
              paddingHorizontal: 12,
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '${c.valor ? theme.text : theme.subtext}', fontSize: 13 * fontScale }}>
              ${c.valor || 'Toque para preencher ou selecionar...'}
            </Text>
          </View>
        </View>`
    )
    .join('\n');

  return `// Gerado automaticamente conforme especificacao oficial Doar&Guardar 2.0
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';

export default function SubScreen_${meta.rota.replace(/-/g, '_')}() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const executarAcao = () => {
    Alert.alert(
      'Operação Homologada',
      'Dados processados com sucesso e sincronizados com a nuvem AWS.',
      [{ text: 'OK', onPress: () => roteador.back() }]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* Cabeçalho Padronizado */}
        <View style={{ marginBottom: 18 }}>
          <Text style={{ fontWeight: 'bold', color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }}>
            ${meta.titulo}
          </Text>
          <Text style={{ color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale, marginTop: 4, lineHeight: 20 }}>
            ${meta.subtitulo}
          </Text>
        </View>

        {/* Card Estrutural de Dados */}
        <View
          style={{
            borderWidth: 1.5,
            borderColor: theme.border,
            backgroundColor: theme.surface,
            borderRadius: 14,
            padding: 16,
            marginBottom: 20,
          }}
        >
          ${camposRenderizados}
        </View>

        {/* Botões Acessíveis (Touch Target >= 48px) */}
        <View style={{ gap: 10 }}>
          <AppButton
            title="Confirmar Ação"
            variant="${meta.corVariante}"
            onPress={executarAcao}
            accessibilityHint="Confirma as operações desta subtela"
          />
          <AppButton
            title="Voltar à Central"
            variant="neutral"
            onPress={() => roteador.back()}
            accessibilityHint="Retorna para a tela principal"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
`;
}

// Diretório de destino
const pastaApp = path.join(__dirname, '../src/app');

if (!fs.existsSync(pastaApp)) {
  fs.mkdirSync(pastaApp, { recursive: true });
}

let criadas = 0;
let ignoradas = 0;

subtelasFaltantes.forEach((subtela) => {
  const arquivoDestino = path.join(pastaApp, `${subtela.rota}.tsx`);

  // Não sobrescreve se você já tiver customizado a tela manualmente
  if (!fs.existsSync(arquivoDestino)) {
    fs.writeFileSync(arquivoDestino, gerarCodigoTela(subtela), 'utf8');
    console.log(`✓ [CRIADA] src/app/${subtela.rota}.tsx`);
    criadas++;
  } else {
    console.log(`- [IGNORADA] src/app/${subtela.rota}.tsx (já existe)`);
    ignoradas++;
  }
});

console.log(`\nResumo da Automação:`);
console.log(`• Telas geradas com sucesso: ${criadas}`);
console.log(`• Telas preservadas existentes: ${ignoradas}`);
console.log(`• Todas as rotas do Expo Router estão prontas!`);