/**
 * App.tsx - Entry point y configuración de navegación de ArmoniaX
 *
 * ArmoniaX es una aplicación de React Native para músicos de iglesia.
 * Proporciona herramientas para afinar instrumentos, ver acordes y cantos.
 *
 * Estructura de la app:
 * 1. SettingsProvider: Context global de configuración
 * 2. AppContent: Lógica de inicialización y splash screen
 * 3. Tab.Navigator: 3 pestañas principales
 *    - Herramientas: metrónomo, biblioteca, transportador, cantos, carpetas
 *    - Afinar: afinador en tiempo real con micrófono
 *    - Configuración: opciones generales y copia de seguridad
 *
 * Inicialización:
 * 1. Se solicita permiso de micrófono (Android)
 * 2. Se cargan ChordPro extraídos del caché
 * 3. Se carga la configuración desde AsyncStorage
 * 4. Se oculta el splash screen con fade
 *
 * Navegación:
 * - Bottom Tab Navigator con 3 pestañas
 * - Las sub-herramientas se abren como modales (no tabs anidados)
 * - Lazy loading de herramientas con React.lazy
 */
import React, {useEffect} from 'react';
import {PermissionsAndroid, Platform, StatusBar, StyleSheet, Text, ActivityIndicator, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import RNBootSplash from 'react-native-bootsplash';
import {SettingsProvider, useSettings} from './src/contexts/SettingsContext';
import {AfinadorScreen} from './src/screens/MainScreen';
import {HerramientasScreen} from './src/screens/HerramientasScreen';
import {ConfiguracionScreen} from './src/screens/ConfiguracionScreen';
import {COLORS} from './src/constants/theme';
import {loadAllExtractedChordPros} from './src/utils/chordProExtractor';

const Tab = createBottomTabNavigator();

/**
 * Solicita permiso de micrófono en Android.
 * Necesario para que el afinador funcione.
 * En iOS se solicita automáticamente al usar el micrófono.
 */
async function requestMicrophonePermission() {
  if (Platform.OS !== 'android') return;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Permiso de Micrófono',
        message: 'ArmoniaX necesita acceso al micrófono para detectar la armonía ambiental.',
        buttonPositive: 'Aceptar',
        buttonNegative: 'Cancelar',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(err);
    return false;
  }
}

/**
 * Contenido principal de la app (dentro del SettingsProvider).
 * Maneja la inicialización y el splash screen.
 */
function AppContent() {
  const {isLoading} = useSettings();

  /**
   * Efecto de inicialización:
   * 1. Solicita permiso de micrófono (Android)
   * 2. Carga todos los ChordPro extraídos al caché de memoria
   */
  useEffect(() => {
    requestMicrophonePermission();
    loadAllExtractedChordPros();
  }, []);

  /**
   * Efecto para ocultar el splash screen cuando la configuración termina de cargar.
   * Se oculta con animación fade para una transición suave.
   */
  useEffect(() => {
    if (!isLoading) {
      RNBootSplash.hide({fade: true});
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName="Afinar"
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: COLORS.surface,
              borderTopColor: COLORS.border,
              borderTopWidth: 1,
              height: 70,
              paddingBottom: 15,
              paddingTop: 2,
            },
            tabBarActiveTintColor: COLORS.accent,
            tabBarInactiveTintColor: COLORS.textSecondary,
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
            },
          }}>
          <Tab.Screen
            name="Herramientas"
            component={HerramientasScreen}
            options={{
              tabBarLabel: 'Herramientas',
              tabBarIcon: ({color}) => (
                <Text style={{fontSize: 25, color}}>⚒</Text>
              ),
            }}
          />
          <Tab.Screen
            name="Afinar"
            component={AfinadorScreen}
            options={{
              tabBarLabel: 'Afinar',
              tabBarIcon: ({color}) => (
                <Text style={{fontSize: 25, color}}>♪</Text>
              ),
            }}
          />
          <Tab.Screen
            name="Configuracion"
            component={ConfiguracionScreen}
            options={{
              tabBarLabel: 'Configuración',
              tabBarIcon: ({color}) => (
                <Text style={{fontSize: 25, color}}>⚙</Text>
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

/**
 * Componente raíz de la app.
 * Envuelve todo en SettingsProvider para tener acceso global a configuración.
 */
function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

export default App;
