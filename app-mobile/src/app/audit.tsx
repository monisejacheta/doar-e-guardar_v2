// src/app/audit.tsx
import React, { useState } from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppInput } from '../components/common/AppInput';
import { estilosAudit } from '../styles/audit.styles';

export default function AuditScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();
  const [filtro, setFiltro] = useState('');

  const registrosAuditoria = [
    {
      id: 'LOG-904',
      acao: 'Entrada de Lote (Câmera)',
      produto: 'Leite Integral UHT 1L (12 pcts)',
      usuario: 'Laura Brianti (Operadora)',
      dataHora: 'Hoje, 14:20',
      cor: theme.secondary,
    },
    {
      id: 'LOG-903',
      acao: 'Baixa por Descarte (Trava PERDA)',
      produto: 'Iogurte Natural (2 unid - Vencido)',
      usuario: 'Daniel Soares (Admin)',
      dataHora: 'Hoje, 11:05',
      cor: theme.danger,
    },
    {
      id: 'LOG-902',
      acao: 'Saída - Movimentação Estoque',
      produto: 'Arroz Tipo 1 (Armário A ➔ Armário B)',
      usuario: 'Juliano Mancini (Voluntário)',
      dataHora: 'Ontem, 16:40',
      cor: theme.primary,
    },
  ];

  const filtrados = registrosAuditoria.filter(
    (r) =>
      r.produto.toLowerCase().includes(filtro.toLowerCase()) ||
      r.usuario.toLowerCase().includes(filtro.toLowerCase()) ||
      r.acao.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <SafeAreaView style={[estilosAudit.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosAudit.rolagem}>
        <View style={estilosAudit.cabecalho}>
          <Text style={[estilosAudit.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Histórico e Auditoria
          </Text>
          <Text style={[estilosAudit.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Rastreabilidade completa de entradas, baixas e transferências realizadas no estoque.
          </Text>
        </View>

        {/* Atalhos das Subtelas 7.1 a 7.4 */}
        <View style={estilosAudit.gradeAtalhos}>
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            onPress={() => roteador.push('/audit-user')}
            style={[estilosAudit.botaoAtalho, { backgroundColor: theme.surface, borderColor: theme.primary }]}
          >
            <Text style={{ fontWeight: 'bold', color: theme.primary, fontSize: 13 * fontScale }}>7.1 Por Usuário</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            onPress={() => roteador.push('/audit-product')}
            style={[estilosAudit.botaoAtalho, { backgroundColor: theme.surface, borderColor: theme.primary }]}
          >
            <Text style={{ fontWeight: 'bold', color: theme.primary, fontSize: 13 * fontScale }}>7.2 Por Produto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            onPress={() => roteador.push('/audit-period')}
            style={[estilosAudit.botaoAtalho, { backgroundColor: theme.surface, borderColor: theme.primary }]}
          >
            <Text style={{ fontWeight: 'bold', color: theme.primary, fontSize: 13 * fontScale }}>7.3 Por Período</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            onPress={() => roteador.push('/audit-export')}
            style={[estilosAudit.botaoAtalho, { backgroundColor: theme.surface, borderColor: theme.secondary }]}
          >
            <Text style={{ fontWeight: 'bold', color: theme.secondary, fontSize: 13 * fontScale }}>7.4 Exportar PDF</Text>
          </TouchableOpacity>
        </View>

        <AppInput
          rotulo="Pesquisar no histórico"
          placeholder="Buscar por colaborador, alimento ou ação..."
          value={filtro}
          onChangeText={setFiltro}
        />

        {filtrados.map((item) => (
          <View
            key={item.id}
            style={[estilosAudit.cartaoLog, { backgroundColor: theme.surface, borderColor: item.cor }]}
          >
            <View style={estilosAudit.topoLog}>
              <Text style={{ fontWeight: 'bold', color: item.cor, fontSize: 13 * fontScale }}>
                {item.acao}
              </Text>
              <Text style={{ color: theme.subtext, fontSize: 11 * fontScale }}>{item.dataHora}</Text>
            </View>
            <Text style={{ color: theme.text, fontWeight: '600', marginBottom: 4, fontSize: 14 * fontScale }}>
              {item.produto}
            </Text>
            <Text style={{ color: theme.subtext, fontSize: 12 * fontScale }}>
              Responsável: {item.usuario} • Registro #{item.id}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}