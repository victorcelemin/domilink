import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow } from '../../theme/colors';
import { Typography } from '../../theme/typography';

const { height } = Dimensions.get('window');

export const WelcomeScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.company} />

      {/* Hero — fondo degradado índigo */}
      <View style={styles.hero}>
        {/* Círculos decorativos */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        <View style={styles.logoWrap}>
          <Ionicons name="bicycle" size={52} color={Colors.white} />
        </View>
        <Text style={styles.appName}>DomiLink</Text>
        <Text style={styles.tagline}>
          Conectamos empresas con{'\n'}domiciliarios certificados
        </Text>
      </View>

      {/* Tarjetas de acceso */}
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>¿Cómo quieres continuar?</Text>

        {/* Empresa */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Login', { role: 'COMPANY' })}
          activeOpacity={0.88}
        >
          <View style={[styles.cardIcon, { backgroundColor: Colors.companyMuted }]}>
            <Ionicons name="business" size={28} color={Colors.company} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { color: Colors.company }]}>Soy Empresa</Text>
            <Text style={styles.cardDesc}>
              Publica pedidos y gestiona entregas
            </Text>
          </View>
          <View style={[styles.cardArrow, { backgroundColor: Colors.companyMuted }]}>
            <Ionicons name="arrow-forward" size={16} color={Colors.company} />
          </View>
        </TouchableOpacity>

        {/* Domiciliario */}
        <TouchableOpacity
          style={[styles.card, styles.cardCourier]}
          onPress={() => navigation.navigate('Login', { role: 'COURIER' })}
          activeOpacity={0.88}
        >
          <View style={[styles.cardIcon, { backgroundColor: Colors.courierMuted }]}>
            <Ionicons name="bicycle" size={28} color={Colors.courier} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { color: Colors.courier }]}>Soy Domiciliario</Text>
            <Text style={styles.cardDesc}>
              Toma pedidos y gana dinero
            </Text>
          </View>
          <View style={[styles.cardArrow, { backgroundColor: Colors.courierMuted }]}>
            <Ionicons name="arrow-forward" size={16} color={Colors.courier} />
          </View>
        </TouchableOpacity>

        <Text style={styles.legal}>
          Al continuar aceptas nuestros Términos de Servicio
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.company },

  hero: {
    height: height * 0.38,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -40, right: -40,
  },
  circle2: {
    position: 'absolute',
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -20, left: -30,
  },

  logoWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
  },
  appName: {
    ...Typography.h1,
    color: Colors.white,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  tagline: {
    ...Typography.body2,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 22,
  },

  sheet: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 22,
    paddingTop: 28,
  },

  sheetTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 22,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    gap: 14,
    borderWidth: 1.5,
    borderColor: Colors.companyMuted,
    ...Shadow.medium,
  },
  cardCourier: {
    borderColor: Colors.courierMuted,
  },

  cardIcon: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cardInfo: { flex: 1 },
  cardTitle: {
    ...Typography.subtitle1,
    marginBottom: 3,
  },
  cardDesc: {
    ...Typography.body3,
    color: Colors.textSecondary,
  },
  cardArrow: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },

  legal: {
    ...Typography.caption,
    color: Colors.textDisabled,
    textAlign: 'center',
    marginTop: 'auto',
    paddingVertical: 12,
  },
});
