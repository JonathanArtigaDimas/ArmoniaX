import React, {createContext, useContext, useState, useEffect, useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  PRO_PRECISION: '@armoniax_pro_precision',
  REFERENCE_HZ: '@armoniax_reference_hz',
  NOTATION_SYSTEM: '@armoniax_notation_system',
} as const;

interface SettingsContextValue {
  proPrecision: boolean;
  referenceHz: number;
  notationSystem: 'spanish' | 'english';
  isLoading: boolean;
  setProPrecision: (value: boolean) => void;
  setReferenceHz: (value: number) => void;
  setNotationSystem: (value: 'spanish' | 'english') => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const SettingsProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [proPrecision, setProPrecisionState] = useState(false);
  const [referenceHz, setReferenceHzState] = useState(440);
  const [notationSystem, setNotationSystemState] = useState<'spanish' | 'english'>('spanish');
  const [isLoading, setIsLoading] = useState(true);

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

  const setProPrecision = useCallback(async (value: boolean) => {
    setProPrecisionState(value);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PRO_PRECISION, value.toString());
    } catch (error) {
      console.warn('Error saving proPrecision:', error);
    }
  }, []);

  const setReferenceHz = useCallback(async (value: number) => {
    setReferenceHzState(value);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REFERENCE_HZ, value.toString());
    } catch (error) {
      console.warn('Error saving referenceHz:', error);
    }
  }, []);

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

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
