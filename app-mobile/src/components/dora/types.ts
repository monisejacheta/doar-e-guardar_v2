import {
  AtalhoNavegacaoDora,
  PredicaoProdutoML,
  ReceitaSugerida,
} from '../../services/doraService';
import { ThemeColors } from '../../theme/themes';

export type ModoTemaChat = 'light' | 'dark' | 'high-contrast';

export const AVATAR_DORA_ASSET = require('../../../assets/images/dora-avatar.png');

export interface MensagemChat {
  id: string;
  autor: 'dora' | 'usuario';
  horario: string;
  texto: string;
  receita?: ReceitaSugerida;
  predicoes?: PredicaoProdutoML[];
  atalho?: AtalhoNavegacaoDora;
  sugestoesContinuacao?: string[];
}

export interface CoresChatDora {
  cabecalho: string;
  canvas: string;
  divisorBg: string;
  divisorTexto: string;
  balaoDoraBg: string;
  balaoDoraBorda: string;
  balaoUsuarioBg: string;
  balaoUsuarioBorda: string;
  balaoUsuarioTexto: string;
  horarioUsuario: string;
  tituloBloco: string;
  subtituloBloco: string;
  cardInternoBg: string;
  cardInternoBorda: string;
  itemPredicaoBg: string;
  chipSugestaoBg: string;
  chipSugestaoBorda: string;
  chipSugestaoTexto: string;
  composerDockBg: string;
  modalFalaBg: string;
  modalFalaBorda: string;
}

export const criarCoresChatDora = (theme: ThemeColors, mode: ModoTemaChat): CoresChatDora => {
  const modoEscuroOuContraste = mode === 'dark' || mode === 'high-contrast';
  const ehContraste = mode === 'high-contrast';

  return {
    cabecalho: ehContraste ? theme.surface : '#1E3A8A',
    canvas: modoEscuroOuContraste ? theme.background : '#EFEAE2',
    divisorBg: modoEscuroOuContraste ? theme.surface : 'rgba(30, 58, 138, 0.10)',
    divisorTexto: ehContraste ? theme.accent : modoEscuroOuContraste ? '#93C5FD' : '#1E3A8A',
    balaoDoraBg: theme.surface,
    balaoDoraBorda: modoEscuroOuContraste ? theme.border : '#E2E8F0',
    balaoUsuarioBg: ehContraste ? '#003300' : modoEscuroOuContraste ? '#064E3B' : '#DCF8C6',
    balaoUsuarioBorda: modoEscuroOuContraste ? '#10B981' : '#B7E89E',
    balaoUsuarioTexto: modoEscuroOuContraste ? '#FFFFFF' : '#111827',
    horarioUsuario: modoEscuroOuContraste ? '#D1FAE5' : '#4B5563',
    tituloBloco: ehContraste ? theme.accent : modoEscuroOuContraste ? '#93C5FD' : '#1E3A8A',
    subtituloBloco: ehContraste ? '#34D399' : modoEscuroOuContraste ? '#34D399' : '#047857',
    cardInternoBg: modoEscuroOuContraste ? theme.background : '#F8FAFC',
    cardInternoBorda: modoEscuroOuContraste ? theme.border : '#1E3A8A35',
    itemPredicaoBg: theme.surface,
    chipSugestaoBg: theme.surface,
    chipSugestaoBorda: modoEscuroOuContraste ? theme.primary : '#1E3A8A55',
    chipSugestaoTexto: ehContraste ? theme.accent : modoEscuroOuContraste ? '#93C5FD' : '#1E3A8A',
    composerDockBg: ehContraste ? theme.surface : modoEscuroOuContraste ? '#0F172A' : '#F0F2F5',
    modalFalaBg: modoEscuroOuContraste ? theme.background : '#F0FDF4',
    modalFalaBorda: modoEscuroOuContraste ? theme.border : '#BBF7D0',
  };
};

export const obterHorarioAtual = (): string => {
  const agora = new Date();
  return `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
};

export const criarMensagemBoasVindas = (sufixo = 'inicial'): MensagemChat => ({
  id: `msg-boas-vindas-${sufixo}`,
  autor: 'dora',
  horario: obterHorarioAtual(),
  texto:
    `# Olá! Eu sou a Dora\n` +
    `## Assistente de Estoque • Casa da Criança\n` +
    `• **Receitas reais:** Sugiro preparos com ingredientes compatíveis do estoque.\n` +
    `• **Previsão de consumo:** Calculo a duração estimada de cada alimento.\n` +
    `• **Alerta de validade (FEFO):** Indico o que precisa sair primeiro.\n` +
    `• **Localização:** Mostro exatamente em qual prateleira cada lote está.`,
  sugestoesContinuacao: [
    '🍲 Me sugere uma receita?',
    '📈 Como está nosso estoque?',
    '⏰ O que vence nos próximos dias?',
    '📦 O que temos nas prateleiras?',
    '🧭 Como uso o aplicativo?',
  ],
});

export const COMANDOS_VOZ_RAPIDOS = [
  '🍲 Me sugere uma receita com o que temos?',
  '📈 Previsão de quando vão acabar os alimentos',
  '⏰ Quais produtos vencem primeiro?',
  '📦 O que está guardado nas prateleiras?',
  '🧭 Como cadastro uma entrada no estoque?',
];
