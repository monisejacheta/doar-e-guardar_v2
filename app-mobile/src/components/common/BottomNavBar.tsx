// src/components/common/BottomNavBar.tsx
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Modal, StyleSheet, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';

export function BottomNavBar() {
  const roteador = useRouter();
  const rotaAtual = usePathname();
  const { theme, fontScale } = useAppTheme();
  
  // Estado para controlar o modal do Menu Hambúrguer
  const [menuAberto, setMenuAberto] = useState(false);

  // Esconde o menu na tela de Login (rota raiz '/')
  if (rotaAtual === '/') {
    return null;
  }

  const navegarPara = (rota: string) => {
    setMenuAberto(false);
    roteador.push(rota as any);
  };

  // Itens da barra inferior principal
  const widgetsPrincipais = [
    { nome: 'Início', icone: 'home', rota: '/home', corTexto: '#3B82F6', corFundo: '#EFF6FF' }, // Azul Pastel
    { nome: 'Estoque', icone: 'box', rota: '/stock', corTexto: '#10B981', corFundo: '#ECFDF5' }, // Verde Pastel
    { nome: 'Dora IA', icone: 'smile', rota: '/dora', corTexto: '#F59E0B', corFundo: '#FFFBEB' }, // Âmbar Pastel (Rosto humano/robô)
    { nome: 'Avisos', icone: 'bell', rota: '/notifications', corTexto: '#8B5CF6', corFundo: '#F5F3FF' }, // Lilás/Lavanda Pastel
  ];

  // Itens do Menu Hambúrguer (Mais opções)
  const widgetsExtras = [
    { nome: 'Meu Perfil', icone: 'user', rota: '/profile', corTexto: '#8B5CF6', corFundo: '#F5F3FF' }, // Lavanda
    { nome: 'Relatórios', icone: 'bar-chart-2', rota: '/reports', corTexto: '#EF4444', corFundo: '#FEF2F2' }, // Pêssego/Salmão
    { nome: 'Auditoria', icone: 'clipboard', rota: '/audit', corTexto: '#14B8A6', corFundo: '#F0FDFA' }, // Menta
    { nome: 'Ajustes', icone: 'settings', rota: '/settings', corTexto: '#64748B', corFundo: '#F8FAFC' }, // Cinza Azulado
    { nome: 'Sistema', icone: 'activity', rota: '/diagnostic', corTexto: '#F59E0B', corFundo: '#FFFBEB' }, // Baunilha
  ];

  return (
    <>
      <View style={[estilos.barraInferior, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        
        {/* Renderiza os 4 botões principais */}
        {widgetsPrincipais.map((widget, idx) => {
          const ativo = rotaAtual === widget.rota;
          const corIcone = ativo ? widget.corTexto : theme.subtext;
          const bgIcone = ativo ? widget.corFundo : 'transparent';

          return (
            <TouchableOpacity
              key={idx}
              onPress={() => navegarPara(widget.rota)}
              style={[estilos.botaoNav, { backgroundColor: bgIcone }]}
            >
              <Feather name={widget.icone as any} size={20} color={corIcone} style={{ marginBottom: 2 }} />
              <Text style={[estilos.textoNav, { color: corIcone, fontSize: 10 * fontScale, fontWeight: ativo ? 'bold' : '600' }]}>
                {widget.nome}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Botão do Menu Hambúrguer (Mais) */}
        <TouchableOpacity
          onPress={() => setMenuAberto(true)}
          style={estilos.botaoNav}
        >
          <Feather name="menu" size={22} color={theme.subtext} style={{ marginBottom: 2 }} />
          <Text style={[estilos.textoNav, { color: theme.subtext, fontSize: 10 * fontScale }]}>
            Mais
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODAL DO MENU HAMBÚRGUER */}
      <Modal
        visible={menuAberto}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuAberto(false)}
      >
        <Pressable style={estilos.modalOverlay} onPress={() => setMenuAberto(false)}>
          <View style={[estilos.modalConteudo, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={estilos.modalCabecalho}>
              <Text style={[estilos.modalTitulo, { color: theme.text, fontSize: 16 * fontScale }]}>Mais Opções</Text>
              <TouchableOpacity onPress={() => setMenuAberto(false)} style={estilos.botaoFechar}>
                <Feather name="x" size={22} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            <View style={estilos.gradeExtras}>
              {widgetsExtras.map((widget, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => navegarPara(widget.rota)}
                  style={[estilos.botaoExtra, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <View style={[estilos.iconeExtraWrapper, { backgroundColor: widget.corFundo }]}>
                    <Feather name={widget.icone as any} size={22} color={widget.corTexto} />
                  </View>
                  <Text style={[estilos.textoExtra, { color: theme.text, fontSize: 12 * fontScale }]}>
                    {widget.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const estilos = StyleSheet.create({
  barraInferior: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 6,
    paddingTop: 6,
    paddingHorizontal: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  botaoNav: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
    height: 52,
    borderRadius: 14,
  },
  textoNav: {
    fontWeight: '600',
    marginTop: 2,
  },
  
  // Estilos do Modal (Hambúrguer)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalConteudo: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    padding: 24,
    paddingBottom: 40,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  modalCabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitulo: {
    fontWeight: 'bold',
  },
  botaoFechar: {
    padding: 4,
  },
  gradeExtras: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  botaoExtra: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 14,
  },
  iconeExtraWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textoExtra: {
    fontWeight: '600',
    flex: 1,
  }
});