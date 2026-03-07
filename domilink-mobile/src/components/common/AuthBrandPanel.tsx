/**
 * AuthBrandPanel — Panel izquierdo de marca para auth en web/desktop.
 * Muestra logo, tagline, features y trust signals sobre fondo indigo.
 */
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';

interface Props {
  role?: 'COMPANY' | 'COURIER' | null;
}

const COMPANY_FEATURES = [
  { icon: 'add-circle-outline' as const,      text: 'Publica pedidos en segundos' },
  { icon: 'navigate-outline' as const,        text: 'Seguimiento en tiempo real' },
  { icon: 'analytics-outline' as const,       text: 'Dashboard de estadísticas' },
  { icon: 'shield-checkmark-outline' as const,text: 'Couriers verificados' },
];

const COURIER_FEATURES = [
  { icon: 'cash-outline' as const,            text: 'Gana dinero con cada entrega' },
  { icon: 'flash-outline' as const,           text: 'Actívate cuando quieras' },
  { icon: 'map-outline' as const,             text: 'Ruta optimizada automáticamente' },
  { icon: 'star-outline' as const,            text: 'Construye tu reputación' },
];

const GENERIC_FEATURES = [
  { icon: 'rocket-outline' as const,          text: 'Plataforma de última generación' },
  { icon: 'shield-checkmark-outline' as const,text: 'Seguro y verificado' },
  { icon: 'flash-outline' as const,           text: 'Entregas en tiempo real' },
  { icon: 'trending-up-outline' as const,     text: 'Crece con nosotros' },
];

export const AuthBrandPanel: React.FC<Props> = ({ role }) => {
  const accent = role === 'COURIER' ? Colors.courier : Colors.company;
  const accentLight = role === 'COURIER' ? Colors.courierLight : Colors.companyLight;
  const features = role === 'COMPANY'
    ? COMPANY_FEATURES
    : role === 'COURIER'
    ? COURIER_FEATURES
    : GENERIC_FEATURES;

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, [role]);

  return (
    <View style={[styles.panel, { backgroundColor: accent }]}>
      {/* Capas decorativas de fondo */}
      <View style={styles.bgOrb1} />
      <View style={styles.bgOrb2} />
      <View style={[styles.bgOrb3, { backgroundColor: role === 'COURIER' ? Colors.courierAccent : Colors.companyAccent }]} />
      <View style={styles.gridLines} />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <View style={styles.logoInner}>
              <Ionicons
                name={role === 'COURIER' ? 'bicycle' : 'business'}
                size={36}
                color={Colors.white}
              />
            </View>
          </View>
          <View style={styles.wordmarkRow}>
            <Text style={styles.wordmark}>Domi</Text>
            <View style={styles.wordmarkPill}>
              <Text style={[styles.wordmarkAccent, { color: accent }]}>Link</Text>
            </View>
          </View>
          <Text style={styles.tagline}>
            {role === 'COMPANY'
              ? 'La plataforma empresarial\npara gestionar tus entregas'
              : role === 'COURIER'
              ? 'Genera ingresos haciendo\nlo que mejor sabes hacer'
              : 'Conecta empresas con\ncouriers certificados'}
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>¿Por qué DomiLink?</Text>
          {features.map((f, i) => (
            <Animated.View
              key={i}
              style={[styles.featureRow, {
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              }]}
            >
              <View style={styles.featureIconBox}>
                <Ionicons name={f.icon} size={18} color={accentLight} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </Animated.View>
          ))}
        </View>

        {/* Stats de confianza */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>500+</Text>
            <Text style={styles.statLabel}>Empresas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>1.2K</Text>
            <Text style={styles.statLabel}>Couriers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>98%</Text>
            <Text style={styles.statLabel}>Satisfacción</Text>
          </View>
        </View>

        {/* Footer del panel */}
        <View style={styles.panelFooter}>
          <View style={styles.securityBadge}>
            <Ionicons name="lock-closed" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={styles.securityText}>Datos cifrados con TLS 1.3</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },

  // Decoraciones de fondo
  bgOrb1: {
    position: 'absolute',
    top: -120, right: -80,
    width: 400, height: 400, borderRadius: 200,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  bgOrb2: {
    position: 'absolute',
    bottom: -80, left: -60,
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  bgOrb3: {
    position: 'absolute',
    top: '35%', right: -100,
    width: 250, height: 250, borderRadius: 125,
    opacity: 0.3,
  },
  gridLines: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.03,
  },

  content: {
    flex: 1,
    padding: 48,
    justifyContent: 'space-between',
  },

  // Logo section
  logoSection: { gap: 14 },
  logoBox: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  logoInner: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  wordmarkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  wordmark: {
    fontSize: 36, fontWeight: '800', color: Colors.white, letterSpacing: -1,
  },
  wordmarkPill: {
    backgroundColor: Colors.white,
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 10,
  },
  wordmarkAccent: {
    fontSize: 36, fontWeight: '800', letterSpacing: -1,
  },
  tagline: {
    ...Typography.h5,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 26,
    fontWeight: '400',
  },

  // Features
  featuresSection: { gap: 12 },
  featuresTitle: {
    ...Typography.overline,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  featureIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: {
    ...Typography.body2,
    color: 'rgba(255,255,255,0.85)',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: {
    fontSize: 22, fontWeight: '800', color: Colors.white, letterSpacing: -0.5,
  },
  statLabel: {
    ...Typography.caption, color: 'rgba(255,255,255,0.6)', marginTop: 2,
  },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Footer
  panelFooter: { alignItems: 'flex-start' },
  securityBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  securityText: {
    ...Typography.caption2, color: 'rgba(255,255,255,0.6)',
  },
});
