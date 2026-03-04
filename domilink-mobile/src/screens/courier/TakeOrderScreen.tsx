import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { orderApi, Order } from '../../api/orderApi';
import { courierApi, Courier } from '../../api/courierApi';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { Colors, Shadow } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import {
  formatCOP, formatDistance,
  getPackageSizeLabel, getPaymentModeLabel, getVehicleLabel,
} from '../../utils/formatters';

export const TakeOrderScreen = ({ route, navigation }: any) => {
  const { orderId } = route.params;
  const { courierId } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [courier, setCourier] = useState<Courier | null>(null);
  const [loading, setLoading] = useState(true);
  const [taking, setTaking] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [orderRes, courierRes] = await Promise.all([
          orderApi.getById(orderId),
          courierApi.getMyCourier().catch(() => null),
        ]);
        setOrder(orderRes.data);
        if (courierRes) setCourier(courierRes.data);
      } catch { /* ignorar */ }
      finally { setLoading(false); }
    };
    load();
  }, [orderId]);

  const handleTakeOrder = async () => {
    if (!courier || !courierId) {
      Alert.alert('Error', 'No tienes perfil de domiciliario registrado.');
      return;
    }
    if (courier.status !== 'ACTIVE') {
      Alert.alert('Cuenta inactiva', 'Tu cuenta debe estar activa para tomar pedidos.');
      return;
    }

    const isBase = order?.paymentMode === 'BASE';

    Alert.alert(
      isBase ? '⚠️ Pedido con BASE' : '✅ Confirmar pedido',
      isBase
        ? `Este pedido sale con base de ${formatCOP(order?.baseAmount ?? 0)}.\n\nDeberás llevar ese dinero para pagar el domicilio al recoger el paquete. Tu ganancia es el precio del servicio: ${formatCOP(order?.finalPrice ?? 0)}.`
        : `El pago ya fue recibido por la empresa.\n\nSolo debes entregar el paquete en la dirección indicada. Tu pago: ${formatCOP(order?.finalPrice ?? 0)}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Tomar pedido',
          onPress: confirmTakeOrder,
        },
      ]
    );
  };

  const confirmTakeOrder = async () => {
    if (!courier || !courierId || !order) return;
    setTaking(true);
    try {
      await orderApi.assign(orderId, courierId, courier.vehicleType);
      Alert.alert(
        '¡Pedido tomado!',
        'Dirígete al punto de recogida.',
        [{ text: 'Ver en mapa', onPress: () => navigation.replace('CourierDelivery', { orderId }) }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'No se pudo tomar el pedido. Quizás ya fue tomado.');
    } finally {
      setTaking(false);
    }
  };

  if (loading) return <LoadingScreen message="Cargando pedido..." />;
  if (!order) return null;

  const isBase = order.paymentMode === 'BASE';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.courierSection} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles del pedido</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Mapa ruta */}
        <View style={styles.mapCard}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: (order.pickupLatitude + order.deliveryLatitude) / 2,
              longitude: (order.pickupLongitude + order.deliveryLongitude) / 2,
              latitudeDelta: Math.abs(order.pickupLatitude - order.deliveryLatitude) * 2.5 + 0.01,
              longitudeDelta: Math.abs(order.pickupLongitude - order.deliveryLongitude) * 2.5 + 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker
              coordinate={{ latitude: order.pickupLatitude, longitude: order.pickupLongitude }}
              title="Recogida"
              pinColor={Colors.secondary}
            />
            <Marker
              coordinate={{ latitude: order.deliveryLatitude, longitude: order.deliveryLongitude }}
              title="Entrega"
              pinColor={Colors.primary}
            />
            <Polyline
              coordinates={[
                { latitude: order.pickupLatitude, longitude: order.pickupLongitude },
                { latitude: order.deliveryLatitude, longitude: order.deliveryLongitude },
              ]}
              strokeColor={Colors.courierSection}
              strokeWidth={3}
              lineDashPattern={[8, 4]}
            />
          </MapView>
        </View>

        {/* Banner MODO de PAGO - muy visible */}
        <View style={[
          styles.paymentBanner,
          isBase ? styles.paymentBannerBase : styles.paymentBannerPaid,
        ]}>
          <Ionicons
            name={isBase ? 'cash-outline' : 'checkmark-circle-outline'}
            size={28}
            color={isBase ? Colors.paymentBase : Colors.paymentPaid}
          />
          <View style={{ flex: 1 }}>
            <Text style={[
              styles.paymentBannerTitle,
              { color: isBase ? Colors.paymentBase : Colors.paymentPaid },
            ]}>
              {isBase ? 'Salida con BASE' : 'Pago ya realizado'}
            </Text>
            <Text style={styles.paymentBannerDesc}>
              {isBase
                ? `Debes llevar $${formatCOP(order.baseAmount ?? 0)} para pagar el domicilio. Tus ganancias: ${formatCOP(order.finalPrice)}`
                : `El cliente ya pagó. Solo entrega el paquete. Tus ganancias: ${formatCOP(order.finalPrice)}`}
            </Text>
          </View>
        </View>

        {/* Precio destacado */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Tus ganancias</Text>
          <Text style={styles.earningsValue}>{formatCOP(order.finalPrice)}</Text>
          <Text style={styles.earningsDistance}>
            {formatDistance(order.distanceKm)} · {getVehicleLabel(courier?.vehicleType ?? '')}
          </Text>
        </View>

        {/* Ruta */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Ruta del domicilio</Text>

          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: Colors.secondary }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>Punto de recogida</Text>
              <Text style={styles.routeAddress}>{order.pickupAddress}</Text>
            </View>
          </View>
          <View style={[styles.routeConnector]} />
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>Entregar a: {order.recipientName}</Text>
              <Text style={styles.routeAddress}>{order.deliveryAddress}</Text>
              <Text style={styles.routePhone}>📞 {order.recipientPhone}</Text>
            </View>
          </View>
        </View>

        {/* Detalles del paquete */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Paquete</Text>
          <View style={styles.detailRow}>
            <Ionicons name="cube-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>Tamaño</Text>
            <Text style={styles.detailValue}>{getPackageSizeLabel(order.packageSize)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>Descripción</Text>
            <Text style={styles.detailValue}>{order.description}</Text>
          </View>
        </View>

        {/* Boton tomar */}
        {order.status === 'PENDING' ? (
          <Button
            title={isBase ? `Tomar pedido (llevar ${formatCOP(order.baseAmount ?? 0)})` : 'Tomar pedido'}
            fullWidth
            size="lg"
            loading={taking}
            onPress={handleTakeOrder}
            style={{
              backgroundColor: isBase ? Colors.paymentBase : Colors.courierSection,
              marginTop: 8,
            }}
            icon={<Ionicons name="bicycle" size={22} color={Colors.white} />}
          />
        ) : (
          <View style={styles.takenBanner}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.info} />
            <Text style={styles.takenText}>Este pedido ya fue tomado por otro domiciliario.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.courierSection },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  headerTitle: { ...Typography.h4, color: Colors.white },
  scroll: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 16, paddingBottom: 40 },

  mapCard: {
    borderRadius: 18, overflow: 'hidden',
    height: 180, marginBottom: 14, ...Shadow.medium,
  },
  map: { flex: 1 },

  paymentBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderRadius: 16, padding: 16, marginBottom: 14,
    borderWidth: 2,
  },
  paymentBannerBase: {
    backgroundColor: Colors.paymentBaseLight,
    borderColor: Colors.paymentBase,
  },
  paymentBannerPaid: {
    backgroundColor: Colors.paymentPaidLight,
    borderColor: Colors.paymentPaid,
  },
  paymentBannerTitle: { ...Typography.subtitle1, marginBottom: 4 },
  paymentBannerDesc: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },

  earningsCard: {
    backgroundColor: Colors.courierSection, borderRadius: 16,
    padding: 18, marginBottom: 14, alignItems: 'center',
    ...Shadow.medium,
  },
  earningsLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  earningsValue: { fontSize: 32, fontWeight: '800', color: Colors.white },
  earningsDistance: { ...Typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  infoCard: {
    backgroundColor: Colors.white, borderRadius: 16,
    padding: 16, marginBottom: 14, ...Shadow.small,
  },
  cardTitle: { ...Typography.subtitle1, color: Colors.textPrimary, marginBottom: 14 },

  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  routeDot: { width: 12, height: 12, borderRadius: 6, marginTop: 3, flexShrink: 0 },
  routeConnector: {
    width: 2, height: 20, backgroundColor: Colors.border,
    marginLeft: 5, marginVertical: 4,
  },
  routeLabel: { ...Typography.caption, color: Colors.textSecondary },
  routeAddress: { ...Typography.body2, color: Colors.textPrimary, fontWeight: '600' },
  routePhone: { ...Typography.caption, color: Colors.primary, marginTop: 2 },

  detailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  detailLabel: { ...Typography.body2, color: Colors.textSecondary, flex: 1 },
  detailValue: { ...Typography.body2, color: Colors.textPrimary, fontWeight: '600' },

  takenBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.infoLight, borderRadius: 14, padding: 14,
  },
  takenText: { ...Typography.body2, color: Colors.info, flex: 1 },
});
