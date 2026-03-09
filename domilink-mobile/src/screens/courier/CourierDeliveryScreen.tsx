import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  StatusBar, Alert, Animated, Platform, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { orderApi, Order } from '../../api/orderApi';
import { courierApi } from '../../api/courierApi';
import { Button } from '../../components/common/Button';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { Colors, Shadow } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { formatCOP, formatDistance } from '../../utils/formatters';

/**
 * Pantalla tipo Uber para el domiciliario durante una entrega activa.
 * - Muestra el mapa con la ruta (nativo) o un panel de info (web)
 * - Tracking GPS activo mientras está en camino
 * - Botones de acción: recoger paquete → confirmar entrega
 * - Muestra ganancia, distancia, datos del destinatario
 */
export const CourierDeliveryScreen = ({ route, navigation }: any) => {
  const { orderId } = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [MapComponents, setMapComponents] = useState<any>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const locationSubRef = useRef<any>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Carga el mapa de forma lazy (solo en nativo)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      import('react-native-maps').then((mod) => {
        setMapComponents(mod);
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const loadOrder = useCallback(async () => {
    try {
      const { data } = await orderApi.getById(orderId);
      setOrder(data);
    } catch { /* ignorar */ }
    finally { setLoading(false); }
  }, [orderId]);

  const startLocationTracking = async () => {
    if (Platform.OS === 'web') return;
    try {
      const Location = await import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      locationSubRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 15 },
        async (loc) => {
          try {
            await courierApi.updateLocation(loc.coords.latitude, loc.coords.longitude, true);
          } catch { /* ignorar */ }
        }
      );
    } catch { /* ignorar */ }
  };

  useEffect(() => {
    loadOrder();
    startLocationTracking();
    pollIntervalRef.current = setInterval(loadOrder, 12000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      locationSubRef.current?.remove();
    };
  }, [loadOrder]);

  const openNavigation = (lat: number, lng: number, label: string) => {
    const url = Platform.OS === 'ios'
      ? `maps://app?daddr=${lat},${lng}`
      : `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    });
  };

  const handleMarkPickup = () => {
    Alert.alert(
      '¿Ya tienes el paquete?',
      `Confirma que recogiste el paquete en:\n${order?.pickupAddress}`,
      [
        { text: 'Aún no', style: 'cancel' },
        {
          text: 'Sí, ya lo tengo',
          onPress: async () => {
            setActionLoading(true);
            try {
              await orderApi.markInTransit(orderId);
              await loadOrder();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error ?? 'No se pudo actualizar');
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
        ? `¿Confirmaste la entrega a ${order?.recipientName} y cobraste ${formatCOP(order?.baseAmount ?? 0)}?`
        : `¿Entregaste el paquete a ${order?.recipientName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar entrega',
          style: 'default',
          onPress: async () => {
            setActionLoading(true);
            try {
              await orderApi.markDelivered(orderId);
              locationSubRef.current?.remove();
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              Alert.alert(
                '¡Entrega completada!',
                `Ganaste ${formatCOP(order?.finalPrice ?? 0)}.\n¡Excelente trabajo!`,
                [{ text: 'Ver inicio', onPress: () => navigation.navigate('CourierHome') }]
              );
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error ?? 'No se pudo confirmar la entrega');
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
  const targetLat = isAssigned ? order.pickupLatitude : order.deliveryLatitude;
  const targetLng = isAssigned ? order.pickupLongitude : order.deliveryLongitude;
  const targetAddress = isAssigned ? order.pickupAddress : order.deliveryAddress;

  const renderMap = () => {
    if (Platform.OS === 'web' || !MapComponents) {
      // Web o mapa no disponible: panel de info con ruta
      return (
        <View style={styles.webMapPanel}>
          <View style={styles.webMapHeader}>
            <Ionicons name="navigate-circle" size={28} color={Colors.courier} />
            <Text style={styles.webMapTitle}>
              {isAssigned ? 'Dirígete a recoger' : 'Lleva el paquete a destino'}
            </Text>
          </View>

          {/* Ruta visual */}
          <View style={styles.routeCard}>
            <View style={styles.routeStep}>
              <View style={[styles.routeStepDot, { backgroundColor: Colors.company }]} />
              <View style={styles.routeStepInfo}>
                <Text style={styles.routeStepLabel}>Recogida</Text>
                <Text style={styles.routeStepAddress}>{order.pickupAddress}</Text>
              </View>
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => openNavigation(order.pickupLatitude, order.pickupLongitude, 'Recogida')}
              >
                <Ionicons name="navigate" size={14} color={Colors.company} />
              </TouchableOpacity>
            </View>

            <View style={styles.routeSeparator} />

            <View style={styles.routeStep}>
              <View style={[styles.routeStepDot, { backgroundColor: Colors.error }]} />
              <View style={styles.routeStepInfo}>
                <Text style={styles.routeStepLabel}>Destino — {order.recipientName}</Text>
                <Text style={styles.routeStepAddress}>{order.deliveryAddress}</Text>
              </View>
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => openNavigation(order.deliveryLatitude, order.deliveryLongitude, 'Destino')}
              >
                <Ionicons name="navigate" size={14} color={Colors.error} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.openMapsBtn}
            onPress={() => openNavigation(targetLat, targetLng, targetAddress)}
          >
            <Ionicons name="map-outline" size={18} color={Colors.white} />
            <Text style={styles.openMapsBtnText}>Abrir en Maps</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const { default: RNMapView, Marker, Polyline } = MapComponents;

    return (
      <>
        <RNMapView
          style={StyleSheet.absoluteFill}
          showsUserLocation
          followsUserLocation
          initialRegion={{
            latitude: targetLat,
            longitude: targetLng,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          <Marker
            coordinate={{ latitude: order.pickupLatitude, longitude: order.pickupLongitude }}
            title="Recogida"
            pinColor="#F59E0B"
          />
          <Marker
            coordinate={{ latitude: order.deliveryLatitude, longitude: order.deliveryLongitude }}
            title={`Entregar a ${order.recipientName}`}
            pinColor="#DC2626"
          />
          <Polyline
            coordinates={[
              { latitude: order.pickupLatitude, longitude: order.pickupLongitude },
              { latitude: order.deliveryLatitude, longitude: order.deliveryLongitude },
            ]}
            strokeColor={Colors.courier}
            strokeWidth={4}
            lineDashPattern={[10, 6]}
          />
        </RNMapView>

        {/* Header flotante sobre el mapa */}
        <SafeAreaView style={styles.floatingHeaderWrap}>
          <View style={styles.floatingHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.floatingBackBtn}>
              <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.floatingHeaderInfo}>
              <Text style={styles.floatingHeaderTitle}>
                {isAssigned ? 'Ve a recoger' : 'En camino al destino'}
              </Text>
              <Text style={styles.floatingHeaderSub} numberOfLines={1}>{targetAddress}</Text>
            </View>
            <View style={[styles.paymentBadge, {
              backgroundColor: isBase ? Colors.paymentBase : Colors.paymentPaid,
            }]}>
              <Text style={styles.paymentBadgeText}>{isBase ? 'BASE' : 'PAGADO'}</Text>
            </View>
          </View>
        </SafeAreaView>
      </>
    );
  };

  const BottomPanel = (
    <View style={[
      styles.bottomPanel,
      Platform.OS !== 'web' && MapComponents && styles.bottomPanelAbsolute,
    ]}>
      {/* Monto a cobrar (modo BASE) */}
      {isBase && isInTransit && (
        <View style={styles.collectBanner}>
          <Ionicons name="cash" size={20} color={Colors.paymentBase} />
          <Text style={styles.collectBannerText}>
            Cobra <Text style={{ fontWeight: '900' }}>{formatCOP(order.baseAmount ?? 0)}</Text> al entregar
          </Text>
        </View>
      )}

      {/* Ganancia + distancia */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Animated.Text style={[styles.earningAmount, { transform: [{ scale: pulseAnim }] }]}>
            {formatCOP(order.finalPrice)}
          </Animated.Text>
          <Text style={styles.metricLabel}>Tus ganancias</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.distanceAmount}>{formatDistance(order.distanceKm)}</Text>
          <Text style={styles.metricLabel}>Distancia</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <TouchableOpacity
            style={styles.phoneBtn}
            onPress={() => Linking.openURL(`tel:${order.recipientPhone}`)}
          >
            <Ionicons name="call" size={16} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.metricLabel}>{order.recipientPhone}</Text>
        </View>
      </View>

      {/* Info destinatario */}
      {isInTransit && (
        <View style={styles.recipientCard}>
          <Ionicons name="person-circle-outline" size={22} color={Colors.company} />
          <View style={{ flex: 1 }}>
            <Text style={styles.recipientName}>{order.recipientName}</Text>
            <Text style={styles.recipientAddr} numberOfLines={1}>{order.deliveryAddress}</Text>
          </View>
          <TouchableOpacity
            style={styles.mapsBtn}
            onPress={() => openNavigation(order.deliveryLatitude, order.deliveryLongitude, order.recipientName)}
          >
            <Ionicons name="navigate-outline" size={16} color={Colors.company} />
          </TouchableOpacity>
        </View>
      )}

      {/* Botones de acción */}
      {isAssigned && (
        <Button
          title="Ya recogí el paquete"
          fullWidth size="lg"
          loading={actionLoading}
          onPress={handleMarkPickup}
          style={{ backgroundColor: Colors.courier }}
          icon={<Ionicons name="cube-outline" size={20} color={Colors.white} />}
        />
      )}
      {isInTransit && (
        <Button
          title="Confirmar entrega"
          fullWidth size="lg"
          loading={actionLoading}
          onPress={handleMarkDelivered}
          style={{ backgroundColor: Colors.success }}
          icon={<Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />}
        />
      )}
    </View>
  );

  // Layout web: flujo normal (no full-screen map)
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.courierDeep} />
        <View style={styles.webHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.webBackBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.webHeaderTitle}>
            {isAssigned ? 'Ir a recoger' : 'En camino'}
          </Text>
          <View style={[styles.paymentBadge, {
            backgroundColor: isBase ? Colors.paymentBase : Colors.paymentPaid,
          }]}>
            <Text style={styles.paymentBadgeText}>{isBase ? 'BASE' : 'PAGADO'}</Text>
          </View>
        </View>
        {renderMap()}
        {BottomPanel}
      </SafeAreaView>
    );
  }

  // Layout nativo: mapa full-screen + panel flotante
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderMap()}
      {BottomPanel}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, backgroundColor: Colors.courierDeep },

  // Web header
  webHeader: {
    backgroundColor: Colors.courier,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 10,
  },
  webBackBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  webHeaderTitle: { ...Typography.subtitle1, color: Colors.white, flex: 1 },

  // Floating header (nativo sobre mapa)
  floatingHeaderWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
  },
  floatingHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 14, marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 16, padding: 12, gap: 10,
    ...Shadow.medium,
  },
  floatingBackBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  floatingHeaderInfo: { flex: 1 },
  floatingHeaderTitle: { ...Typography.subtitle2, color: Colors.textPrimary },
  floatingHeaderSub: { ...Typography.caption, color: Colors.textSecondary },

  paymentBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  paymentBadgeText: { ...Typography.caption2, color: Colors.white, fontWeight: '800' },

  // Web map panel
  webMapPanel: {
    backgroundColor: Colors.white,
    margin: 16, borderRadius: 20, padding: 18, gap: 14,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.medium,
  },
  webMapHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  webMapTitle: { ...Typography.subtitle1, color: Colors.textPrimary, flex: 1 },

  routeCard: {
    backgroundColor: Colors.background,
    borderRadius: 14, padding: 14, gap: 4,
  },
  routeStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeStepDot: { width: 12, height: 12, borderRadius: 6 },
  routeStepInfo: { flex: 1 },
  routeStepLabel: { ...Typography.caption2, color: Colors.textTertiary, fontWeight: '700' },
  routeStepAddress: { ...Typography.caption, color: Colors.textPrimary },
  navBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.small,
  },
  routeSeparator: { height: 12, width: 1, backgroundColor: Colors.border, marginLeft: 5 },

  openMapsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.courier,
    borderRadius: 14, paddingVertical: 12,
    ...Shadow.colored(Colors.courier),
  },
  openMapsBtnText: { ...Typography.button, color: Colors.white },

  // Bottom panel
  bottomPanel: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 28,
    gap: 12,
  },
  bottomPanelAbsolute: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    ...Shadow.large,
  },

  // Collect banner (BASE mode)
  collectBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.paymentBaseLight,
    borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: Colors.paymentBase + '50',
  },
  collectBannerText: { ...Typography.body2, color: Colors.paymentBase, flex: 1 },

  // Metrics
  metricsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 16, padding: 14,
  },
  metricItem: { flex: 1, alignItems: 'center', gap: 3 },
  metricDivider: { width: 1, height: 40, backgroundColor: Colors.border },
  earningAmount: {
    fontSize: 20, fontWeight: '900', color: Colors.courier, letterSpacing: -0.3,
  },
  distanceAmount: { ...Typography.h5, color: Colors.company },
  metricLabel: { ...Typography.caption2, color: Colors.textTertiary },
  phoneBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: Colors.success,
    alignItems: 'center', justifyContent: 'center',
  },

  // Recipient card
  recipientCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.companyMuted,
    borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: Colors.company + '25',
  },
  recipientName: { ...Typography.subtitle2, color: Colors.textPrimary },
  recipientAddr: { ...Typography.caption, color: Colors.textSecondary },
  mapsBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.small,
  },
});
