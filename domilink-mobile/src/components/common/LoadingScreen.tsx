import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors, Shadow } from '../../theme/colors';
import { Typography } from '../../theme/typography';

interface LoadingScreenProps {
  message?: string;
  color?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Cargando...',
  color = Colors.primary,
}) => (
  <View style={styles.container}>
    <View style={styles.card}>
      <ActivityIndicator size="large" color={color} />
      <Text style={[styles.message, { color }]}>{message}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    ...Shadow.medium,
  },
  message: {
    ...Typography.body2,
    color: Colors.textSecondary,
  },
});
