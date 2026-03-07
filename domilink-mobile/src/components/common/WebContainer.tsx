/**
 * WebContainer — Envuelve el contenido de las pantallas principales en PC
 * para centrarlo con un ancho máximo, evitando el estirado al 100% del viewport.
 * En móvil simplemente pasa los hijos sin modificar.
 */
import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { Colors } from '../../theme/colors';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Ancho máximo del contenido centrado. Por defecto 900 */
  maxWidth?: number;
  /** Si el contenido es scrollable desde aquí */
  scrollable?: boolean;
}

export const WebContainer: React.FC<Props> = ({
  children, style, maxWidth = 900, scrollable = false,
}) => {
  const { isLarge } = useBreakpoint();

  if (!isLarge) {
    // Móvil: sin cambios
    return <>{children}</>;
  }

  const inner = (
    <View style={[styles.inner, { maxWidth }, style]}>
      {children}
    </View>
  );

  if (scrollable) {
    return (
      <View style={styles.webOuter}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {inner}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.webOuter}>
      {inner}
    </View>
  );
};

/**
 * WebContentArea — sidebar-aware layout para dashboards en PC.
 * Muestra un sidebar izquierdo de navegación + área de contenido principal.
 */
interface DashboardLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  sidebarWidth?: number;
}

export const WebDashboardLayout: React.FC<DashboardLayoutProps> = ({
  sidebar, children, sidebarWidth = 280,
}) => {
  const { isLarge } = useBreakpoint();

  if (!isLarge) return <>{children}</>;

  return (
    <View style={styles.dashRoot}>
      <View style={[styles.sidebar, { width: sidebarWidth }]}>
        {sidebar}
      </View>
      <View style={styles.dashMain}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  webOuter: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  scrollContent: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 40,
  },
  inner: {
    width: '100%',
    alignSelf: 'center',
  },

  dashRoot: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.background,
  },
  sidebar: {
    backgroundColor: Colors.white,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  dashMain: {
    flex: 1,
    overflow: 'hidden',
  },
});
