import React from 'react';

// Mock react-native with host components compatible with @testing-library/react-native v14
jest.mock('react-native', () => {
  const React = require('react');

  const createHostComponent = (name: string) => {
    const Component = React.forwardRef((props: any, ref: any) =>
      React.createElement(name, { ...props, ref }, props?.children)
    );
    Component.displayName = name;
    return Component;
  };

  const View = createHostComponent('View');
  const Text = createHostComponent('Text');
  const TextInput = createHostComponent('TextInput');
  const Image = createHostComponent('Image');
  const ImageBackground = createHostComponent('View');
  const RefreshControl = createHostComponent('View');
  const ScrollView = createHostComponent('RCTScrollView');
  const ActivityIndicator = createHostComponent('ActivityIndicator');
  const KeyboardAvoidingView = createHostComponent('View');
  const SafeAreaView = createHostComponent('View');

  const Switch = React.forwardRef((props: any, ref: any) => {
    const { onValueChange, value, disabled, ...rest } = props || {};
    return React.createElement('RCTSwitch', {
      ...rest,
      ref,
      value,
      disabled,
      accessibilityRole: 'switch',
      onValueChange,
      onChange: (event: any) => {
        if (!disabled && onValueChange) {
          const nextVal =
            event?.nativeEvent?.value !== undefined ? event.nativeEvent.value : !value;
          onValueChange(nextVal);
        }
      },
      onPress: () => {
        if (!disabled && onValueChange) {
          onValueChange(!value);
        }
      },
    });
  });
  Switch.displayName = 'Switch';

  const Modal = ({ visible = true, children, ...rest }: any) => {
    if (visible === false) return null;
    return React.createElement('Modal', { visible, ...rest }, children);
  };
  Modal.displayName = 'Modal';

  const TouchableOpacity = React.forwardRef((props: any, ref: any) =>
    React.createElement(
      'View',
      {
        accessible: true,
        ...props,
        ref,
      },
      props?.children
    )
  );
  TouchableOpacity.displayName = 'TouchableOpacity';

  const Pressable = React.forwardRef((props: any, ref: any) => {
    const children =
      typeof props?.children === 'function'
        ? props.children({ pressed: false })
        : props?.children;
    return React.createElement(
      'View',
      {
        accessible: true,
        ...props,
        ref,
      },
      children
    );
  });
  Pressable.displayName = 'Pressable';

  const FlatList = ({
    data = [],
    renderItem,
    keyExtractor,
    ListEmptyComponent,
    ListHeaderComponent,
    ListFooterComponent,
    ...rest
  }: any) => {
    const renderNode = (Comp: any) => {
      if (!Comp) return null;
      return typeof Comp === 'function' ? React.createElement(Comp) : Comp;
    };
    return React.createElement(
      'RCTScrollView',
      rest,
      renderNode(ListHeaderComponent),
      data && data.length > 0
        ? data.map((item: any, index: number) =>
            React.createElement(
              React.Fragment,
              { key: keyExtractor ? keyExtractor(item, index) : String(index) },
              renderItem ? renderItem({ item, index, separators: {} }) : null
            )
          )
        : renderNode(ListEmptyComponent),
      renderNode(ListFooterComponent)
    );
  };
  FlatList.displayName = 'FlatList';

  const StyleSheet = {
    create: (styles: any) => styles,
    flatten: (style: any) => {
      if (!style) return {};
      if (Array.isArray(style)) {
        return Object.assign({}, ...style.filter(Boolean).map((s) => StyleSheet.flatten(s)));
      }
      return typeof style === 'object' ? style : {};
    },
    hairlineWidth: 1,
    absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
    absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  };

  const Alert = {
    alert: jest.fn(),
  };

  const Linking = {
    openURL: jest.fn(() => Promise.resolve()),
    canOpenURL: jest.fn(() => Promise.resolve(true)),
  };

  const Platform = {
    OS: 'ios',
    Version: '17.0',
    select: (objs: any) => (objs ? objs.ios ?? objs.default : undefined),
  };

  const Dimensions = {
    get: jest.fn(() => ({ width: 375, height: 812, scale: 2, fontScale: 1 })),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  };

  class AnimatedValue {
    _value: number;
    constructor(val: number) {
      this._value = val;
    }
    setValue(val: number) {
      this._value = val;
    }
    interpolate() {
      return this;
    }
  }

  const createAnim = () => ({
    start: (cb?: (res: { finished: boolean }) => void) => cb && cb({ finished: true }),
    stop: jest.fn(),
    reset: jest.fn(),
  });

  const Animated = {
    Value: AnimatedValue,
    View: createHostComponent('Animated.View'),
    Text: createHostComponent('Animated.Text'),
    ScrollView: createHostComponent('RCTScrollView'),
    timing: jest.fn(() => createAnim()),
    spring: jest.fn(() => createAnim()),
    sequence: jest.fn(() => createAnim()),
    parallel: jest.fn(() => createAnim()),
    loop: jest.fn(() => createAnim()),
    event: jest.fn(() => jest.fn()),
  };

  return {
    View,
    Text,
    TextInput,
    Image,
    ImageBackground,
    RefreshControl,
    ScrollView,
    Switch,
    Modal,
    TouchableOpacity,
    Pressable,
    FlatList,
    ActivityIndicator,
    KeyboardAvoidingView,
    SafeAreaView,
    StyleSheet,
    Alert,
    Linking,
    Platform,
    Dimensions,
    Animated,
    useColorScheme: jest.fn(() => 'light'),
    useWindowDimensions: jest.fn(() => ({ width: 375, height: 812, scale: 2, fontScale: 1 })),
  };
});

// Shared mocks for expo-router
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  setParams: jest.fn(),
  navigate: jest.fn(),
};

export const mockUseLocalSearchParams = jest.fn(() => ({}));
export const mockUsePathname = jest.fn(() => '/home');
export const mockUseSegments = jest.fn(() => ['home']);

jest.mock('expo-router', () => {
  const React = require('react');
  const Stack = ({ children }: any) => React.createElement('View', null, children);
  Stack.Screen = () => null;

  return {
    useRouter: () => mockRouter,
    router: mockRouter,
    useLocalSearchParams: () => mockUseLocalSearchParams(),
    useGlobalSearchParams: () => mockUseLocalSearchParams(),
    usePathname: () => mockUsePathname(),
    useSegments: () => mockUseSegments(),
    Stack,
    Link: ({ children, ...props }: any) => React.createElement('View', props, children),
  };
});

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const createIcon = (family: string) => {
    const Icon = ({ name, testID, ...rest }: any) =>
      React.createElement('Text', { testID: testID || `icon-${name}`, ...rest }, name || family);
    Icon.displayName = family;
    return Icon;
  };
  return {
    Ionicons: createIcon('Ionicons'),
    MaterialIcons: createIcon('MaterialIcons'),
    Feather: createIcon('Feather'),
    FontAwesome: createIcon('FontAwesome'),
    MaterialCommunityIcons: createIcon('MaterialCommunityIcons'),
  };
});

// Mock expo-camera
export const mockUseCameraPermissions = jest.fn(() => [
  { granted: true, canAskAgain: true, status: 'granted' },
  jest.fn(() => Promise.resolve({ granted: true })),
]);

jest.mock('expo-camera', () => {
  const React = require('react');
  return {
    CameraView: ({ onBarcodeScanned, children, ...rest }: any) =>
      React.createElement(
        'View',
        { testID: 'camera-view', onBarcodeScanned, ...rest },
        children
      ),
    useCameraPermissions: () => mockUseCameraPermissions(),
  };
});

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// Mock firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({ name: '[DEFAULT]' })),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({ name: '[DEFAULT]' })),
}));

jest.mock('firebase/auth', () => {
  const mockUser = {
    uid: 'test-uid',
    displayName: 'Colaborador Casa da Criança',
    email: 'admin@doareguardar.org',
    photoURL: null,
    getIdToken: jest.fn(() => Promise.resolve('mock-id-token')),
  };

  class GoogleAuthProvider {
    setCustomParameters = jest.fn();
  }

  return {
    GoogleAuthProvider,
    getAuth: jest.fn(() => ({
      currentUser: mockUser,
      onAuthStateChanged: jest.fn((cb: any) => {
        if (typeof cb === 'function') cb(mockUser);
        return jest.fn();
      }),
    })),
    signInWithPopup: jest.fn(() => Promise.resolve({ user: mockUser })),
    signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: mockUser })),
    createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: mockUser })),
    updateProfile: jest.fn(() => Promise.resolve()),
    signOut: jest.fn(() => Promise.resolve()),
    sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
    onAuthStateChanged: jest.fn((_auth: any, cb: any) => {
      if (typeof cb === 'function') cb(mockUser);
      return jest.fn();
    }),
  };
});

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(() =>
    Promise.resolve({
      exists: () => true,
      data: () => ({ nome: 'Usuário Teste', role: 'admin', email: 'admin@doareguardar.org' }),
    })
  ),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  addDoc: jest.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
}));

// Default global fetch mock
(global as any).fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ sucesso: true, lotes: [], movimentacoes: [], locais: [], usuarios: [], itens: [] }),
    text: () => Promise.resolve(JSON.stringify({ sucesso: true, lotes: [], movimentacoes: [], locais: [], usuarios: [], itens: [] })),
  })
);

beforeEach(() => {
  jest.clearAllMocks();
  (global.fetch as jest.Mock).mockImplementation(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ sucesso: true, lotes: [], movimentacoes: [], locais: [], usuarios: [], itens: [] }),
      text: () => Promise.resolve(JSON.stringify({ sucesso: true, lotes: [], movimentacoes: [], locais: [], usuarios: [], itens: [] })),
    })
  );
  mockUseLocalSearchParams.mockReturnValue({});
  mockUsePathname.mockReturnValue('/home');
});
