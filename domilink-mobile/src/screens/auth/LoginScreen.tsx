import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity, StatusBar, Alert, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Colors, Shadow } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { AuthBrandPanel } from '../../components/common/AuthBrandPanel';

// ── Usuarios de prueba del sistema ───────────────────────────────
interface TestUser {
  label: string;
  email: string;
  password: string;
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  desc: string;
}

const TEST_USERS: Record<'COMPANY' | 'COURIER', TestUser[]> = {
  COMPANY: [
    {
      label: 'Empresa Demo',
      email: 'empresa@ejemplo.com',
      password: 'password123',
      icon: 'business-outline',
      desc: 'Empresa activa con pedidos',
    },
  ],
  COURIER: [
    {
      label: 'Courier Demo',
      email: 'domiciliario@ejemplo.com',
      password: 'password123',
      icon: 'bicycle-outline',
      desc: 'Domiciliario verificado',
    },
  ],
};

export const LoginScreen = ({ navigation, route }: any) => {
  const role: 'COMPANY' | 'COURIER' = route.params?.role ?? 'COMPANY';
  const isCompany  = role === 'COMPANY';
  const accent      = isCompany ? Colors.company     : Colors.courier;
  const accentDeep  = isCompany ? Colors.companyDeep : Colors.courierDeep;
  const accentMuted = isCompany ? Colors.companyMuted: Colors.courierMuted;
  const { isLarge } = useBreakpoint();

  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<{ email?: string; password?: string }>({});

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'El email es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email inválido';
    if (!password) e.password = 'La contraseña es obligatoria';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await login(email.trim().toLowerCase(), password);
      if (result.requiresOtp) {
        // Redirigir a la pantalla de verificacion OTP
        navigation.navigate('Otp', {
          email: result.email,
          role: result.role,
          otpDev: result.otpDev,
        });
      }
      // Si !requiresOtp el AppNavigator detecta isAuthenticated=true y navega solo
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Verifica tu email y contraseña.';
      Alert.alert('Error de acceso', msg);
    } finally {
      setLoading(false);
    }
  };

  const fillTestUser = (u: typeof TEST_USERS.COMPANY[0]) => {
    setEmail(u.email);
    setPassword(u.password);
    setErrors({});
  };

  // ── Formulario compartido (se usa en ambos layouts) ───────────
  const FormContent = (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1 }}>
      {/* Sección de inicio de sesión */}
      <View style={styles.sectionIndicator}>
        <View style={[styles.sectionDot, { backgroundColor: accent }]} />
        <Text style={styles.sectionLabel}>Inicia sesión en tu cuenta</Text>
      </View>

      <Input
        label="Correo electrónico"
        placeholder="tu@correo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        leftIcon="mail-outline"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        accentColor={accent}
      />

      <Input
        label="Contraseña"
        placeholder="Tu contraseña segura"
        isPassword
        leftIcon="lock-closed-outline"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        accentColor={accent}
      />

      <TouchableOpacity style={styles.forgotRow}>
        <Text style={[styles.forgotText, { color: accent }]}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      <Button
        title="Ingresar"
        onPress={handleLogin}
        loading={loading}
        fullWidth
        size="lg"
        style={{ ...styles.loginBtn, backgroundColor: accent }}
        icon={<Ionicons name="arrow-forward" size={18} color={Colors.white} />}
        iconRight
      />

      {/* Usuarios de prueba */}
      <View style={styles.testSection}>
        <View style={styles.testDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.testDividerLabel}>Usuarios de prueba</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.testHint}>
          <Ionicons name="information-circle-outline" size={14} color={Colors.info} />
          <Text style={styles.testHintText}>
            Haz clic en un usuario para rellenar el formulario automáticamente
          </Text>
        </View>

        {TEST_USERS[role].map((u) => (
          <TouchableOpacity
            key={u.email}
            style={[styles.testUserCard, { borderColor: accent + '35', backgroundColor: accentMuted }]}
            onPress={() => fillTestUser(u)}
            activeOpacity={0.8}
          >
            <View style={[styles.testUserIconBox, { backgroundColor: accent }]}>
              <Ionicons name={u.icon} size={16} color={Colors.white} />
            </View>
            <View style={styles.testUserInfo}>
              <Text style={[styles.testUserLabel, { color: accent }]}>{u.label}</Text>
              <Text style={styles.testUserEmail}>{u.email}</Text>
              <Text style={styles.testUserDesc}>{u.desc}</Text>
            </View>
            <View style={[styles.testUserFill, { backgroundColor: accent + '18' }]}>
              <Ionicons name="arrow-down-circle-outline" size={18} color={accent} />
            </View>
          </TouchableOpacity>
        ))}

        <View style={[styles.credentialCard, { borderColor: Colors.border }]}>
          <Ionicons name="key-outline" size={14} color={Colors.textTertiary} />
          <Text style={styles.credentialText}>
            Contraseña de todos los usuarios de prueba:{' '}
            <Text style={{ fontWeight: '700', color: Colors.textSecondary }}>password123</Text>
          </Text>
        </View>
      </View>

      {/* Link a registro */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>o</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={[styles.registerCard, { borderColor: accent + '30', backgroundColor: accentMuted }]}
        onPress={() => navigation.navigate('Register', { role })}
        activeOpacity={0.85}
      >
        <View style={styles.registerCardLeft}>
          <View style={[styles.registerIconBox, { backgroundColor: accent }]}>
            <Ionicons name="person-add-outline" size={16} color={Colors.white} />
          </View>
          <View>
            <Text style={[styles.registerCardTitle, { color: accent }]}>Crear cuenta nueva</Text>
            <Text style={styles.registerCardDesc}>
              {isCompany ? 'Regístrate como empresa' : 'Únete como domiciliario'}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={accent} />
      </TouchableOpacity>
    </Animated.View>
  );

  // ── LAYOUT WEB / DESKTOP ──────────────────────────────────────
  if (isLarge) {
    return (
      <View style={styles.webRoot}>
        <StatusBar barStyle="light-content" backgroundColor={accentDeep} />

        {/* Panel izquierdo de marca */}
        <View style={styles.webLeft}>
          <AuthBrandPanel role={role} />
        </View>

        {/* Panel derecho: formulario */}
        <View style={styles.webRight}>
          <ScrollView
            contentContainerStyle={styles.webFormContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Navegación web */}
            <View style={styles.webNav}>
              <TouchableOpacity
                style={styles.webBackBtn}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={16} color={Colors.textSecondary} />
                <Text style={styles.webBackText}>Volver</Text>
              </TouchableOpacity>

              <View style={[styles.webRoleBadge, { backgroundColor: accentMuted, borderColor: accent + '40' }]}>
                <View style={[styles.badgeDot, { backgroundColor: accent }]} />
                <Ionicons name={isCompany ? 'business' : 'bicycle'} size={13} color={accent} />
                <Text style={[styles.webRoleBadgeText, { color: accent }]}>
                  {isCompany ? 'Empresa' : 'Domiciliario'}
                </Text>
              </View>
            </View>

            {/* Títulos */}
            <View style={styles.webTitles}>
              <Text style={styles.webTitle}>Bienvenido de vuelta</Text>
              <Text style={styles.webSubtitle}>
                {isCompany
                  ? 'Accede a tu panel de gestión de pedidos'
                  : 'Tus entregas del día te están esperando'}
              </Text>
            </View>

            {FormContent}
          </ScrollView>
        </View>
      </View>
    );
  }

  // ── LAYOUT MÓVIL ─────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: accent }]}>
      <StatusBar barStyle="light-content" backgroundColor={accent} />

      <View style={[styles.heroBg, { backgroundColor: accentDeep }]} />
      <View style={styles.heroOrb1} />
      <View style={[styles.heroOrb2, { backgroundColor: accent, opacity: 0.5 }]} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.white} />
        </TouchableOpacity>
        <View style={[styles.headerBadge, { borderColor: 'rgba(255,255,255,0.3)' }]}>
          <View style={[styles.badgeDot, { backgroundColor: accentMuted }]} />
          <Ionicons name={isCompany ? 'business' : 'bicycle'} size={14} color={accent} />
          <Text style={[styles.headerBadgeText, { color: accent }]}>
            {isCompany ? 'Empresa' : 'Domiciliario'}
          </Text>
        </View>
      </View>

      <Animated.View style={[styles.heroText, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.welcomeTitle}>Bienvenido{'\n'}de vuelta</Text>
        <Text style={styles.welcomeSub}>
          {isCompany ? 'Gestiona tus pedidos desde aquí' : 'Tus entregas te están esperando'}
        </Text>
      </Animated.View>

      <ScrollView
        style={styles.sheet}
        contentContainerStyle={styles.sheetContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {FormContent}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ── WEB ──────────────────────────────────────────────────────
  webRoot: {
    flex: 1, flexDirection: 'row', backgroundColor: Colors.background,
  },
  webLeft: {
    width: '42%', minWidth: 380, maxWidth: 560,
  },
  webRight: {
    flex: 1, backgroundColor: Colors.background,
  },
  webFormContent: {
    padding: 56, paddingTop: 48,
    maxWidth: 520, alignSelf: 'center', width: '100%',
    minHeight: '100%', justifyContent: 'center',
  },

  webNav: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 40,
  },
  webBackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.white,
    ...Shadow.xs,
  },
  webBackText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  webRoleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  webRoleBadgeText: { ...Typography.caption, fontWeight: '700' },

  webTitles: { marginBottom: 32 },
  webTitle: {
    fontSize: 32, fontWeight: '800', color: Colors.textPrimary,
    lineHeight: 40, letterSpacing: -0.6, marginBottom: 8,
  },
  webSubtitle: {
    ...Typography.body1, color: Colors.textSecondary, lineHeight: 26,
  },

  // ── MÓVIL ────────────────────────────────────────────────────
  safe: { flex: 1 },

  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 240 },
  heroOrb1: {
    position: 'absolute', top: -60, right: -50,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroOrb2: {
    position: 'absolute', top: 40, right: 30,
    width: 80, height: 80, borderRadius: 40, opacity: 0.3,
  },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'space-between',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.white, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, ...Shadow.small,
  },
  headerBadgeText: { ...Typography.caption, fontWeight: '700' },

  heroText: { paddingHorizontal: 24, paddingBottom: 30, paddingTop: 6 },
  welcomeTitle: {
    fontSize: 32, fontWeight: '800', color: Colors.white,
    lineHeight: 40, letterSpacing: -0.5, marginBottom: 8,
  },
  welcomeSub: { ...Typography.body2, color: 'rgba(255,255,255,0.72)' },

  sheet: {
    flex: 1, backgroundColor: Colors.background,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },
  sheetContent: { padding: 24, paddingBottom: 40 },

  // ── Compartidos ───────────────────────────────────────────────
  badgeDot: { width: 6, height: 6, borderRadius: 3 },

  sectionIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  sectionDot: { width: 4, height: 20, borderRadius: 2 },
  sectionLabel: { ...Typography.subtitle2, color: Colors.textSecondary },

  forgotRow: { alignItems: 'flex-end', marginTop: -8, marginBottom: 20 },
  forgotText: { ...Typography.caption, fontWeight: '600' },

  loginBtn: {
    borderRadius: 16, paddingVertical: 17,
    shadowColor: Shadow.medium.shadowColor,
    shadowOffset: Shadow.medium.shadowOffset,
    shadowOpacity: Shadow.medium.shadowOpacity,
    shadowRadius: Shadow.medium.shadowRadius,
    elevation: Shadow.medium.elevation,
  },

  // ── Test users ────────────────────────────────────────────────
  testSection: { marginTop: 24, gap: 10 },

  testDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  testDividerLabel: {
    ...Typography.caption, color: Colors.textTertiary,
    fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8,
  },

  testHint: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 7,
    backgroundColor: Colors.infoLight,
    borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: Colors.infoBorder,
  },
  testHintText: {
    ...Typography.caption, color: Colors.info, flex: 1, lineHeight: 17,
  },

  testUserCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1.5, padding: 12,
    ...Shadow.xs,
  },
  testUserIconBox: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  testUserInfo: { flex: 1 },
  testUserLabel: { ...Typography.subtitle2, marginBottom: 1 },
  testUserEmail: { ...Typography.caption, color: Colors.textTertiary },
  testUserDesc: { ...Typography.caption2, color: Colors.textTertiary, marginTop: 2 },
  testUserFill: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },

  credentialCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 7,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10, padding: 10,
    borderWidth: 1,
  },
  credentialText: { ...Typography.caption, color: Colors.textTertiary, flex: 1, lineHeight: 17 },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerLabel: { ...Typography.caption, color: Colors.textTertiary, fontWeight: '600' },

  registerCard: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderRadius: 16, borderWidth: 1.5, padding: 14,
  },
  registerCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  registerIconBox: {
    width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  registerCardTitle: { ...Typography.subtitle2 },
  registerCardDesc: { ...Typography.caption, color: Colors.textSecondary, marginTop: 1 },
});
