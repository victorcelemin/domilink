import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';

export const RegisterScreen = ({ navigation, route }: any) => {
  const role: 'COMPANY' | 'COURIER' = route.params?.role ?? 'COMPANY';
  const isCompany = role === 'COMPANY';
  const accent = isCompany ? Colors.company : Colors.courier;
  const accentMuted = isCompany ? Colors.companyMuted : Colors.courierMuted;

  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]         = useState(false);
  const [errors, setErrors]           = useState<Record<string, string>>({});

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
      // AppNavigator detecta isAuthenticated=true y navega automáticamente al stack correcto
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Error al registrarse. Intenta de nuevo.';
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: accent }]}>
      <StatusBar barStyle="light-content" backgroundColor={accent} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerBadge}>
          <Ionicons name={isCompany ? 'business' : 'bicycle'} size={15} color={accent} />
          <Text style={[styles.headerBadgeText, { color: accent }]}>
            {isCompany ? 'Cuenta Empresa' : 'Cuenta Domiciliario'}
          </Text>
        </View>
      </View>

      <View style={styles.heroText}>
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.sub}>
          {isCompany
            ? 'Empieza a publicar pedidos hoy'
            : 'Empieza a ganar dinero hoy'}
        </Text>
      </View>

      <ScrollView
        style={styles.sheet}
        contentContainerStyle={styles.sheetContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Error global */}
        {errors.form && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
            <Text style={styles.errorBoxText}>{errors.form}</Text>
          </View>
        )}

        <Input
          label={isCompany ? 'Nombre del negocio' : 'Tu nombre completo'}
          placeholder={isCompany ? 'Ej: Tienda Ropa Moderna' : 'Ej: Carlos López'}
          leftIcon="person-outline"
          value={displayName}
          onChangeText={setDisplayName}
          error={errors.displayName}
          autoCapitalize="words"
          accentColor={accent}
        />

        <Input
          label="Email"
          placeholder="correo@ejemplo.com"
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
          leftIcon="lock-closed-outline"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={errors.confirmPassword}
          accentColor={accent}
        />

        {/* Info box */}
        <View style={[styles.infoBox, { backgroundColor: accentMuted, borderColor: accent + '40' }]}>
          <Ionicons name="information-circle-outline" size={16} color={accent} />
          <Text style={[styles.infoText, { color: accent }]}>
            {isCompany
              ? 'Después registrarás tu empresa (NIT, dirección) para comenzar a publicar pedidos.'
              : 'Deberás subir cédula, selfie y certificado de antecedentes para activación.'}
          </Text>
        </View>

        <Button
          title="Crear cuenta"
          onPress={handleRegister}
          loading={loading}
          fullWidth
          size="lg"
          style={{ backgroundColor: accent }}
          icon={<Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />}
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  headerBadgeText: { ...Typography.caption, fontWeight: '700' },

  heroText: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 4 },
  title: { ...Typography.h2, color: Colors.white, marginBottom: 4 },
  sub:   { ...Typography.body2, color: 'rgba(255,255,255,0.75)' },

  sheet: {
    flex: 1, backgroundColor: Colors.background,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },
  sheetContent: { padding: 24, paddingBottom: 40 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.errorLight, borderRadius: 12,
    padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.errorBorder,
  },
  errorBoxText: { ...Typography.body3, color: Colors.error, flex: 1 },

  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderRadius: 12, padding: 12, borderWidth: 1,
    marginBottom: 20, marginTop: 4,
  },
  infoText: { ...Typography.caption, flex: 1, lineHeight: 18 },

  loginLink: { alignItems: 'center', marginTop: 16 },
  loginLinkText: { ...Typography.body2, color: Colors.textSecondary },
});
