/**
 * SettingsContext.tsx - Estado global de configuración de la app
 *
 * Proporciona un Context de React para manejar la configuración
 * que persiste entre sesiones de la app.
 *
 * Configuraciones manejadas:
 * - proPrecision: Modo de precisión profesional (tolerancia de 3 cents vs 10)
 * - referenceHz: Frecuencia de referencia (415-466 Hz, default 440)
 * - notationSystem: Sistema de notación ('spanish' | 'english')
 *
 * Todas las configuraciones se persisten en AsyncStorage y se cargan
 * al inicio de la app. Los cambios se guardan inmediatamente.
 *
 * Uso:
 *   const { proPrecision, setProPrecision } = useSettings();
 */
import React, {createContext, useContext, useState, useEffect, useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Claves de AsyncStorage para cada configuración */
const STORAGE_KEYS = {
  PRO_PRECISION: '@armoniax_pro_precision',
  REFERENCE_HZ: '@armoniax_reference_hz',
  NOTATION_SYSTEM: '@armoniax_notation_system',
} as const;

/** Tipo del contexto de configuración - todas las propiedades y funciones disponibles */
interface SettingsContextValue {
  /** Si está activo el modo de precisión profesional (tolerancia de 3 cents) */
  proPrecision: boolean;
  /** Frecuencia de referencia en Hz (rango 415-466, default 440) */
  referenceHz: number;
  /** Sistema de notación activo ('spanish' = Do-Re-Mi, 'english' = C-D-E) */
  notationSystem: 'spanish' | 'english';
  /** Si la configuración está cargándose desde AsyncStorage */
  isLoading: boolean;
  /** Activa/desactiva precisión profesional */
  setProPrecision: (value: boolean) => void;
  /** Cambia la frecuencia de referencia */
  setReferenceHz: (value: number) => void;
  /** Cambia el sistema de notación */
  setNotationSystem: (value: 'spanish' | 'english') => void;
}

/** Context de React para la configuración (inicialmente null) */
const SettingsContext = createContext<SettingsContextValue | null>(null);

/**
 * Provider de configuración que envuelve toda la app.
 * Carga valores guardados al montar y guarda cambios automáticamente.
 */
export const SettingsProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [proPrecision, setProPrecisionState] = useState(false);
  const [referenceHz, setReferenceHzState] = useState(440);
  const [notationSystem, setNotationSystemState] = useState<'spanish' | 'english'>('spanish');
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Efecto de inicialización: carga las configuraciones guardadas de AsyncStorage.
   * Se ejecuta una vez al montar el Provider.
   * Usa Promise.all para cargar las 3 configuraciones en paralelo.
   * Finalmente marca isLoading = false para ocultar el splash screen.
   */
  useEffect(() => {
    (async () => {
      try {
        const [savedPrecision, savedHz, savedNotation] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.PRO_PRECISION),
          AsyncStorage.getItem(STORAGE_KEYS.REFERENCE_HZ),
          AsyncStorage.getItem(STORAGE_KEYS.NOTATION_SYSTEM),
        ]);

        if (savedPrecision !== null) {
          setProPrecisionState(savedPrecision === 'true');
        }
        if (savedHz !== null) {
          setReferenceHzState(parseInt(savedHz, 10));
        }
        if (savedNotation !== null) {
          setNotationSystemState(savedNotation as 'spanish' | 'english');
        }
      } catch (error) {
        console.warn('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  /**
   * Cambia la precisión profesional y la guarda en AsyncStorage.
   * true = tolerancia de 3 cents (para músicos profesionales)
   * false = tolerancia de 10 cents (para uso general)
   */
  const setProPrecision = useCallback(async (value: boolean) => {
    setProPrecisionState(value);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PRO_PRECISION, value.toString());
    } catch (error) {
      console.warn('Error saving proPrecision:', error);
    }
  }, []);

  /**
   * Cambia la frecuencia de referencia y la guarda en AsyncStorage.
   * Default: 440 Hz (La4 = estándar internacional)
   * Rango: 415-466 Hz (para música barroca, etc.)
   */
  const setReferenceHz = useCallback(async (value: number) => {
    setReferenceHzState(value);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REFERENCE_HZ, value.toString());
    } catch (error) {
      console.warn('Error saving referenceHz:', error);
    }
  }, []);

  /**
   * Cambia el sistema de notación y lo guarda en AsyncStorage.
   * 'spanish' = Do, Re, Mi, Fa, Sol, La, Si
   * 'english' = C, D, E, F, G, A, B
   */
  const setNotationSystem = useCallback(async (value: 'spanish' | 'english') => {
    setNotationSystemState(value);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTATION_SYSTEM, value);
    } catch (error) {
      console.warn('Error saving notationSystem:', error);
    }
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        proPrecision,
        referenceHz,
        notationSystem,
        isLoading,
        setProPrecision,
        setReferenceHz,
        setNotationSystem,
      }}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * Hook personalizado para acceder a la configuración de la app.
 * Debe usarse dentro de un SettingsProvider.
 *
 * @throws Error si se usa fuera del SettingsProvider
 * @returns Todas las configuraciones y funciones de cambio
 *
 * Ejemplo:
 *   const { proPrecision, referenceHz, setReferenceHz } = useSettings();
 */
export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
