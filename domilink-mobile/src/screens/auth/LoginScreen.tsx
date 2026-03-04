import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Colors, Shadow } from '../../theme/colors';
import { Typography } from '../../theme/typography';

export const LoginScreen = ({ navigation, route }: any) => {
  const role: 'COMPANY' | 'COURIER' = route.params?.role ?? 'COMPANY';
  const isCompany = role === 'COMPANY';
  const accent = isCompany ? Colors.company : Colors.courier;
  const accentMuted = isCompany ? Colors.companyMuted : Colors.courierMuted;

  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

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
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Verifica tu email y contraseña.';
      Alert.alert('Error de acceso', msg);
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
          <Ionicons
            name={isCompany ? 'business' : 'bicycle'}
            size={16} color={accent}
          />
          <Text style={[styles.headerBadgeText, { color: accent }]}>
            {isCompany ? 'Empresa' : 'Domiciliario'}
          </Text>
        </View>
      </View>

      {/* Hero text */}
      <View style={styles.heroText}>
        <Text style={styles.welcomeTitle}>Bienvenido</Text>
        <Text style={styles.welcomeSub}>
          {isCompany
            ? 'Gestiona tus pedidos y domiciliarios'
            : 'Tus entregas te están esperando'}
        </Text>
      </View>

      {/* Form sheet */}
      <ScrollView
        style={styles.sheet}
        contentContainerStyle={styles.sheetContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Input
          label="Email"
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
          placeholder="••••••••"
          isPassword
          leftIcon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          accentColor={accent}
        />

        <Button
          title="Ingresar"
          onPress={handleLogin}
          loading={loading}
          fullWidth
          size="lg"
          style={{ backgroundColor: accent, marginTop: 4 }}
          icon={<Ionicons name="arrow-forward" size={18} color={Colors.white} />}
          iconRight
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>¿No tienes cuenta?</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.registerBtn, { borderColor: accent, backgroundColor: accentMuted }]}
          onPress={() => navigation.navigate('Register', { role })}
          activeOpacity={0.85}
        >
          <Ionicons name="person-add-outline" size={18} color={accent} />
          <Text style={[styles.registerText, { color: accent }]}>Crear cuenta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20,
  },
  headerBadgeText: { ...Typography.caption, fontWeight: '700' },

  heroText: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 8,
  },
  welcomeTitle: { ...Typography.h1, color: Colors.white, marginBottom: 6 },
  welcomeSub:   { ...Typography.body2, color: 'rgba(255,255,255,0.75)' },

  sheet: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  sheetContent: { padding: 24, paddingBottom: 40 },

  divider: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 20, gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerLabel: { ...Typography.caption, color: Colors.textTertiary },

  registerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15,
    borderRadius: 14, borderWidth: 1.5,
  },
  registerText: { ...Typography.button },
});
