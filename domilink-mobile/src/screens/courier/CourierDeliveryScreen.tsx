import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  StatusBar, Alert, Animated,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { orderApi, Order } from '../../api/orderApi';
import { courierApi } from '../../api/courierApi';
import { Button } from '../../components/common/Button';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { Colors, Shadow } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { formatCOP, formatDistance } from '../../utils/formatters';

export const CourierDeliveryScreen = ({ route, navigation }: any) => {
  const { orderId } = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const mapRef = useRef<MapView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // C4 FIX: guardar la suscripción para limpiarla al desmontar
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    loadOrder();
    startLocationTracking();
    startPulse();

    const pollInterval = setInterval(loadOrder, 10000);

    // C4 FIX: cleanup correcto
    return () => {
      clearInterval(pollInterval);
      locationSubRef.current?.remove();
    };
  }, [orderId]);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  };

  const loadOrder = async () => {
    try {
      const { data } = await orderApi.getById(orderId);
      setOrder(data);
    } catch { /* ignorar */ }
    finally { setLoading(false); }
  };

  const startLocationTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    // C4 FIX: guardar referencia de suscripción
    locationSubRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 20 },
      async (loc) => {
        try {
          await courierApi.updateLocation(loc.coords.latitude, loc.coords.longitude, true);
        } catch { /* ignorar */ }
      }
    );
  };

  const handleMarkPickup = () => {
    Alert.alert(
      '¿Recogiste el paquete?',
      `Confirma que ya tienes el paquete y te diriges a la entrega.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, ya lo tengo', onPress: async () => {
            setActionLoading(true);
            try {
              await orderApi.markInTransit(orderId);
              await loadOrder();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error ?? 'Error al actualizar');
            } finally { setActionLoading(false); }
          },
        },
      ]
    );
  };

  const handleMarkDelivered = () => {
    const isBase = order?.paymentMode === 'BASE';
    Alert.alert(
      '¿Entregaste el paquete?',
      isBase
        ? `Confirma la entrega a ${order?.recipientName} y que cobraste el domicilio.\nTus ganancias serán registradas.`
        : `Confirma que entregaste el paquete a ${order?.recipientName}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar entrega', onPress: async () => {
            setActionLoading(true);
            try {
              await orderApi.markDelivered(orderId);
              await loadOrder();
              // Detener tracking al terminar la entrega
              locationSubRef.current?.remove();
              Alert.alert(
                '¡Entrega completada! 🎉',
                `Ganaste ${formatCOP(order?.finalPrice ?? 0)}. ¡Sigue así!`,
                [{ text: 'Volver al inicio', onPress: () => navigation.navigate('CourierHome') }]
              );
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error ?? 'Error al confirmar entrega');
            } finally { setActionLoading(false); }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingScreen message="Cargando tu entrega..." />;
  if (!order) return null;

  const isBase = order.paymentMode === 'BASE';
  const isAssigned = order.status === 'ASSIGNED';
  const isInTransit = order.status === 'IN_TRANSIT';
  const targetCoords = isAssigned
    ? { latitude: order.pickupLatitude, longitude: order.pickupLongitude }
    : { latitude: order.deliveryLatitude, longitude: order.deliveryLongitude };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* C5 FIX: Sin PROVIDER_GOOGLE — usa OSM en Android (gratis), Apple Maps en iOS (gratis) */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        showsUserLocation
        followsUserLocation
        initialRegion={{
          latitude: targetCoords.latitude,
          longitude: targetCoords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <Marker
          coordinate={{ latitude: order.pickupLatitude, longitude: order.pickupLongitude }}
          title="Recogida" pinColor={Colors.secondary}
        />
        <Marker
          coordinate={{ latitude: order.deliveryLatitude, longitude: order.deliveryLongitude }}
          title={`Entregar a ${order.recipientName}`} pinColor={Colors.primary}
        />
        <Polyline
          coordinates={[
            { latitude: order.pickupLatitude, longitude: order.pickupLongitude },
            { latitude: order.deliveryLatitude, longitude: order.deliveryLongitude },
          ]}
          strokeColor={Colors.courierSection} strokeWidth={4} lineDashPattern={[10, 5]}
        />
      </MapView>

      {/* Header flotante */}
      <SafeAreaView style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              {isAssigned ? '📍 Ir a recoger' : '🚀 En camino'}
            </Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {isAssigned ? order.pickupAddress : order.deliveryAddress}
            </Text>
          </View>
          <View style={[styles.paymentChip, { backgroundColor: isBase ? Colors.paymentBase : Colors.paymentPaid }]}>
            <Text style={styles.paymentChipText}>{isBase ? 'BASE' : 'PAGO'}</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Panel inferior */}
      <View style={styles.bottomPanel}>
        {isBase && isInTransit && (
          <View style={styles.baseWarning}>
            <Ionicons name="cash-outline" size={18} color={Colors.paymentBase} />
            <Text style={styles.baseWarningText}>
              Recuerda cobrar {formatCOP(order.baseAmount ?? 0)} al entregar
            </Text>
          </View>
        )}

        <View style={styles.earningsRow}>
          <View>
            <Text style={styles.earningsLabel}>Tus ganancias</Text>
            <Animated.Text style={[styles.earningsValue, { transform: [{ scale: pulseAnim }] }]}>
              {formatCOP(order.finalPrice)}
            </Animated.Text>
          </View>
          <View style={styles.distanceInfo}>
            <Ionicons name="navigate-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.distanceText}>{formatDistance(order.distanceKm)}</Text>
          </View>
        </View>

        {isInTransit && (
          <View style={styles.recipientRow}>
            <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.recipientText}>{order.recipientName} · {order.recipientPhone}</Text>
          </View>
        )}

        {isAssigned && (
          <Button title="Ya recogí el paquete" fullWidth size="lg" loading={actionLoading}
            onPress={handleMarkPickup} style={{ backgroundColor: Colors.courierSection }}
            icon={<Ionicons name="cube-outline" size={20} color={Colors.white} />}
          />
        )}
        {isInTransit && (
          <Button title="Confirmar entrega" fullWidth size="lg" loading={actionLoading}
            onPress={handleMarkDelivered} style={{ backgroundColor: Colors.success }}
            icon={<Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 16, padding: 12, gap: 10, ...Shadow.medium,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  headerTitle: { ...Typography.subtitle1, color: Colors.textPrimary },
  headerSub: { ...Typography.caption, color: Colors.textSecondary },
  paymentChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  paymentChipText: { ...Typography.caption, color: Colors.white, fontWeight: '800' },
  bottomPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36, ...Shadow.large,
  },
  baseWarning: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.paymentBaseLight, borderRadius: 12, padding: 12, marginBottom: 14,
    borderWidth: 1, borderColor: Colors.paymentBase + '40',
  },
  baseWarningText: { ...Typography.body2, color: Colors.paymentBase, flex: 1, fontWeight: '600' },
  earningsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  earningsLabel: { ...Typography.caption, color: Colors.textSecondary },
  earningsValue: { fontSize: 30, fontWeight: '800', color: Colors.courierSection },
  distanceInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  distanceText: { ...Typography.body2, color: Colors.textSecondary },
  recipientRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  recipientText: { ...Typography.body2, color: Colors.textPrimary },
});
