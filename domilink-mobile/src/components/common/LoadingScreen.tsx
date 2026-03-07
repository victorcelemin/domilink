import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';

interface LoadingScreenProps {
  message?: string;
  color?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Iniciando DomiLink...',
  color = Colors.company,
}) => {
  const logoScale  = useRef(new Animated.Value(0.8)).current;
  const logoOpacity= useRef(new Animated.Value(0)).current;
  const dot1       = useRef(new Animated.Value(0.3)).current;
  const dot2       = useRef(new Animated.Value(0.3)).current;
  const dot3       = useRef(new Animated.Value(0.3)).current;
  const bgScale    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrada del logo
    Animated.parallel([
      Animated.spring(logoScale,  { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(logoOpacity,{ toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(bgScale,    { toValue: 1, tension: 40, friction: 10, useNativeDriver: true }),
    ]).start();

    // Animación de los dots
    const animateDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.delay(800 - delay),
        ])
      );

    Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, 150),
      animateDot(dot3, 300),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: color }]}>
      {/* Orbes de fondo */}
      <View style={[styles.orb1, { backgroundColor: 'rgba(255,255,255,0.07)' }]} />
      <View style={[styles.orb2, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />

      {/* Logo animado */}
      <Animated.View style={[styles.logoWrap, {
        opacity: logoOpacity,
        transform: [{ scale: logoScale }],
      }]}>
        {/* Ring exterior */}
        <Animated.View style={[styles.bgRing, {
          transform: [{ scale: bgScale }],
          borderColor: 'rgba(255,255,255,0.15)',
        }]} />

        <View style={styles.logoBox}>
          <View style={styles.logoInner}>
            <Ionicons name="bicycle" size={48} color={Colors.white} />
          </View>
        </View>
      </Animated.View>

      {/* Wordmark */}
      <Animated.View style={{ opacity: logoOpacity }}>
        <View style={styles.wordmarkRow}>
          <Text style={styles.wordmarkMain}>Domi</Text>
          <View style={styles.wordmarkAccentBox}>
            <Text style={styles.wordmarkAccent}>Link</Text>
          </View>
        </View>
      </Animated.View>

      {/* Mensaje */}
      <Animated.Text style={[styles.message, { opacity: logoOpacity }]}>
        {message}
      </Animated.Text>

      {/* Dots loader */}
      <Animated.View style={[styles.dotsRow, { opacity: logoOpacity }]}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[styles.dot, { opacity: dot, transform: [{ scale: dot }] }]}
          />
        ))}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },

  orb1: {
    position: 'absolute', top: -80, right: -80,
    width: 280, height: 280, borderRadius: 140,
  },
  orb2: {
    position: 'absolute', bottom: -60, left: -60,
    width: 200, height: 200, borderRadius: 100,
  },

  logoWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 8 },

  bgRing: {
    position: 'absolute',
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 1.5,
  },

  logoBox: {
    width: 110, height: 110, borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoInner: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wordmarkMain: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -1,
  },
  wordmarkAccentBox: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  wordmarkAccent: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -1,
  },

  message: {
    ...Typography.body2,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.3,
  },

  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
});
