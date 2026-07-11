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

function AppContent() {
  const {isLoading} = useSettings();

  useEffect(() => {
    requestMicrophonePermission();
    loadAllExtractedChordPros();
  }, []);

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
