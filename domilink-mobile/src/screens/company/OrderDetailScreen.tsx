import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { orderApi, Order } from '../../api/orderApi';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { PromptModal } from '../../components/common/PromptModal';
import { Colors, Shadow } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import {
  formatCOP, formatDate, getOrderStatusLabel,
  getPaymentModeLabel, getPackageSizeLabel, getVehicleLabel,
} from '../../utils/formatters';

const STATUS_STEPS = ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED'];
const STATUS_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  PENDING: 'time-outline',
  ASSIGNED: 'bicycle-outline',
  IN_TRANSIT: 'navigate-outline',
  DELIVERED: 'checkmark-circle-outline',
  CANCELLED: 'close-circle-outline',
};

export const OrderDetailScreen = ({ route, navigation }: any) => {
  const { orderId } = route.params;
  const { user } = useAuth();
  const isCompany = user?.role === 'COMPANY';
  const accentColor = isCompany ? Colors.companySection : Colors.courierSection;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal de cancelación (reemplaza Alert.prompt iOS-only)
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  useEffect(() => {
    loadOrder();
    const interval = setInterval(loadOrder, 15000);
    return () => clearInterval(interval);
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const { data } = await orderApi.getById(orderId);
      setOrder(data);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  };

  const handleCancelConfirm = async (reason: string) => {
    setCancelModalVisible(false);
    if (!reason.trim()) {
      Alert.alert('Aviso', 'Debes indicar el motivo de cancelación.');
      return;
    }
    setActionLoading(true);
    try {
      await orderApi.cancel(orderId, reason.trim());
      await loadOrder();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'No se pudo cancelar');
    } finally { setActionLoading(false); }
  };

  const handleRate = async (stars: number) => {
    setRating(stars);
    Alert.alert(
      `Calificar con ${stars} estrella${stars > 1 ? 's' : ''}`,
      '¿Confirmas esta calificación?',
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => setRating(0) },
        {
          text: 'Confirmar', onPress: async () => {
            setActionLoading(true);
            try {
              await orderApi.rate(orderId, stars, '');
              await loadOrder();
              Alert.alert('¡Gracias!', 'Tu calificación fue registrada.');
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error ?? 'Error al calificar');
            } finally { setActionLoading(false); }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingScreen message="Cargando pedido..." />;
  if (!order) return null;

  const isBase = order.paymentMode === 'BASE';
  const stepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: accentColor }]}>
      <StatusBar barStyle="light-content" backgroundColor={accentColor} />

      {/* Modal de cancelación cross-platform */}
      <PromptModal
        visible={cancelModalVisible}
        title="Cancelar pedido"
        message="Indica el motivo de la cancelación:"
        placeholder="Motivo..."
        confirmText="Cancelar pedido"
        cancelText="Volver"
        destructive
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancelModalVisible(false)}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del pedido</Text>
        <View style={[
          styles.paymentBadge,
          { backgroundColor: isBase ? Colors.paymentBase : Colors.paymentPaid },
        ]}>
          <Text style={styles.paymentBadgeText}>{isBase ? 'BASE' : 'PAGADO'}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Mapa — sin PROVIDER_GOOGLE (usa OSM gratis en Android, Apple Maps en iOS) */}
        <View style={styles.mapCard}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: (order.pickupLatitude + order.deliveryLatitude) / 2,
              longitude: (order.pickupLongitude + order.deliveryLongitude) / 2,
              latitudeDelta: Math.abs(order.pickupLatitude - order.deliveryLatitude) * 2 + 0.02,
              longitudeDelta: Math.abs(order.pickupLongitude - order.deliveryLongitude) * 2 + 0.02,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            <Marker coordinate={{ latitude: order.pickupLatitude, longitude: order.pickupLongitude }}
              title="Recogida" pinColor={Colors.secondary} />
            <Marker coordinate={{ latitude: order.deliveryLatitude, longitude: order.deliveryLongitude }}
              title="Entrega" pinColor={Colors.primary} />
            <Polyline
              coordinates={[
                { latitude: order.pickupLatitude, longitude: order.pickupLongitude },
                { latitude: order.deliveryLatitude, longitude: order.deliveryLongitude },
              ]}
              strokeColor={accentColor} strokeWidth={3} lineDashPattern={[8, 4]}
            />
          </MapView>
        </View>

        {/* Barra de progreso */}
        {order.status !== 'CANCELLED' && (
          <View style={styles.progressCard}>
            {STATUS_STEPS.map((s, i) => (
              <View key={s} style={styles.progressItem}>
                <View style={styles.progressIconCol}>
                  <View style={[styles.progressDot, i <= stepIndex && { backgroundColor: accentColor }]}>
                    <Ionicons name={STATUS_ICONS[s]} size={14}
                      color={i <= stepIndex ? Colors.white : Colors.textDisabled} />
                  </View>
                  {i < STATUS_STEPS.length - 1 && (
                    <View style={[styles.progressLine, i < stepIndex && { backgroundColor: accentColor }]} />
                  )}
                </View>
                <Text style={[styles.progressLabel,
                  i === stepIndex && { color: accentColor, fontWeight: '700' }]}>
                  {getOrderStatusLabel(s)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {order.status === 'CANCELLED' && (
          <View style={styles.cancelledBox}>
            <Ionicons name="close-circle" size={22} color={Colors.error} />
            <View>
              <Text style={styles.cancelledTitle}>Pedido cancelado</Text>
              {order.cancellationReason && (
                <Text style={styles.cancelledReason}>{order.cancellationReason}</Text>
              )}
            </View>
          </View>
        )}

        {/* Info pedido */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Información del pedido</Text>
          <InfoRow icon="document-text-outline" label="Descripción" value={order.description} />
          <InfoRow icon="cube-outline" label="Tamaño" value={getPackageSizeLabel(order.packageSize)} />
          <InfoRow icon="person-outline" label="Destinatario" value={order.recipientName} />
          <InfoRow icon="call-outline" label="Teléfono" value={order.recipientPhone} />
          <InfoRow icon="navigate-outline" label="Distancia" value={`${order.distanceKm} km`} />
        </View>

        {/* Precios */}
        <View style={[styles.priceCard, isBase && styles.priceCardBase]}>
          <Text style={styles.sectionTitle}>Pago</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Modo</Text>
            <View style={[styles.modeChip, { backgroundColor: isBase ? Colors.paymentBase : Colors.paymentPaid }]}>
              <Text style={styles.modeChipText}>{getPaymentModeLabel(order.paymentMode)}</Text>
            </View>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Precio del domicilio</Text>
            <Text style={styles.priceValue}>{formatCOP(order.finalPrice)}</Text>
          </View>
          {isBase && order.baseAmount > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: Colors.paymentBase }]}>Base que lleva domiciliario</Text>
              <Text style={[styles.priceValue, { color: Colors.paymentBase }]}>{formatCOP(order.baseAmount)}</Text>
            </View>
          )}
          {order.vehicleTypeUsed && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Vehículo</Text>
              <Text style={styles.priceValue}>{getVehicleLabel(order.vehicleTypeUsed)}</Text>
            </View>
          )}
        </View>

        {/* Historial */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Historial</Text>
          <InfoRow icon="time-outline" label="Creado" value={formatDate(order.createdAt)} />
          {order.assignedAt && <InfoRow icon="bicycle-outline" label="Asignado" value={formatDate(order.assignedAt)} />}
          {order.pickedUpAt && <InfoRow icon="navigate-outline" label="Recogido" value={formatDate(order.pickedUpAt)} />}
          {order.deliveredAt && <InfoRow icon="checkmark-circle-outline" label="Entregado" value={formatDate(order.deliveredAt)} />}
        </View>

        {/* Calificar (empresa, entregado, sin calificar) */}
        {isCompany && order.status === 'DELIVERED' && !order.courierRating && (
          <View style={styles.ratingCard}>
            <Text style={styles.sectionTitle}>Califica la entrega</Text>
            <Text style={styles.ratingSubtitle}>¿Cómo fue el servicio?</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => handleRate(star)} disabled={actionLoading}>
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={38} color={star <= rating ? Colors.secondary : Colors.border}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {order.courierRating && (
          <View style={styles.ratingDoneCard}>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <Ionicons key={s}
                  name={s <= order.courierRating! ? 'star' : 'star-outline'}
                  size={22} color={s <= order.courierRating! ? Colors.secondary : Colors.border}
                />
              ))}
            </View>
            {order.ratingComment && (
              <Text style={styles.ratingComment}>"{order.ratingComment}"</Text>
            )}
          </View>
        )}

        {/* Botón cancelar */}
        {isCompany && order.status === 'PENDING' && (
          <Button
            title="Cancelar pedido"
            variant="danger" fullWidth loading={actionLoading}
            onPress={() => setCancelModalVisible(true)}
            style={{ marginTop: 8 }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoRow = ({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) => (
  <View style={infoStyles.row}>
    <Ionicons name={icon} size={16} color={Colors.textSecondary} />
    <Text style={infoStyles.label}>{label}</Text>
    <Text style={infoStyles.value} numberOfLines={2}>{value}</Text>
  </View>
);

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  label: { ...Typography.body2, color: Colors.textSecondary, flex: 1 },
  value: { ...Typography.body2, color: Colors.textPrimary, fontWeight: '600', flex: 1, textAlign: 'right' },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  headerTitle: { ...Typography.h4, color: Colors.white, flex: 1 },
  paymentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  paymentBadgeText: { ...Typography.caption, color: Colors.white, fontWeight: '800' },
  scroll: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 16, paddingBottom: 40 },
  mapCard: { borderRadius: 18, overflow: 'hidden', height: 200, marginBottom: 16, ...Shadow.medium },
  map: { flex: 1 },
  progressCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 16, ...Shadow.small },
  progressItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  progressIconCol: { alignItems: 'center', width: 32 },
  progressDot: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  progressLine: { width: 2, height: 20, backgroundColor: Colors.border, marginVertical: 4 },
  progressLabel: { ...Typography.body2, color: Colors.textSecondary, paddingTop: 6 },
  cancelledBox: {
    flexDirection: 'row', gap: 10, alignItems: 'center',
    backgroundColor: Colors.errorLight, borderRadius: 14, padding: 16, marginBottom: 16,
  },
  cancelledTitle: { ...Typography.subtitle2, color: Colors.error },
  cancelledReason: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  infoCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 14, ...Shadow.small },
  priceCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 14, ...Shadow.small, borderWidth: 1, borderColor: Colors.border },
  priceCardBase: { borderColor: Colors.paymentBase, backgroundColor: Colors.paymentBaseLight },
  sectionTitle: { ...Typography.subtitle1, color: Colors.textPrimary, marginBottom: 14 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  priceLabel: { ...Typography.body2, color: Colors.textSecondary },
  priceValue: { ...Typography.body2, color: Colors.textPrimary, fontWeight: '700' },
  modeChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  modeChipText: { ...Typography.caption, color: Colors.white, fontWeight: '800' },
  ratingCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 14, ...Shadow.small, alignItems: 'center' },
  ratingSubtitle: { ...Typography.body2, color: Colors.textSecondary, marginBottom: 16 },
  starsRow: { flexDirection: 'row', gap: 8 },
  ratingDoneCard: { backgroundColor: Colors.warningLight, borderRadius: 16, padding: 14, marginBottom: 14, alignItems: 'center', gap: 8 },
  ratingComment: { ...Typography.body2, color: Colors.textSecondary, fontStyle: 'italic', textAlign: 'center' },
});
