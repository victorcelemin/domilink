import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  StatusBar, Animated, Platform, ActivityIndicator, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { orderApi, Order } from '../../api/orderApi';
import { courierApi, CourierLocation } from '../../api/courierApi';
import { Colors, Shadow, orderStatusColor } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { formatCOP, getOrderStatusLabel } from '../../utils/formatters';

/**
 * Pantalla de seguimiento en tiempo real del domiciliario.
 * Muestra el mapa con la ubicación del domiciliario actualizada cada 15 segundos.
 * En la plataforma web muestra una tarjeta con las coordenadas (no hay mapa nativo).
 */
export const OrderTrackingScreen = ({ route, navigation }: any) => {
  const { orderId } = route.params as { orderId: string };

  const [order, setOrder] = useState<Order | null>(null);
  const [courierLocation, setCourierLocation] = useState<CourierLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pulsado del indicador de "en vivo"
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.35, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const { data: orderData } = await orderApi.getById(orderId);
      setOrder(orderData);

      if (orderData.courierId) {
        try {
          const { data: loc } = await courierApi.getCourierLocation(orderData.courierId);
          setCourierLocation(loc);
          setLastUpdate(new Date());
        } catch {
          // El courier quizá no tiene ubicación aún
        }
      }
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchData();
    // Actualizar cada 15 segundos
    intervalRef.current = setInterval(fetchData, 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  // Mostrar mapa solo en nativo
  const [MapView, setMapView] = useState<any>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') {
      import('react-native-maps').then((mod) => {
        setMapView(mod);
      }).catch(() => {});
    }
  }, []);

  const openMapsApp = () => {
    if (!courierLocation) return;
    const { latitude, longitude } = courierLocation;
    const url = Platform.OS === 'ios'
      ? `maps://app?daddr=${latitude},${longitude}`
      : `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps?q=${latitude},${longitude}`);
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={Colors.company} />
          <Text style={styles.loadingText}>Cargando seguimiento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = order ? orderStatusColor(order.status) : Colors.company;
  const isActive = order && ['ASSIGNED', 'IN_TRANSIT'].includes(order.status);

  const renderMap = () => {
    if (Platform.OS === 'web' || !MapView) {
      // Web: tarjeta con coordenadas y enlace a Google Maps
      return (
        <View style={styles.webMapPlaceholder}>
          <View style={styles.webMapIcon}>
            <Ionicons name="map" size={48} color={Colors.company} />
          </View>
          {courierLocation ? (
            <>
              <Text style={styles.webMapTitle}>Domiciliario en ruta</Text>
              <Text style={styles.webMapCoords}>
                Lat: {courierLocation.latitude.toFixed(6)}{'\n'}
                Lon: {courierLocation.longitude.toFixed(6)}
              </Text>
              <TouchableOpacity style={styles.openMapsBtn} onPress={openMapsApp}>
                <Ionicons name="navigate" size={16} color={Colors.white} />
                <Text style={styles.openMapsBtnText}>Abrir en Google Maps</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.webMapNoLocation}>
              {isActive
                ? 'El domiciliario aún no ha compartido su ubicación'
                : 'Ubicación no disponible'}
            </Text>
          )}
        </View>
      );
    }

    const { default: RNMapView, Marker } = MapView;
    const lat = courierLocation?.latitude ?? (order?.pickupLatitude ?? 4.6097);
    const lng = courierLocation?.longitude ?? (order?.pickupLongitude ?? -74.0817);

    return (
      <RNMapView
        style={styles.map}
        initialRegion={{
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        region={courierLocation ? {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        } : undefined}
      >
        {/* Marcador del domiciliario */}
        {courierLocation && (
          <Marker
            coordinate={{ latitude: lat, longitude: lng }}
            title={courierLocation.name}
            description={`Vehículo: ${courierLocation.vehicleType ?? ''}`}
          />
        )}
        {/* Marcador del destino */}
        {order && (
          <Marker
            coordinate={{
              latitude: order.deliveryLatitude,
              longitude: order.deliveryLongitude,
            }}
            title="Destino"
            description={order.deliveryAddress}
            pinColor="red"
          />
        )}
      </RNMapView>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.companyDeep} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Seguimiento en vivo</Text>
          {isActive && (
            <View style={styles.liveChip}>
              <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={styles.liveText}>EN VIVO</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={fetchData} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Mapa */}
      <View style={styles.mapContainer}>
        {renderMap()}
      </View>

      {/* Panel inferior */}
      <View style={styles.panel}>
        {/* Estado del pedido */}
        <View style={styles.panelRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.panelStatus, { color: statusColor }]}>
            {order ? getOrderStatusLabel(order.status) : '—'}
          </Text>
          {lastUpdate && (
            <Text style={styles.panelUpdated}>
              Actualizado: {lastUpdate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>

        {/* Domiciliario */}
        {courierLocation && (
          <View style={styles.courierRow}>
            <View style={styles.courierIconWrap}>
              <Ionicons
                name={courierLocation.vehicleType === 'CAR' ? 'car' :
                      courierLocation.vehicleType === 'BICYCLE' ? 'bicycle' : 'bicycle'}
                size={20} color={Colors.courier}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.courierName}>{courierLocation.name}</Text>
              <Text style={styles.courierVehicle}>{courierLocation.vehicleType}</Text>
            </View>
            <TouchableOpacity style={styles.mapLinkBtn} onPress={openMapsApp}>
              <Ionicons name="navigate-outline" size={16} color={Colors.company} />
              <Text style={styles.mapLinkText}>Ver mapa</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Resumen del pedido */}
        {order && (
          <View style={styles.orderSummary}>
            <View style={styles.summaryRow}>
              <Ionicons name="location" size={14} color={Colors.company} />
              <Text style={styles.summaryText} numberOfLines={1}>{order.pickupAddress}</Text>
            </View>
            <View style={styles.summaryArrow}>
              <Ionicons name="arrow-down" size={12} color={Colors.textTertiary} />
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="location" size={14} color={Colors.error} />
              <Text style={styles.summaryText} numberOfLines={1}>{order.deliveryAddress}</Text>
            </View>
            <View style={styles.summaryFooter}>
              <Text style={styles.summaryDistance}>{order.distanceKm.toFixed(1)} km</Text>
              <Text style={styles.summaryPrice}>{formatCOP(order.finalPrice)}</Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.companyDeep },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { ...Typography.body2, color: Colors.textSecondary },

  // Header
  header: {
    backgroundColor: Colors.company,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { ...Typography.subtitle1, color: Colors.white },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  liveDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.courierLight,
  },
  liveText: { ...Typography.caption2, color: Colors.white, fontWeight: '800' },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Mapa
  mapContainer: { flex: 1 },
  map: { flex: 1 },

  // Web placeholder
  webMapPlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background, gap: 12, padding: 24,
  },
  webMapIcon: {
    width: 90, height: 90, borderRadius: 28,
    backgroundColor: Colors.companyMuted,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  webMapTitle: { ...Typography.h5, color: Colors.textPrimary },
  webMapCoords: {
    ...Typography.body2, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 22,
  },
  webMapNoLocation: {
    ...Typography.body2, color: Colors.textTertiary,
    textAlign: 'center',
  },
  openMapsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.company,
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 14, marginTop: 8,
    ...Shadow.colored(Colors.company),
  },
  openMapsBtnText: { ...Typography.button, color: Colors.white },

  // Panel
  panel: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20,
    gap: 14,
    ...Shadow.large,
  },
  panelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  panelStatus: { ...Typography.subtitle1, flex: 1 },
  panelUpdated: { ...Typography.caption2, color: Colors.textTertiary },

  // Courier row
  courierRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.courierMuted,
    borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: Colors.courier + '25',
  },
  courierIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.small,
  },
  courierName: { ...Typography.subtitle2, color: Colors.textPrimary },
  courierVehicle: { ...Typography.caption, color: Colors.textSecondary },
  mapLinkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.white,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.company + '40',
  },
  mapLinkText: { ...Typography.caption2, color: Colors.company, fontWeight: '700' },

  // Order summary
  orderSummary: {
    backgroundColor: Colors.background,
    borderRadius: 14, padding: 12, gap: 6,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryText: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },
  summaryArrow: { paddingLeft: 4 },
  summaryFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 4, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  summaryDistance: { ...Typography.caption, color: Colors.textTertiary },
  summaryPrice: { ...Typography.subtitle2, color: Colors.company, fontWeight: '800' },
});
