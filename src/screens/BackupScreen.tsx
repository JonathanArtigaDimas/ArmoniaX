/**
 * BackupScreen.tsx - Pantalla de copia de seguridad
 *
 * Permite exportar e importar todos los datos de la app como archivo JSON.
 *
 * Contenido del backup:
 * - Cantos personalizados y carpetas
 * - Notas por canto
 * - ChordPro extraídos desde PDF
 * - Configuración (precisión, Hz, notación)
 * - Sugerencias de capo guardadas
 *
 * Exportación:
 * 1. Recopila todas las claves de AsyncStorage
 * 2. Crea archivo JSON con metadatos
 * 3. Abre sheet de compartir nativo
 * 4. Usuario puede guardar o enviar por WhatsApp/email
 *
 * Importación:
 * 1. Abre picker de documentos (solo .json)
 * 2. Valida que sea backup de ArmoniaX
 * 3. Pide confirmación (reemplaza toda la data)
 * 4. Reemplaza claves en AsyncStorage
 *
 * Usado como modal desde ConfiguracionScreen.
 */
import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {COLORS} from '../constants/theme';
import {exportBackup, importBackup} from '../utils/backupStorage';

interface BackupScreenProps {
  onClose: () => void;
}

/**
 * Pantalla de copia de seguridad.
 * Exporta/importa toda la data de la app como JSON.
 */
export const BackupScreen: React.FC<BackupScreenProps> = ({onClose}) => {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportBackup();
    } catch (error: any) {
      if (error?.code !== 'SHARE_CANCELLED') {
        Alert.alert('Error', error?.message || 'Error al crear la copia');
      }
    } finally {
      setExporting(false);
    }
  };

  const handleImport = () => {
    Alert.alert(
      'Restaurar copia',
      'Se reemplazará toda la data actual (cantos, carpetas, notas y configuración). ¿Continuar?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: doImport,
        },
      ],
    );
  };

  const doImport = async () => {
    setImporting(true);
    try {
      const result = await importBackup();
      if (result.success) {
        Alert.alert('Listo', result.message, [{text: 'OK', onPress: onClose}]);
      } else if (result.message !== 'Cancelado') {
        Alert.alert('Error', result.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Error al restaurar');
    } finally {
      setImporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityLabel="Volver a configuración" accessibilityRole="button">
          <Text style={styles.closeText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Copia de seguridad</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            La copia de seguridad incluye:{'\n\n'}• Cantos y carpetas{'\n'}•
            Notas por canto{'\n'}• Configuración de la app
          </Text>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.7}
          onPress={handleExport}
          disabled={exporting || importing}
          accessibilityLabel="Crear copia de seguridad"
          accessibilityRole="button"
          accessibilityState={{disabled: exporting || importing}}>
          {exporting ? (
            <ActivityIndicator size="small" color={COLORS.background} />
          ) : (
            <>
              <Text style={styles.actionIcon}>📤</Text>
              <View style={styles.actionTexts}>
                <Text style={styles.actionTitle}>Crear copia</Text>
                <Text style={styles.actionSub}>
                  Guarda y comparte tu respaldo
                </Text>
              </View>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          activeOpacity={0.7}
          onPress={handleImport}
          disabled={exporting || importing}
          accessibilityLabel="Restaurar copia de seguridad"
          accessibilityRole="button"
          accessibilityState={{disabled: exporting || importing}}>
          {importing ? (
            <ActivityIndicator size="small" color={COLORS.accent} />
          ) : (
            <>
              <Text style={styles.actionIcon}>📥</Text>
              <View style={styles.actionTexts}>
                <Text style={styles.actionTitleSecondary}>
                  Restaurar copia
                </Text>
                <Text style={styles.actionSubSecondary}>
                  Importa un respaldo anterior
                </Text>
              </View>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: COLORS.textSecondary,
    fontSize: 18,
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  infoBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 28,
  },
  infoText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  actionButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    padding: 20,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionButtonSecondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIcon: {
    fontSize: 28,
  },
  actionTexts: {
    flex: 1,
  },
  actionTitle: {
    color: COLORS.background,
    fontSize: 17,
    fontWeight: '700',
  },
  actionSub: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.7,
    marginTop: 2,
  },
  actionTitleSecondary: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
  },
  actionSubSecondary: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
});
