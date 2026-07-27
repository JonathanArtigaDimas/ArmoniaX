/**
 * theme.ts - Tokens de diseño global de ArmoniaX
 *
 * Paleta de colores oscura para la aplicación. Todos los componentes
 * importan estos tokens para mantener consistencia visual.
 * Tema principal: fondo oscuro (#121212) con acentos verdes (#00E676).
 */
export const COLORS = {
  /** Fondo principal de la app (negro suave) */
  background: '#121212',
  /** Superficies de cards, paneles y contenedores */
  surface: '#1E1E1E',
  /** Superficies elevadas o hover states */
  surfaceLight: '#2A2A2A',
  /** Superficies activas/seleccionadas (verde oscuro) */
  surfaceActive: '#1A3D2A',
  /** Texto principal (blanco puro) */
  text: '#FFFFFF',
  /** Texto secundario, labels, hints (gris claro) */
  textSecondary: '#B0B0B0',
  /** Color de acento principal - verde brillante (botones, indicadores activos) */
  accent: '#00E676',
  /** Variante oscura del acento para fondos de estado */
  accentDark: '#0D3D20',
  /** Color de advertencia - naranja (tempo, cejillas) */
  warning: '#FF9100',
  /** Variante oscura de advertencia para fondos */
  warningDark: '#3D2E0D',
  /** Color de error - rojo (cuerdas muteadas, acordes difíciles) */
  error: '#FF5252',
  /** Variante oscura de error para fondos */
  errorDark: '#3D0D0D',
  /** Bordes de contenedores y separadores */
  border: '#333333',
};

/**
 * Sistema de espaciado consistente.
 * Usado en estilos de todos los componentes para mantener
 * ritmo visual uniforme en la aplicación.
 */
export const SPACING = {
  xs: 4,      // Espaciado mínimo (íconos inline, gaps tiny)
  sm: 8,      // Espaciado pequeño (gaps entre elementos cercanos)
  md: 12,     // Espaciado medio (gaps de fila, padding interno)
  lg: 16,     // Espaciado estándar (padding de cards, márgenes)
  xl: 20,     // Espaciado grande (padding de pantalla)
  xxl: 28,    // Espaciado extra (gap entre secciones)
  xxxl: 32,   // Espaciado máximo (márgenes de títulos)
  sectionGap: 28,       // Gap entre secciones principales
  buttonGap: 10,        // Gap entre botones apilados
  screenPadding: 20,    // Padding horizontal de pantallas
  screenPaddingBottom: 40, // Padding inferior para scroll
};

/**
 * Estilos de tipografía predefinidos.
 * Se aplican via spread operator: { ...FONTS.noteLarge }
 */
export const FONTS = {
  /** Nota musical grande - display principal del afinador (96px, bold) */
  noteLarge: {
    fontSize: 96,
    fontWeight: '700' as const,
    fontFamily: 'System',
  },
  /** Labels de secciones y controles (14px, medium) */
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    fontFamily: 'System',
  },
  /** Indicador de cents del afinador (20px, semibold) */
  cents: {
    fontSize: 20,
    fontWeight: '600' as const,
    fontFamily: 'System',
  },
};
