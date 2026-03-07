import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Dimensions, Animated, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { AuthBrandPanel } from '../../components/common/AuthBrandPanel';

const { width, height } = Dimensions.get('window');

export const WelcomeScreen = ({ navigation }: any) => {
  const { isLarge } = useBreakpoint();

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const cardAnim1 = useRef(new Animated.Value(50)).current;
  const cardAnim2 = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.stagger(120, [
        Animated.spring(cardAnim1, { toValue: 0, tension: 70, friction: 9, useNativeDriver: true }),
        Animated.spring(cardAnim2, { toValue: 0, tension: 70, friction: 9, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── LAYOUT WEB / DESKTOP ──────────────────────────────────────
  if (isLarge) {
    return (
      <View style={styles.webRoot}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.companyDeep} />

        {/* Panel izquierdo de marca */}
        <View style={styles.webLeft}>
          <AuthBrandPanel role={null} />
        </View>

        {/* Panel derecho: selección de rol */}
        <View style={styles.webRight}>
          <ScrollView
            contentContainerStyle={styles.webRightContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              {/* Header pequeño */}
              <View style={styles.webHeader}>
                <View style={styles.webLogoSmall}>
                  <Ionicons name="bicycle" size={20} color={Colors.white} />
                </View>
                <Text style={styles.webLogoText}>DomiLink</Text>
              </View>

              <Text style={styles.webTitle}>¿Cómo quieres{'\n'}usar DomiLink?</Text>
              <Text style={styles.webSubtitle}>
                Selecciona tu rol para comenzar. Puedes cambiar de cuenta en cualquier momento.
              </Text>
            </Animated.View>

            {/* Cards de rol */}
            <View style={styles.webCardsCol}>
              <Animated.View style={{ transform: [{ translateY: cardAnim1 }], opacity: fadeAnim }}>
                <TouchableOpacity
                  style={[styles.webRoleCard, styles.webRoleCardCompany]}
                  onPress={() => navigation.navigate('Login', { role: 'COMPANY' })}
                  activeOpacity={0.84}
                >
                  <View style={styles.webRoleCardTop}>
                    <View style={[styles.webRoleIconBox, { backgroundColor: Colors.company }]}>
                      <Ionicons name="business" size={28} color={Colors.white} />
                    </View>
                    <View style={[styles.webRoleArrow, { backgroundColor: Colors.company }]}>
                      <Ionicons name="arrow-forward" size={16} color={Colors.white} />
                    </View>
                  </View>
                  <Text style={[styles.webRoleTitle, { color: Colors.company }]}>Soy Empresa</Text>
                  <Text style={styles.webRoleDesc}>
                    Publica pedidos, elige couriers y rastrea entregas en tiempo real desde tu panel.
                  </Text>
                  <View style={styles.webRoleFeatures}>
                    {['Publicar pedidos', 'Seguimiento GPS', 'Estadísticas'].map(f => (
                      <View key={f} style={[styles.webRoleTag, { backgroundColor: Colors.companyMuted }]}>
                        <Text style={[styles.webRoleTagText, { color: Colors.company }]}>{f}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={{ transform: [{ translateY: cardAnim2 }], opacity: fadeAnim }}>
                <TouchableOpacity
                  style={[styles.webRoleCard, styles.webRoleCardCourier]}
                  onPress={() => navigation.navigate('Login', { role: 'COURIER' })}
                  activeOpacity={0.84}
                >
                  <View style={styles.webRoleCardTop}>
                    <View style={[styles.webRoleIconBox, { backgroundColor: Colors.courier }]}>
                      <Ionicons name="bicycle" size={28} color={Colors.white} />
                    </View>
                    <View style={[styles.webRoleArrow, { backgroundColor: Colors.courier }]}>
                      <Ionicons name="arrow-forward" size={16} color={Colors.white} />
                    </View>
                  </View>
                  <Text style={[styles.webRoleTitle, { color: Colors.courier }]}>Soy Domiciliario</Text>
                  <Text style={styles.webRoleDesc}>
                    Recibe pedidos, actívate cuando quieras y cobra por cada entrega completada.
                  </Text>
                  <View style={styles.webRoleFeatures}>
                    {['Gana dinero', 'Horario flexible', 'Pagos al instante'].map(f => (
                      <View key={f} style={[styles.webRoleTag, { backgroundColor: Colors.courierMuted }]}>
                        <Text style={[styles.webRoleTagText, { color: Colors.courier }]}>{f}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </View>

            <Animated.View style={[styles.webFooter, { opacity: fadeAnim }]}>
              <Ionicons name="lock-closed-outline" size={11} color={Colors.textDisabled} />
              <Text style={styles.webLegal}>
                Al continuar aceptas nuestros{' '}
                <Text style={{ color: Colors.company }}>Términos de Servicio</Text>
                {' '}y{' '}
                <Text style={{ color: Colors.company }}>Política de Privacidad</Text>
              </Text>
            </Animated.View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // ── LAYOUT MÓVIL (original) ───────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.company} />

      <View style={styles.hero}>
        <View style={styles.bgLayer1} />
        <View style={styles.bgLayer2} />
        <View style={styles.bgLayer3} />
        <View style={styles.orb1} />
        <View style={styles.orb2} />
        <View style={styles.gridOverlay} />

        <Animated.View style={[styles.heroContent, {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        }]}>
          <View style={styles.logoPill}>
            <View style={styles.logoIconRing}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <View style={styles.logoIconInner}>
                  <Ionicons name="bicycle" size={34} color={Colors.white} />
                </View>
              </Animated.View>
            </View>
          </View>

          <View style={styles.wordmarkRow}>
            <Text style={styles.appName}>Domi</Text>
            <View style={styles.appNameAccentBox}>
              <Text style={styles.appNameAccent}>Link</Text>
            </View>
          </View>

          <Text style={styles.tagline}>Conecta. Entrega. Crece.</Text>

          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark" size={12} color={Colors.courierLight} />
              <Text style={styles.trustText}>Couriers verificados</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Ionicons name="flash" size={12} color="#FCD34D" />
              <Text style={styles.trustText}>Entregas en tiempo real</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetLabel}>¿Cómo quieres usar DomiLink?</Text>

        <Animated.View style={{ transform: [{ translateY: cardAnim1 }], opacity: fadeAnim }}>
          <TouchableOpacity
            style={[styles.roleCard, styles.roleCardCompany]}
            onPress={() => navigation.navigate('Login', { role: 'COMPANY' })}
            activeOpacity={0.84}
          >
            <View style={styles.roleCardBgCompany} />
            <View style={[styles.roleIconBox, { backgroundColor: Colors.company }]}>
              <Ionicons name="business" size={26} color={Colors.white} />
            </View>
            <View style={styles.roleInfo}>
              <View style={styles.roleTitleRow}>
                <Text style={[styles.roleTitle, { color: Colors.company }]}>Soy Empresa</Text>
                <View style={[styles.rolePill, { backgroundColor: Colors.company + '18' }]}>
                  <Text style={[styles.rolePillText, { color: Colors.company }]}>Publicar pedidos</Text>
                </View>
              </View>
              <Text style={styles.roleDesc}>Gestiona entregas y domiciliarios en tiempo real</Text>
            </View>
            <View style={[styles.roleArrow, { backgroundColor: Colors.company }]}>
              <Ionicons name="arrow-forward" size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ translateY: cardAnim2 }], opacity: fadeAnim }}>
          <TouchableOpacity
            style={[styles.roleCard, styles.roleCardCourier]}
            onPress={() => navigation.navigate('Login', { role: 'COURIER' })}
            activeOpacity={0.84}
          >
            <View style={styles.roleCardBgCourier} />
            <View style={[styles.roleIconBox, { backgroundColor: Colors.courier }]}>
              <Ionicons name="bicycle" size={26} color={Colors.white} />
            </View>
            <View style={styles.roleInfo}>
              <View style={styles.roleTitleRow}>
                <Text style={[styles.roleTitle, { color: Colors.courier }]}>Soy Domiciliario</Text>
                <View style={[styles.rolePill, { backgroundColor: Colors.courier + '18' }]}>
                  <Text style={[styles.rolePillText, { color: Colors.courier }]}>Ganar dinero</Text>
                </View>
              </View>
              <Text style={styles.roleDesc}>Toma pedidos y recibe pagos al instante</Text>
            </View>
            <View style={[styles.roleArrow, { backgroundColor: Colors.courier }]}>
              <Ionicons name="arrow-forward" size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.footer}>
          <Ionicons name="lock-closed-outline" size={11} color={Colors.textDisabled} />
          <Text style={styles.legal}>
            Al continuar aceptas nuestros{' '}
            <Text style={{ color: Colors.company }}>Términos de Servicio</Text>
            {' '}y{' '}
            <Text style={{ color: Colors.company }}>Política de Privacidad</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const HERO_H = height * 0.42;

const styles = StyleSheet.create({
  // ── WEB ──────────────────────────────────────────────────────
  webRoot: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.background,
  },
  webLeft: {
    width: '42%',
    minWidth: 380,
    maxWidth: 560,
  },
  webRight: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  webRightContent: {
    padding: 56,
    paddingTop: 64,
    maxWidth: 520,
    alignSelf: 'center',
    width: '100%',
    minHeight: '100%',
    justifyContent: 'center',
  },

  webHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 36,
  },
  webLogoSmall: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.company,
    alignItems: 'center', justifyContent: 'center',
  },
  webLogoText: {
    fontSize: 20, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5,
  },

  webTitle: {
    fontSize: 36, fontWeight: '800', color: Colors.textPrimary,
    lineHeight: 44, letterSpacing: -0.8,
    marginBottom: 12,
  },
  webSubtitle: {
    ...Typography.body1,
    color: Colors.textSecondary,
    lineHeight: 26,
    marginBottom: 36,
  },

  webCardsCol: { gap: 16, marginBottom: 32 },

  webRoleCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 24,
    borderWidth: 1.5,
    ...Shadow.medium,
    gap: 10,
  },
  webRoleCardCompany: { borderColor: Colors.company + '30' },
  webRoleCardCourier: { borderColor: Colors.courier + '30' },

  webRoleCardTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  webRoleIconBox: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.small,
  },
  webRoleArrow: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  webRoleTitle: {
    fontSize: 20, fontWeight: '700', letterSpacing: -0.3,
  },
  webRoleDesc: {
    ...Typography.body2,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  webRoleFeatures: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4,
  },
  webRoleTag: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  webRoleTagText: {
    ...Typography.caption2, fontWeight: '700',
  },

  webFooter: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
  },
  webLegal: {
    ...Typography.caption,
    color: Colors.textDisabled,
    flex: 1, lineHeight: 17,
  },

  // ── MÓVIL ────────────────────────────────────────────────────
  container: { flex: 1, backgroundColor: Colors.companyDeep },

  hero: {
    height: HERO_H,
    backgroundColor: Colors.company,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  bgLayer1: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.company },
  bgLayer2: {
    position: 'absolute', top: -80, right: -80,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: Colors.companyAccent, opacity: 0.45,
  },
  bgLayer3: {
    position: 'absolute', bottom: -60, left: -60,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: Colors.companyDeep, opacity: 0.6,
  },
  orb1: {
    position: 'absolute', top: 20, left: width * 0.1,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  orb2: {
    position: 'absolute', bottom: 30, right: width * 0.08,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  gridOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.03 },

  heroContent: { alignItems: 'center', paddingHorizontal: 24 },

  logoPill: { marginBottom: 18 },
  logoIconRing: {
    width: 96, height: 96, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoIconInner: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  wordmarkRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  appName: { fontSize: 38, fontWeight: '800', color: Colors.white, letterSpacing: -1 },
  appNameAccentBox: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  appNameAccent: { fontSize: 38, fontWeight: '800', color: Colors.white, letterSpacing: -1 },

  tagline: {
    ...Typography.body2, color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20,
  },

  trustRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustDivider: { width: 1, height: 14, backgroundColor: 'rgba(255,255,255,0.25)' },
  trustText: { ...Typography.caption2, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

  sheet: {
    flex: 1, backgroundColor: Colors.background,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 14,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border,
    alignSelf: 'center', marginBottom: 20,
  },
  sheetLabel: {
    ...Typography.h5, color: Colors.textSecondary,
    textAlign: 'center', marginBottom: 16, letterSpacing: 0.2,
  },

  roleCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, padding: 16, marginBottom: 12,
    gap: 14, overflow: 'hidden', ...Shadow.medium,
  },
  roleCardCompany: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.company + '35' },
  roleCardCourier: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.courier + '35' },
  roleCardBgCompany: {
    position: 'absolute', top: -20, right: -20,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.company, opacity: 0.04,
  },
  roleCardBgCourier: {
    position: 'absolute', top: -20, right: -20,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.courier, opacity: 0.04,
  },
  roleIconBox: {
    width: 54, height: 54, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...Shadow.small,
  },
  roleInfo: { flex: 1, gap: 5 },
  roleTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  roleTitle: { ...Typography.subtitle1 },
  rolePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  rolePillText: { ...Typography.caption2, fontWeight: '700' },
  roleDesc: { ...Typography.body3, color: Colors.textSecondary, lineHeight: 18 },
  roleArrow: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  footer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 5,
    paddingVertical: 14, marginTop: 'auto',
  },
  legal: { ...Typography.caption, color: Colors.textDisabled, flex: 1, lineHeight: 17 },
});
