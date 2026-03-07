import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity, StatusBar, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Colors, Shadow } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { AuthBrandPanel } from '../../components/common/AuthBrandPanel';

export const RegisterScreen = ({ navigation, route }: any) => {
  const role: 'COMPANY' | 'COURIER' = route.params?.role ?? 'COMPANY';
  const isCompany  = role === 'COMPANY';
  const accent      = isCompany ? Colors.company     : Colors.courier;
  const accentDeep  = isCompany ? Colors.companyDeep : Colors.courierDeep;
  const accentMuted = isCompany ? Colors.companyMuted: Colors.courierMuted;
  const { isLarge } = useBreakpoint();

  const { register } = useAuth();
  const [displayName, setDisplayName]         = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]                 = useState(false);
  const [errors, setErrors]                   = useState<Record<string, string>>({});

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
    if (!displayName.trim()) e.displayName = 'El nombre es obligatorio';
    if (!email.trim()) e.email = 'El email es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email inválido';
    if (!password) e.password = 'La contraseña es obligatoria';
    else if (password.length < 8) e.password = 'Mínimo 8 caracteres';
    if (password !== confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register(email.trim().toLowerCase(), password, displayName.trim(), role);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Error al registrarse. Intenta de nuevo.';
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  const nextSteps = isCompany
    ? ['Registrarás tu NIT y dirección fiscal', 'Un admin revisará tu empresa (< 24h)', 'Publicarás tu primer pedido']
    : ['Subirás cédula, selfie y antecedentes', 'Verificamos tus documentos (< 24h)', 'Empezarás a tomar pedidos'];

  // ── Formulario compartido ─────────────────────────────────────
  const FormContent = (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {errors.form && (
        <View style={styles.errorBox}>
          <View style={styles.errorIconBox}>
            <Ionicons name="alert-circle" size={18} color={Colors.error} />
          </View>
          <Text style={styles.errorBoxText}>{errors.form}</Text>
        </View>
      )}

      <View style={styles.sectionIndicator}>
        <View style={[styles.sectionDot, { backgroundColor: accent }]} />
        <Text style={styles.sectionLabel}>Paso 1 de 4 — Información de acceso</Text>
      </View>

      <Input
        label={isCompany ? 'Nombre del negocio' : 'Tu nombre completo'}
        placeholder={isCompany ? 'Ej: Distribuciones Rápidas SAS' : 'Ej: Carlos López'}
        leftIcon="person-outline"
        value={displayName}
        onChangeText={setDisplayName}
        error={errors.displayName}
        autoCapitalize="words"
        accentColor={accent}
      />

      <Input
        label="Correo electrónico"
        placeholder="correo@ejemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        leftIcon="mail-outline"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        accentColor={accent}
      />

      {isLarge ? (
        // En web: contraseñas en fila de 2 columnas
        <View style={styles.passwordRow}>
          <View style={styles.passwordCol}>
            <Input
              label="Contraseña"
              placeholder="Mínimo 8 caracteres"
              isPassword
              leftIcon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              accentColor={accent}
            />
          </View>
          <View style={styles.passwordCol}>
            <Input
              label="Confirmar contraseña"
              placeholder="Repite tu contraseña"
              isPassword
              leftIcon="shield-checkmark-outline"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
              accentColor={accent}
            />
          </View>
        </View>
      ) : (
        <>
          <Input
            label="Contraseña"
            placeholder="Mínimo 8 caracteres"
            isPassword
            leftIcon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            accentColor={accent}
          />
          <Input
            label="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            isPassword
            leftIcon="shield-checkmark-outline"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={errors.confirmPassword}
            accentColor={accent}
          />
        </>
      )}

      {/* Próximos pasos */}
      <View style={[styles.nextStepsCard, { borderColor: accent + '30', backgroundColor: accentMuted }]}>
        <View style={[styles.nextStepsHeader, { borderBottomColor: accent + '20' }]}>
          <Ionicons name="map-outline" size={15} color={accent} />
          <Text style={[styles.nextStepsTitle, { color: accent }]}>Próximos pasos</Text>
        </View>
        <View style={styles.nextStepsBody}>
          {nextSteps.map((step, i) => (
            <View key={i} style={styles.nextStepRow}>
              <View style={[styles.nextStepNum, { backgroundColor: accent }]}>
                <Text style={styles.nextStepNumText}>{i + 2}</Text>
              </View>
              <Text style={[styles.nextStepText, { color: accent }]}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      <Button
        title="Crear cuenta y continuar"
        onPress={handleRegister}
        loading={loading}
        fullWidth
        size="lg"
        style={{ ...styles.createBtn, backgroundColor: accent }}
        icon={<Ionicons name="arrow-forward" size={18} color={Colors.white} />}
        iconRight
      />

      <TouchableOpacity
        onPress={() => navigation.navigate('Login', { role })}
        style={styles.loginLink}
      >
        <Text style={styles.loginLinkText}>
          ¿Ya tienes cuenta?{' '}
          <Text style={{ color: accent, fontWeight: '700' }}>Inicia sesión</Text>
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  // ── LAYOUT WEB ────────────────────────────────────────────────
  if (isLarge) {
    return (
      <View style={styles.webRoot}>
        <StatusBar barStyle="light-content" backgroundColor={accentDeep} />
        <View style={styles.webLeft}>
          <AuthBrandPanel role={role} />
        </View>
        <View style={styles.webRight}>
          <ScrollView
            contentContainerStyle={styles.webFormContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Nav */}
            <View style={styles.webNav}>
              <TouchableOpacity style={styles.webBackBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={16} color={Colors.textSecondary} />
                <Text style={styles.webBackText}>Volver</Text>
              </TouchableOpacity>
              <View style={[styles.webRoleBadge, { backgroundColor: accentMuted, borderColor: accent + '40' }]}>
                <View style={[styles.badgeDot, { backgroundColor: accent }]} />
                <Ionicons name={isCompany ? 'business' : 'bicycle'} size={13} color={accent} />
                <Text style={[styles.webRoleBadgeText, { color: accent }]}>
                  {isCompany ? 'Cuenta Empresa' : 'Cuenta Courier'}
                </Text>
              </View>
            </View>

            {/* Títulos */}
            <View style={styles.webTitles}>
              <Text style={styles.webTitle}>Crea tu cuenta</Text>
              <Text style={styles.webSubtitle}>
                {isCompany
                  ? 'Empieza a publicar pedidos en minutos'
                  : 'Empieza a generar ingresos hoy mismo'}
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
      <View style={styles.heroOrb} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerBadge}>
          <View style={[styles.badgeDot, { backgroundColor: accentMuted }]} />
          <Ionicons name={isCompany ? 'business' : 'bicycle'} size={14} color={accent} />
          <Text style={[styles.headerBadgeText, { color: accent }]}>
            {isCompany ? 'Cuenta Empresa' : 'Cuenta Courier'}
          </Text>
        </View>
      </View>

      <View style={styles.heroText}>
        <Text style={styles.title}>Crea tu cuenta</Text>
        <Text style={styles.sub}>
          {isCompany ? 'Empieza a publicar pedidos hoy mismo' : 'Empieza a generar ingresos hoy mismo'}
        </Text>
      </View>

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
  webRoot: { flex: 1, flexDirection: 'row', backgroundColor: Colors.background },
  webLeft: { width: '42%', minWidth: 380, maxWidth: 560 },
  webRight: { flex: 1, backgroundColor: Colors.background },
  webFormContent: {
    padding: 56, paddingTop: 48,
    maxWidth: 560, alignSelf: 'center', width: '100%',
    minHeight: '100%', justifyContent: 'center',
  },

  webNav: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 36,
  },
  webBackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.white, ...Shadow.xs,
  },
  webBackText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  webRoleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  webRoleBadgeText: { ...Typography.caption, fontWeight: '700' },

  webTitles: { marginBottom: 28 },
  webTitle: {
    fontSize: 32, fontWeight: '800', color: Colors.textPrimary,
    lineHeight: 40, letterSpacing: -0.6, marginBottom: 8,
  },
  webSubtitle: { ...Typography.body1, color: Colors.textSecondary, lineHeight: 26 },

  passwordRow: { flexDirection: 'row', gap: 16 },
  passwordCol: { flex: 1 },

  // ── MÓVIL ────────────────────────────────────────────────────
  safe: { flex: 1 },

  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 260 },
  heroOrb: {
    position: 'absolute', top: -50, right: -50,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
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
    borderRadius: 20, ...Shadow.small,
  },
  headerBadgeText: { ...Typography.caption, fontWeight: '700' },

  heroText: { paddingHorizontal: 24, paddingBottom: 26, paddingTop: 6 },
  title: { fontSize: 30, fontWeight: '800', color: Colors.white, lineHeight: 38, letterSpacing: -0.4, marginBottom: 6 },
  sub:   { ...Typography.body2, color: 'rgba(255,255,255,0.72)' },

  sheet: {
    flex: 1, backgroundColor: Colors.background,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },
  sheetContent: { padding: 24, paddingBottom: 40 },

  // ── Compartidos ───────────────────────────────────────────────
  badgeDot: { width: 6, height: 6, borderRadius: 3 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.errorLight, borderRadius: 14,
    padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.errorBorder,
  },
  errorIconBox: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: Colors.error + '15', alignItems: 'center', justifyContent: 'center',
  },
  errorBoxText: { ...Typography.body3, color: Colors.error, flex: 1 },

  sectionIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  sectionDot: { width: 4, height: 20, borderRadius: 2 },
  sectionLabel: { ...Typography.subtitle2, color: Colors.textSecondary },

  nextStepsCard: { borderRadius: 16, borderWidth: 1.5, marginBottom: 22, marginTop: 4, overflow: 'hidden' },
  nextStepsHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, paddingBottom: 10, borderBottomWidth: 1,
  },
  nextStepsTitle: { ...Typography.subtitle2 },
  nextStepsBody: { paddingVertical: 4 },
  nextStepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  nextStepNum: {
    width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  nextStepNumText: { ...Typography.caption2, color: Colors.white, fontWeight: '800' },
  nextStepText: { ...Typography.caption, flex: 1 },

  createBtn: {
    borderRadius: 16, paddingVertical: 17,
    shadowColor: Shadow.medium.shadowColor,
    shadowOffset: Shadow.medium.shadowOffset,
    shadowOpacity: Shadow.medium.shadowOpacity,
    shadowRadius: Shadow.medium.shadowRadius,
    elevation: Shadow.medium.elevation,
  },

  loginLink: { alignItems: 'center', marginTop: 18 },
  loginLinkText: { ...Typography.body2, color: Colors.textSecondary },
});
