import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity, StatusBar, Alert,
  TextInput, Animated, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Colors, Shadow } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { AuthBrandPanel } from '../../components/common/AuthBrandPanel';

const OTP_LENGTH = 6;
// Tiempo de countdown para reenvio (segundos)
const RESEND_COOLDOWN = 60;

export const OtpScreen = ({ navigation, route }: any) => {
  const { email, role, otpDev } = route.params as {
    email: string;
    role: 'COMPANY' | 'COURIER';
    /** En desarrollo el backend retorna el OTP en la respuesta para facilitar pruebas */
    otpDev?: string;
  };

  const isCompany   = role === 'COMPANY';
  const accent      = isCompany ? Colors.company     : Colors.courier;
  const accentDeep  = isCompany ? Colors.companyDeep : Colors.courierDeep;
  const accentMuted = isCompany ? Colors.companyMuted : Colors.courierMuted;
  const { isLarge } = useBreakpoint();

  const { verifyOtp, resendOtp } = useAuth();

  const [digits, setDigits]       = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading]     = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const [error, setError]         = useState('');

  const inputRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // ── Animacion de entrada ──────────────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Countdown para reenvio ────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // ── Prellenar si el backend envio el OTP (solo dev) ──────────
  useEffect(() => {
    if (otpDev && otpDev.length === OTP_LENGTH) {
      const arr = otpDev.split('');
      setDigits(arr);
    }
  }, [otpDev]);

  // ── Shake animation para error ────────────────────────────────
  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // ── Manejo de inputs individuales ────────────────────────────
  const handleDigitChange = (text: string, index: number) => {
    // Solo numeros
    const clean = text.replace(/\D/g, '');
    if (!clean && !text) {
      // Borrar
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      if (index > 0) inputRefs.current[index - 1]?.focus();
      return;
    }
    const digit = clean.slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-submit cuando se completan los 6 digitos
    if (digit && index === OTP_LENGTH - 1) {
      const full = [...next].join('');
      if (full.length === OTP_LENGTH) handleVerify(full);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ── Pegar codigo completo ─────────────────────────────────────
  const handlePaste = (text: string, index: number) => {
    const clean = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (clean.length === OTP_LENGTH) {
      setDigits(clean.split(''));
      inputRefs.current[OTP_LENGTH - 1]?.focus();
      handleVerify(clean);
    }
  };

  // ── Verificar OTP ─────────────────────────────────────────────
  const handleVerify = useCallback(async (code?: string) => {
    const otp = code ?? digits.join('');
    if (otp.length < OTP_LENGTH) {
      setError('Ingresa los 6 dígitos del código.');
      shake();
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyOtp(email, otp);
      // La navegacion la maneja el AppNavigator al cambiar isAuthenticated
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.message ?? 'Código incorrecto. Intenta de nuevo.';
      setError(msg);
      shake();
      // Limpiar inputs para reintentar
      setDigits(Array(OTP_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  }, [digits, email, verifyOtp]);

  // ── Reenviar OTP ──────────────────────────────────────────────
  const handleResend = async () => {
    if (!canResend) return;
    try {
      const newOtp = await resendOtp(email);
      setCanResend(false);
      setCountdown(RESEND_COOLDOWN);
      setDigits(Array(OTP_LENGTH).fill(''));
      setError('');
      inputRefs.current[0]?.focus();
      if (newOtp) {
        // Dev: prellenar automaticamente
        setDigits(newOtp.split(''));
      }
    } catch {
      Alert.alert('Error', 'No se pudo reenviar el código. Intenta más tarde.');
    }
  };

  // ── Enmascarar email para privacidad ─────────────────────────
  const maskedEmail = (() => {
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;
    const visible = local.length > 2 ? local.slice(0, 2) : local[0];
    return `${visible}${'*'.repeat(Math.max(local.length - 2, 2))}@${domain}`;
  })();

  // ── Contenido del formulario ──────────────────────────────────
  const FormContent = (
    <Animated.View style={{
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }, { translateX: shakeAnim }],
    }}>
      {/* Icono y titulo */}
      <View style={styles.iconRow}>
        <View style={[styles.iconCircle, { backgroundColor: accentMuted, borderColor: accent + '30' }]}>
          <Ionicons name="shield-checkmark" size={32} color={accent} />
        </View>
      </View>

      {/* Info del envio */}
      <View style={[styles.infoCard, { borderColor: accent + '25', backgroundColor: accentMuted }]}>
        <Ionicons name="mail-outline" size={16} color={accent} />
        <Text style={[styles.infoText, { color: accent }]}>
          Código enviado a{' '}
          <Text style={{ fontWeight: '700' }}>{maskedEmail}</Text>
        </Text>
      </View>

      {/* Error */}
      {!!error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Inputs OTP */}
      <View style={styles.otpRow}>
        {digits.map((digit, i) => (
          <TextInput
            key={i}
            ref={(ref) => { inputRefs.current[i] = ref; }}
            style={[
              styles.otpInput,
              {
                borderColor: digit ? accent : Colors.border,
                backgroundColor: digit ? accentMuted : Colors.white,
                color: accent,
              },
              !!error && styles.otpInputError,
            ]}
            value={digit}
            onChangeText={(t) => {
              if (t.length > 1) { handlePaste(t, i); } else { handleDigitChange(t, i); }
            }}
            onKeyPress={(e) => handleKeyPress(e, i)}
            keyboardType="numeric"
            maxLength={OTP_LENGTH} // permite pegar todo el codigo
            selectTextOnFocus
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            caretHidden
          />
        ))}
      </View>

      {/* Boton verificar */}
      <Button
        title="Verificar código"
        onPress={() => handleVerify()}
        loading={loading}
        fullWidth
        size="lg"
        style={{ ...styles.verifyBtn, backgroundColor: accent }}
        icon={<Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />}
        iconRight
      />

      {/* Reenviar */}
      <View style={styles.resendRow}>
        <Text style={styles.resendLabel}>¿No recibiste el código?</Text>
        {canResend ? (
          <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
            <Text style={[styles.resendBtn, { color: accent }]}>Reenviar código</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.resendCountdown}>
            Reenviar en{' '}
            <Text style={{ fontWeight: '700', color: Colors.textSecondary }}>{countdown}s</Text>
          </Text>
        )}
      </View>

      {/* Volver */}
      <TouchableOpacity
        style={[styles.backCard, { borderColor: Colors.border }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={16} color={Colors.textSecondary} />
        <Text style={styles.backCardText}>Volver e ingresar con otra cuenta</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  // ── LAYOUT WEB / DESKTOP ──────────────────────────────────────
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
            <View style={styles.webTitles}>
              <Text style={styles.webTitle}>Verificación en{'\n'}dos pasos</Text>
              <Text style={styles.webSubtitle}>
                Por seguridad, ingresa el código que enviamos a tu correo.
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
      <View style={[styles.heroOrb2, { backgroundColor: accent, opacity: 0.4 }]} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.white} />
        </TouchableOpacity>
        <View style={[styles.headerBadge, { borderColor: 'rgba(255,255,255,0.3)' }]}>
          <Ionicons name="shield-checkmark-outline" size={14} color={Colors.white} />
          <Text style={styles.headerBadgeText}>Verificacion 2FA</Text>
        </View>
      </View>

      <Animated.View style={[styles.heroText, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.welcomeTitle}>Verificación{'\n'}en dos pasos</Text>
        <Text style={styles.welcomeSub}>Tu seguridad es nuestra prioridad</Text>
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
  webRoot: { flex: 1, flexDirection: 'row', backgroundColor: Colors.background },
  webLeft: { width: '42%', minWidth: 380, maxWidth: 560 },
  webRight: { flex: 1, backgroundColor: Colors.background },
  webFormContent: {
    padding: 56, paddingTop: 48,
    maxWidth: 520, alignSelf: 'center', width: '100%',
    minHeight: '100%', justifyContent: 'center',
  },
  webTitles: { marginBottom: 36 },
  webTitle: {
    fontSize: 32, fontWeight: '800', color: Colors.textPrimary,
    lineHeight: 40, letterSpacing: -0.6, marginBottom: 8,
  },
  webSubtitle: { ...Typography.body1, color: Colors.textSecondary, lineHeight: 26 },

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
    width: 80, height: 80, borderRadius: 40,
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
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  headerBadgeText: { ...Typography.caption, color: Colors.white, fontWeight: '700' },
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
  iconRow: { alignItems: 'center', marginBottom: 20 },
  iconCircle: {
    width: 72, height: 72, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
    ...Shadow.small,
  },

  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 14, borderWidth: 1.5, padding: 12, marginBottom: 20,
  },
  infoText: { ...Typography.body3, flex: 1, lineHeight: 20 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.errorLight, borderRadius: 12,
    padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.errorBorder,
  },
  errorText: { ...Typography.body3, color: Colors.error, flex: 1 },

  otpRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    gap: 8, marginBottom: 28,
  },
  otpInput: {
    flex: 1, height: 60, borderRadius: 14,
    borderWidth: 2, textAlign: 'center',
    fontSize: 24, fontWeight: '800',
    ...Shadow.xs,
  },
  otpInputError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },

  verifyBtn: {
    borderRadius: 16, paddingVertical: 17,
    shadowColor: Shadow.medium.shadowColor,
    shadowOffset: Shadow.medium.shadowOffset,
    shadowOpacity: Shadow.medium.shadowOpacity,
    shadowRadius: Shadow.medium.shadowRadius,
    elevation: Shadow.medium.elevation,
  },

  resendRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 20, flexWrap: 'wrap',
  },
  resendLabel: { ...Typography.body2, color: Colors.textTertiary },
  resendBtn: { ...Typography.body2, fontWeight: '700', textDecorationLine: 'underline' },
  resendCountdown: { ...Typography.body2, color: Colors.textTertiary },

  backCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 16, padding: 14,
    borderRadius: 14, borderWidth: 1,
    backgroundColor: Colors.surfaceElevated,
  },
  backCardText: { ...Typography.body3, color: Colors.textSecondary },
});
