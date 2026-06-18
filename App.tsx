import React, {useEffect, useState} from 'react';
import {PermissionsAndroid, Platform, StatusBar, StyleSheet, Text, ActivityIndicator, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNBootSplash from 'react-native-bootsplash';
import {AfinadorScreen} from './src/screens/MainScreen';
import {HerramientasScreen} from './src/screens/HerramientasScreen';
import {ConfiguracionScreen} from './src/screens/ConfiguracionScreen';
import {COLORS} from './src/constants/theme';
import {loadAllExtractedChordPros} from './src/utils/chordProExtractor';

const Tab = createBottomTabNavigator();

const STORAGE_KEYS = {
  PRO_PRECISION: '@armoniax_pro_precision',
  REFERENCE_HZ: '@armoniax_reference_hz',
  NOTATION_SYSTEM: '@armoniax_notation_system',
};

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

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [proPrecision, setProPrecision] = useState(false);
  const [referenceHz, setReferenceHz] = useState(440);
  const [notationSystem, setNotationSystem] = useState<'spanish' | 'english'>('spanish');

  useEffect(() => {
    loadSettings();
    requestMicrophonePermission();
  }, []);

  const loadSettings = async () => {
    try {
      const [savedPrecision, savedHz, savedNotation] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PRO_PRECISION),
        AsyncStorage.getItem(STORAGE_KEYS.REFERENCE_HZ),
        AsyncStorage.getItem(STORAGE_KEYS.NOTATION_SYSTEM),
      ]);

      if (savedPrecision !== null) {
        setProPrecision(savedPrecision === 'true');
      }
      if (savedHz !== null) {
        setReferenceHz(parseInt(savedHz, 10));
      }
      if (savedNotation !== null) {
        setNotationSystem(savedNotation as 'spanish' | 'english');
      }

      await loadAllExtractedChordPros();
    } catch (error) {
      console.warn('Error loading settings:', error);
    } finally {
      setIsLoading(false);
      RNBootSplash.hide({fade: true});
    }
  };

  const handleProPrecisionChange = async (value: boolean) => {
    setProPrecision(value);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PRO_PRECISION, value.toString());
    } catch (error) {
      console.warn('Error saving proPrecision:', error);
    }
  };

  const handleReferenceHzChange = async (value: number) => {
    setReferenceHz(value);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REFERENCE_HZ, value.toString());
    } catch (error) {
      console.warn('Error saving referenceHz:', error);
    }
  };

  const handleNotationSystemChange = async (value: 'spanish' | 'english') => {
    setNotationSystem(value);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTATION_SYSTEM, value);
    } catch (error) {
      console.warn('Error saving notationSystem:', error);
    }
  };

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
            options={{
              tabBarLabel: 'Afinar',
              tabBarIcon: ({color}) => (
                <Text style={{fontSize: 25, color}}>♪</Text>
              ),
            }}>
            {() => (
              <AfinadorScreen
                proPrecision={proPrecision}
                referenceHz={referenceHz}
                notationSystem={notationSystem}
              />
            )}
          </Tab.Screen>
          <Tab.Screen
            name="Configuracion"
            options={{
              tabBarLabel: 'Configuración',
              tabBarIcon: ({color}) => (
                <Text style={{fontSize: 25, color}}>⚙</Text>
              ),
            }}>
            {() => (
              <ConfiguracionScreen
                proPrecision={proPrecision}
                onProPrecisionChange={handleProPrecisionChange}
                referenceHz={referenceHz}
                onReferenceHzChange={handleReferenceHzChange}
                notationSystem={notationSystem}
                onNotationSystemChange={handleNotationSystemChange}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

export default App;
