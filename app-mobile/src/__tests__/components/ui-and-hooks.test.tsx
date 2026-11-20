import React from 'react';
import { Text } from 'react-native';
import { fireEvent, renderWithTheme } from '../test-utils';
import { AnimatedIcon, AnimatedSplashOverlay } from '../../components/animated-icon';
import { AnimatedIcon as WebAnimatedIcon, AnimatedSplashOverlay as WebAnimatedSplashOverlay } from '../../components/animated-icon.web';
import AppTabs from '../../components/app-tabs';
import WebAppTabs, { CustomTabList, TabButton } from '../../components/app-tabs.web';
import { ExternalLink } from '../../components/external-link';
import { HintRow } from '../../components/hint-row';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { WebBadge } from '../../components/web-badge';
import { Collapsible } from '../../components/ui/collapsible';
import { useTheme } from '../../hooks/use-theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useColorScheme as useColorSchemeWeb } from '../../hooks/use-color-scheme.web';

function HooksSample() {
  const t = useTheme();
  const c = useColorScheme();
  const cw = useColorSchemeWeb();
  return <Text testID="hook-info">{`${t.text}|${c}|${cw}`}</Text>;
}

describe('Componentes Expo/UI e Hooks (src/components/ e src/hooks/)', () => {
  it('deve renderizar AnimatedIcon, WebBadge, HintRow, ExternalLink, ThemedText, ThemedView, Collapsible e AppTabs', async () => {
    const { getByText, getByTestId, queryByText } = await renderWithTheme(
      <>
        <AnimatedSplashOverlay />
        <AnimatedIcon />
        <WebAnimatedSplashOverlay />
        <WebAnimatedIcon />
        <AppTabs />
        <WebAppTabs />
        <CustomTabList>
          <TabButton isFocused={true}>TabAtiva</TabButton>
        </CustomTabList>
        <ExternalLink href="https://example.com">
          <Text>LinkExterno</Text>
        </ExternalLink>
        <HintRow title="Dica" hint="src/app/home.tsx" />
        <ThemedText type="title">Titulo</ThemedText>
        <ThemedView type="backgroundElement">
          <Text>Box</Text>
        </ThemedView>
        <WebBadge />
        <Collapsible title="Seção Expandível">
          <Text>Conteúdo Oculto</Text>
        </Collapsible>
        <HooksSample />
      </>
    );

    expect(getByText('Titulo')).toBeTruthy();
    expect(getByText('Dica')).toBeTruthy();
    expect(getByTestId('hook-info')).toBeTruthy();
    expect(queryByText('Conteúdo Oculto')).toBeNull();

    await fireEvent.press(getByText('Seção Expandível'));
    expect(getByText('Conteúdo Oculto')).toBeTruthy();

    await fireEvent.press(getByText('LinkExterno'));
  });
});
