// app-mobile/scripts/gerar-telas.js
const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '..', 'src', 'app');
const stylesDir = path.join(__dirname, '..', 'src', 'styles');

if (!fs.existsSync(stylesDir)) fs.mkdirSync(stylesDir, { recursive: true });
if (!fs.existsSync(appDir)) fs.mkdirSync(appDir, { recursive: true });

// Definição do lote de telas conforme especificação oficial do Doar&Guardar 2.0
const telas = [
  // Subtelas Perfil (Tela 02.1)
  {
    arquivo: 'profile-view',
    titulo: 'Visualizar Perfil',
    descricao: 'Consulta detalhada das informações cadastrais do operador.',
    subtela: '2.1.1'
  },
  {
    arquivo: 'profile-edit',
    titulo: 'Editar Perfil',
    descricao: 'Atualização de nome de exibição, telefone e dados de contato.',
    subtela: '2.1.2'
  },
  {
    arquivo: 'profile-preferences',
    titulo: 'Preferências do Usuário',
    descricao: 'Ajuste de idioma, alertas de sistema e preferências pessoais.',
    subtela: '2.1.3'
  },
  // Subtelas Acessibilidade (Tela 02.3)
  {
    arquivo: 'accessibility',
    titulo: 'Central de Acessibilidade',
    descricao: 'Configuração de opções universais de leitura, contraste e som.',
    subtela: '02.3'
  },
  {
    arquivo: 'accessibility-screen-reader',
    titulo: 'Leitor de Tela',
    descricao: 'Ativação e ajuste de textos alternativos e sintetizador de voz.',
    subtela: '2.3.1'
  },
  {
    arquivo: 'accessibility-voice-nav',
    titulo: 'Navegação por Voz',
    descricao: 'Habilitação de comandos verbais para navegação e preenchimento.',
    subtela: '2.3.2'
  },
  {
    arquivo: 'accessibility-font-size',
    titulo: 'Tamanho da Fonte',
    descricao: 'Redimensionamento dinâmico tipográfico sem corte de layout.',
    subtela: '2.3.3'
  },
  {
    arquivo: 'accessibility-high-contrast',
    titulo: 'Alto Contraste',
    descricao: 'Ativação de contraste máximo para suporte à baixa visão.',
    subtela: '2.3.4'
  },
  {
    arquivo: 'accessibility-dark-mode',
    titulo: 'Modo Escuro',
    descricao: 'Ajuste de tons escuros para redução de fadiga visual.',
    subtela: '2.3.5'
  },
  // Subtelas Notificações (Tela 02.2)
  {
    arquivo: 'notifications-list',
    titulo: 'Lista de Notificações',
    descricao: 'Detalhamento cronológico e gerenciamento de avisos recebidos.',
    subtela: '2.2.1'
  },
  {
    arquivo: 'notifications-config',
    titulo: 'Configurar Notificações',
    descricao: 'Filtro de avisos de estoque mínimo, validade e dicas da Dora.',
    subtela: '2.2.2'
  },
  // Subtelas Estoque (Tela 03)
  {
    arquivo: 'stock-add',
    titulo: 'Entrada de Produtos',
    descricao: 'Leitura de código de barras pela câmera ou digitação manual.',
    subtela: '3.1',
    customTemplate: 'STOCK_ADD'
  },
  {
    arquivo: 'stock-remove',
    titulo: 'Remover Produtos do Estoque',
    descricao: 'Baixa de itens com confirmação de descarte via palavra PERDA.',
    subtela: '3.2',
    customTemplate: 'STOCK_REMOVE'
  },
  {
    arquivo: 'stock-move',
    titulo: 'Mover Produtos',
    descricao: 'Transferência de armário/geladeira com confirmação de lote.',
    subtela: '3.3'
  },
  {
    arquivo: 'stock-details',
    titulo: 'Consulta Detalhada de Estoque',
    descricao: 'Visão aprofundada de lotes, prioridade FEFO e saldos ativos.',
    subtela: '3.4'
  },
  // Tela 04 e Relatórios (4.1 a 4.4)
  {
    arquivo: 'reports',
    titulo: 'Central de Relatórios',
    descricao: 'Consolidação de inventário e exportação de balanços em PDF.',
    subtela: '04'
  },
  {
    arquivo: 'reports-stock',
    titulo: 'Relatório de Estoque Atual',
    descricao: 'Exportação em PDF do inventário ativo com gráficos de saldo.',
    subtela: '4.1'
  },
  {
    arquivo: 'reports-movements',
    titulo: 'Relatório de Movimentações',
    descricao: 'Histórico de entradas, saídas e transferências por período.',
    subtela: '4.2'
  },
  {
    arquivo: 'reports-losses',
    titulo: 'Relatório de Perdas e Descartes',
    descricao: 'Auditoria de descarte justificado com consolidação quantitativa.',
    subtela: '4.3'
  },
  {
    arquivo: 'reports-expiry',
    titulo: 'Relatório de Validades',
    descricao: 'Mapeamento de lotes ordenados por data de vencimento (FEFO).',
    subtela: '4.4'
  },
  // Tela 05 - Dora
  {
    arquivo: 'dora',
    titulo: 'Assistente Dora',
    descricao: 'Conversa em linguagem natural para consultas e sugestão de receitas.',
    subtela: '05',
    customTemplate: 'DORA'
  },
  // Tela 06 e Configurações (6.1 a 6.8)
  {
    arquivo: 'settings',
    titulo: 'Configurações Avançadas',
    descricao: 'Gestão estrutural de cadastros, locais e regras do sistema.',
    subtela: '06'
  },
  {
    arquivo: 'settings-donors',
    titulo: 'Gerenciamento de Doadores',
    descricao: 'Cadastro e consulta de doadores pessoa física.',
    subtela: '6.1'
  },
  {
    arquivo: 'settings-institutions',
    titulo: 'Gerenciamento de Instituições',
    descricao: 'Cadastro e vínculo de instituições parceiras com representantes.',
    subtela: '6.2'
  },
  {
    arquivo: 'settings-campaigns',
    titulo: 'Campanhas de Doações Ativas',
    descricao: 'Consulta de iniciativas de arrecadação propostas por doadores.',
    subtela: '6.3'
  },
  {
    arquivo: 'settings-categories',
    titulo: 'Categorias de Alimentos',
    descricao: 'Estruturação de categorias, subcategorias e descrições.',
    subtela: '6.4'
  },
  {
    arquivo: 'settings-storage',
    titulo: 'Locais de Armazenamento',
    descricao: 'Mapeamento de armários e geladeiras (sem ruas ou corredores).',
    subtela: '6.5'
  },
  {
    arquivo: 'settings-users',
    titulo: 'Usuários do Sistema',
    descricao: 'Controle de operadores e níveis de acesso (RBAC).',
    subtela: '6.6'
  },
  {
    arquivo: 'settings-reasons',
    titulo: 'Motivos de Saída',
    descricao: 'Configuração dos motivos padrão para baixas de estoque.',
    subtela: '6.7'
  },
  {
    arquivo: 'settings-sync',
    titulo: 'Status da Sincronização',
    descricao: 'Monitoramento da sincronização com o banco de dados online.',
    subtela: '6.8'
  },
  // Tela 07 e Auditoria (7.1 a 7.4)
  {
    arquivo: 'audit',
    titulo: 'Histórico e Auditoria',
    descricao: 'Rastreabilidade de todas as ações executadas no sistema.',
    subtela: '07'
  },
  {
    arquivo: 'audit-user',
    titulo: 'Auditoria por Usuário',
    descricao: 'Consulta de operações executadas por um colaborador específico.',
    subtela: '7.1'
  },
  {
    arquivo: 'audit-product',
    titulo: 'Auditoria por Produto',
    descricao: 'Rastro de entradas e baixas associadas a um alimento.',
    subtela: '7.2'
  },
  {
    arquivo: 'audit-period',
    titulo: 'Auditoria por Período',
    descricao: 'Filtro cronológico de operações para conferência periódica.',
    subtela: '7.3'
  },
  {
    arquivo: 'audit-export',
    titulo: 'Exportar Histórico',
    descricao: 'Download e envio por e-mail de logs de auditoria em PDF.',
    subtela: '7.4'
  },
  // Tela 09 e Disponibilidade (9.1 a 9.4)
  {
    arquivo: 'diagnostic',
    titulo: 'Verificar Disponibilidade',
    descricao: 'Checagem de saúde da nuvem AWS, bancos SQL/NoSQL e APIs.',
    subtela: '09'
  },
  {
    arquivo: 'diagnostic-aws',
    titulo: 'Serviços AWS',
    descricao: 'Monitoramento de latência e execução das funções serverless.',
    subtela: '9.1'
  },
  {
    arquivo: 'diagnostic-database',
    titulo: 'Banco de Dados',
    descricao: 'Integridade da conexão com banco relacional e NoSQL.',
    subtela: '9.2'
  },
  {
    arquivo: 'diagnostic-apis',
    titulo: 'APIs e Conectividade',
    descricao: 'Status da conexão à internet e das 3 APIs em cascata.',
    subtela: '9.3'
  },
  {
    arquivo: 'diagnostic-config',
    titulo: 'Configuração de Integrações',
    descricao: 'Ajuste de chaves de integração e tolerância a falhas.',
    subtela: '9.4'
  }
];

// Gerador de Estilo Padrão para src/styles/
function gerarEstilo(nome) {
  return `import { StyleSheet } from 'react-native';

export const estilos${nome} = StyleSheet.create({
  container: {
    flex: 1,
  },
  rolagem: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  cabecalho: {
    marginBottom: 20,
  },
  titulo: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitulo: {
    lineHeight: 20,
  },
  cartaoPrincipal: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  textoInformativo: {
    lineHeight: 22,
    marginBottom: 14,
  },
  areaAcao: {
    marginTop: 8,
    width: '100%',
  },
  campoDigitacao: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    marginBottom: 12,
  },
});
`;
}

// Gerador de Telas Padrão e Especiais (PERDA, Câmera, Dora)
function gerarCodigoTela(item) {
  const nomeClasse = item.arquivo.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  const nomeEstilo = `estilos${nomeClasse}`;

  if (item.customTemplate === 'STOCK_REMOVE') {
    return `// src/app/${item.arquivo}.tsx
import React, { useState } from 'react';
import { Text, View, SafeAreaView, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { ${nomeEstilo} } from '../styles/${item.arquivo}.styles';

export default function ${nomeClasse}Screen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();
  const [motivo, setMotivo] = useState('perda - descarte vencido');
  const [confirmacao, setConfirmacao] = useState('');

  const processarBaixa = () => {
    if (motivo.includes('perda') && confirmacao.trim() !== 'PERDA') {
      Alert.alert(
        'Confirmação Necessária',
        'Para confirmar a baixa por descarte, digite exatamente a palavra PERDA em letras maiúsculas.'
      );
      return;
    }
    Alert.alert(
      'Baixa Concluída',
      'A saída do item foi registrada e auditada com sucesso.',
      [{ text: 'OK', onPress: () => roteador.back() }]
    );
  };

  return (
    <SafeAreaView style={[${nomeEstilo}.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={${nomeEstilo}.rolagem}>
        <View style={${nomeEstilo}.cabecalho}>
          <Text style={[${nomeEstilo}.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela ${item.subtela} - ${item.titulo}
          </Text>
          <Text style={[${nomeEstilo}.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            ${item.descricao}
          </Text>
        </View>

        <View style={[${nomeEstilo}.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.danger }]}>
          <Text style={[${nomeEstilo}.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Atenção: A remoção definitiva de mantimentos exige justificativa formal e trava de proteção contra baixas acidentais.
          </Text>

          <Text style={{ fontWeight: 'bold', color: theme.text, marginBottom: 6 }}>
            Digite "PERDA" para autorizar o descarte:
          </Text>
          <TextInput
            placeholder="Digite PERDA aqui"
            placeholderTextColor={theme.subtext}
            value={confirmacao}
            onChangeText={setConfirmacao}
            autoCapitalize="characters"
            style={[${nomeEstilo}.campoDigitacao, { backgroundColor: theme.background, borderColor: theme.danger, color: theme.text }]}
          />

          <AppButton
            title="Confirmar Baixa do Estoque"
            variant="danger"
            onPress={processarBaixa}
            accessibilityHint="Efetiva a remoção do lote do inventário"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
`;
  }

  if (item.customTemplate === 'STOCK_ADD') {
    return `// src/app/${item.arquivo}.tsx
import React, { useState } from 'react';
import { Text, View, SafeAreaView, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { ${nomeEstilo} } from '../styles/${item.arquivo}.styles';

export default function ${nomeClasse}Screen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();
  const [codigoBarras, setCodigoBarras] = useState('');

  const simularLeituraCamera = () => {
    setCodigoBarras('7891000100103');
    Alert.alert('Código Detectado', 'Código de barras 7891000100103 identificado via câmera com redundância de APIs.');
  };

  const cadastrarEntrada = () => {
    if (!codigoBarras.trim()) {
      Alert.alert('Aviso', 'Aponte a câmera para o código de barras ou digite a sequência numérica.');
      return;
    }
    Alert.alert('Sucesso', 'Entrada de lote registrada com sucesso.', [
      { text: 'Voltar ao Estoque', onPress: () => roteador.back() }
    ]);
  };

  return (
    <SafeAreaView style={[${nomeEstilo}.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={${nomeEstilo}.rolagem}>
        <View style={${nomeEstilo}.cabecalho}>
          <Text style={[${nomeEstilo}.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela ${item.subtela} - ${item.titulo}
          </Text>
          <Text style={[${nomeEstilo}.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            ${item.descricao}
          </Text>
        </View>

        <View style={[${nomeEstilo}.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.secondary }]}>
          <AppButton
            title="📷 Abrir Leitor pela Câmera"
            variant="secondary"
            onPress={simularLeituraCamera}
            accessibilityHint="Ativa a câmera para leitura ótica do código de barras"
          />

          <Text style={{ textAlign: 'center', marginVertical: 12, color: theme.subtext, fontWeight: 'bold' }}>
            OU DIGITE MANUALMENTE
          </Text>

          <TextInput
            placeholder="Ex: 7891000100103"
            placeholderTextColor={theme.subtext}
            keyboardType="numeric"
            value={codigoBarras}
            onChangeText={setCodigoBarras}
            style={[${nomeEstilo}.campoDigitacao, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
          />

          <AppButton
            title="Registrar Novo Lote"
            variant="primary"
            onPress={cadastrarEntrada}
            accessibilityHint="Grava o novo lote no estoque da instituição"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
`;
  }

  if (item.customTemplate === 'DORA') {
    return `// src/app/${item.arquivo}.tsx
import React, { useState } from 'react';
import { Text, View, SafeAreaView, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { ${nomeEstilo} } from '../styles/${item.arquivo}.styles';

export default function ${nomeClasse}Screen() {
  const { theme, tokens, fontScale } = useAppTheme();
  const [mensagem, setMensagem] = useState('');
  const [mensagens, setMensagens] = useState([
    { autor: 'dora', texto: 'Olá! Sou a Dora. Posso consultar o estoque, emitir relatórios ou sugerir receitas com alimentos próximos do vencimento. Como posso ajudar agora?' }
  ]);

  const enviar = () => {
    if (!mensagem.trim()) return;
    const novaMsg = mensagem;
    setMensagem('');
    setMensagens(prev => [
      ...prev,
      { autor: 'usuario', texto: novaMsg },
      { autor: 'dora', texto: \`Entendido! Identifiquei seu pedido sobre "\${novaMsg}". Temos feijão e legumes que vencem em 4 dias. Recomendo preparar uma sopa nutritiva para as crianças!\` }
    ]);
  };

  return (
    <SafeAreaView style={[${nomeEstilo}.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={${nomeEstilo}.rolagem}>
        <View style={${nomeEstilo}.cabecalho}>
          <Text style={[${nomeEstilo}.titulo, { color: tokens.colors.accentAmber500, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela ${item.subtela} - ${item.titulo}
          </Text>
          <Text style={[${nomeEstilo}.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            ${item.descricao}
          </Text>
        </View>

        {mensagens.map((m, idx) => (
          <View
            key={idx}
            style={[
              ${nomeEstilo}.cartaoPrincipal,
              {
                backgroundColor: m.autor === 'dora' ? theme.surface : \`\${theme.primary}15\`,
                borderColor: m.autor === 'dora' ? tokens.colors.accentAmber500 : theme.primary,
                alignSelf: m.autor === 'dora' ? 'flex-start' : 'flex-end',
                width: '90%'
              }
            ]}
          >
            <Text style={{ fontWeight: 'bold', marginBottom: 4, color: m.autor === 'dora' ? tokens.colors.accentAmber500 : theme.primary }}>
              {m.autor === 'dora' ? '💡 Dora' : '👤 Você'}
            </Text>
            <Text style={{ color: theme.text, lineHeight: 20 }}>{m.texto}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: theme.border, flexDirection: 'row', gap: 8 }}>
        <TextInput
          placeholder="Pergunte algo para a Dora..."
          placeholderTextColor={theme.subtext}
          value={mensagem}
          onChangeText={setMensagem}
          style={[${nomeEstilo}.campoDigitacao, { flex: 1, marginBottom: 0, backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
        />
        <TouchableOpacity
          onPress={enviar}
          style={{ backgroundColor: tokens.colors.accentAmber500, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center', minHeight: 48 }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
`;
  }

  // Template Padrão de Apresentação Estrutural
  return `// src/app/${item.arquivo}.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { ${nomeEstilo} } from '../styles/${item.arquivo}.styles';

export default function ${nomeClasse}Screen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[${nomeEstilo}.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={${nomeEstilo}.rolagem}>
        <View style={${nomeEstilo}.cabecalho}>
          <Text style={[${nomeEstilo}.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela ${item.subtela} - ${item.titulo}
          </Text>
          <Text style={[${nomeEstilo}.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            ${item.descricao}
          </Text>
        </View>

        <View style={[${nomeEstilo}.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[${nomeEstilo}.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={${nomeEstilo}.areaAcao}>
            <AppButton
              title="Voltar"
              variant="primary"
              onPress={() => roteador.back()}
              accessibilityHint="Retorna para a tela anterior"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
`;
}

// Execução em Lote
console.log('🚀 Iniciando geração em lote das telas e estilos...');

telas.forEach(item => {
  const nomeClasse = item.arquivo.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  const estiloPath = path.join(stylesDir, `${item.arquivo}.styles.ts`);
  const appPath = path.join(appDir, `${item.arquivo}.tsx`);

  fs.writeFileSync(estiloPath, gerarEstilo(nomeClasse), 'utf-8');
  fs.writeFileSync(appPath, gerarCodigoTela(item), 'utf-8');
  console.log(`✅ Gerada tela e estilo: ${item.arquivo}`);
});

// Atualização do _layout.tsx com todas as rotas tipadas
const rotasLayout = telas.map(t => `        <Stack.Screen name="${t.arquivo}" options={{ title: '${t.titulo}' }} />`).join('\n');

const layoutContent = `// src/app/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useAppTheme } from '../context/ThemeContext';

function RootNavigationLayout() {
  const { theme, mode } = useAppTheme();

  return (
    <>
      <StatusBar style={mode === 'dark' || mode === 'high-contrast' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.primary, // Azul Guardar (#1E3A8A)
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: theme.background,
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Doar & Guardar - Entrada' }} />
        <Stack.Screen name="home" options={{ title: 'Início', headerBackVisible: false }} />
        <Stack.Screen name="profile" options={{ title: 'Meu Perfil' }} />
        <Stack.Screen name="notifications" options={{ title: 'Avisos e Notificações' }} />
        <Stack.Screen name="stock" options={{ title: 'Gerenciamento de Estoque' }} />
${rotasLayout}
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootNavigationLayout />
    </ThemeProvider>
  );
}
`;

fs.writeFileSync(path.join(appDir, '_layout.tsx'), layoutContent, 'utf-8');
console.log('🎉 Todas as rotas foram registradas com sucesso em _layout.tsx!');