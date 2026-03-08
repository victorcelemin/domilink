import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, StatusBar, Alert, ActivityIndicator, Platform,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { orderApi, PaymentMode, PackageSize, PriceEstimate } from '../../api/orderApi';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { PaymentModeSelector } from '../../components/common/PaymentModeSelector';
import { Colors, Shadow } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { formatCOP, formatDistance } from '../../utils/formatters';

type Step = 'map' | 'details' | 'payment' | 'confirm';

const PACKAGE_SIZES: { value: PackageSize; label: string; icon: string }[] = [
  { value: 'SMALL', label: 'Pequeño', icon: 'mail-outline' },
  { value: 'MEDIUM', label: 'Mediano', icon: 'cube-outline' },
  { value: 'LARGE', label: 'Grande', icon: 'archive-outline' },
  { value: 'EXTRA_LARGE', label: 'Extra grande', icon: 'car-outline' },
];

export const CreateOrderScreen = ({ navigation }: any) => {
  const { companyId } = useAuth();
  const mapRef = useRef<MapView>(null);

  const [step, setStep] = useState<Step>('map');
  const [selectingPoint, setSelectingPoint] = useState<'pickup' | 'delivery'>('pickup');

  // Coordenadas
  const [pickup, setPickup] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [delivery, setDelivery] = useState<{ lat: number; lng: number; address: string } | null>(null);

  // Detalles del pedido
  const [description, setDescription] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [packageSize, setPackageSize] = useState<PackageSize>('SMALL');

  // Pago
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('PAID');
  const [baseAmount, setBaseAmount] = useState('');

  // Precio estimado
  const [estimate, setEstimate] = useState<PriceEstimate | null>(null);
  const [estimating, setEstimating] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Centrar mapa en ubicacion actual (solo nativo — maps no disponibles en web)
  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      const Location = await import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      mapRef.current?.animateToRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 800);
    })();
  }, []);

  // Estimar precio cuando ambos puntos están listos
  useEffect(() => {
    if (pickup && delivery) fetchEstimate();
  }, [pickup, delivery, packageSize]);

  const fetchEstimate = async () => {
    if (!pickup || !delivery) return;
    setEstimating(true);
    try {
      const { data } = await orderApi.estimatePrice(
        pickup.lat, pickup.lng,
        delivery.lat, delivery.lng,
        packageSize
      );
      setEstimate(data);
    } catch { /* ignorar */ }
    finally { setEstimating(false); }
  };

  const handleMapPress = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const address = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

    if (selectingPoint === 'pickup') {
      setPickup({ lat: latitude, lng: longitude, address });
      setSelectingPoint('delivery');
    } else {
      setDelivery({ lat: latitude, lng: longitude, address });
    }
  };

  const validateDetails = () => {
    const e: Record<string, string> = {};
    if (!description.trim()) e.description = 'Describe el paquete';
    if (!recipientName.trim()) e.recipientName = 'Nombre del destinatario requerido';
    if (!recipientPhone.trim()) e.recipientPhone = 'Teléfono requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!pickup || !delivery) { Alert.alert('Error', 'Selecciona los puntos en el mapa'); return; }
    if (!validateDetails()) { setStep('details'); return; }
    if (paymentMode === 'BASE' && (!baseAmount || Number(baseAmount) <= 0)) {
      Alert.alert('Error', 'Ingresa el monto de la base que llevará el domiciliario');
      return;
    }

    setSubmitting(true);
    try {
      await orderApi.create({
        pickupAddress: pickup.address,
        pickupLatitude: pickup.lat,
        pickupLongitude: pickup.lng,
        deliveryAddress: delivery.address,
        deliveryLatitude: delivery.lat,
        deliveryLongitude: delivery.lng,
        description: description.trim(),
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        packageSize,
        paymentMode,
        baseAmount: paymentMode === 'BASE' ? Number(baseAmount) : undefined,
      });
      Alert.alert(
        '¡Pedido publicado!',
        'Tu pedido está disponible para los domiciliarios.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'No se pudo crear el pedido');
    } finally {
      setSubmitting(false);
    }
  };

  // ── STEP: MAP (o formulario de direcciones en web) ────────────
  if (step === 'map') {
    // En web los mapas no están disponibles — mostrar formulario de texto
    if (Platform.OS === 'web') {
      return (
        <SafeAreaView style={styles.safe}>
          <StatusBar barStyle="light-content" backgroundColor={Colors.companySection} />
          <View style={styles.stepHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.stepHeaderTitle}>Puntos del domicilio</Text>
            <Text style={styles.stepCounter}>1/3</Text>
          </View>

          <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
            <View style={styles.webMapInfo}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.webMapInfoText}>
                Ingresa las direcciones manualmente. El mapa interactivo está disponible en la app móvil.
              </Text>
            </View>

            <Input
              label="Dirección de recogida"
              placeholder="Calle 10 # 20-30, Bogotá"
              leftIcon="location-outline"
              value={pickup?.address ?? ''}
              onChangeText={(text) => setPickup({ lat: 4.6097, lng: -74.0817, address: text })}
              accentColor={Colors.secondary}
            />
            <Input
              label="Dirección de entrega"
              placeholder="Carrera 15 # 45-60, Bogotá"
              leftIcon="navigate-outline"
              value={delivery?.address ?? ''}
              onChangeText={(text) => setDelivery({ lat: 4.6200, lng: -74.0650, address: text })}
              accentColor={Colors.primary}
            />

            <View style={styles.webMapNote}>
              <Ionicons name="map-outline" size={14} color={Colors.textTertiary} />
              <Text style={styles.webMapNoteText}>
                Las coordenadas aproximadas de Bogotá se usarán para el cálculo de distancia.
              </Text>
            </View>

            {estimating && (
              <View style={styles.estimateRow}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.estimateText}>Calculando precio...</Text>
              </View>
            )}
            {estimate && !estimating && (
              <View style={styles.estimateBox}>
                <Text style={styles.estimateTitle}>
                  Distancia estimada: {formatDistance(estimate.distanceKm)}
                </Text>
                <View style={styles.estimatePrices}>
                  <Text style={styles.estimatePrice}>🏍 {formatCOP(estimate.motorcyclePrice)}</Text>
                  <Text style={styles.estimatePrice}>🚲 {formatCOP(estimate.bicyclePrice)}</Text>
                  <Text style={styles.estimatePrice}>🚗 {formatCOP(estimate.carPrice)}</Text>
                </View>
              </View>
            )}

            <Button
              title="Continuar"
              fullWidth
              disabled={!pickup?.address || !delivery?.address}
              onPress={() => setStep('details')}
              style={{ backgroundColor: Colors.companySection, marginTop: 8 }}
              icon={<Ionicons name="arrow-forward" size={18} color={Colors.white} />}
            />
          </ScrollView>
        </SafeAreaView>
      );
    }

    // Nativo: mapa interactivo completo
    return (
      <View style={styles.mapContainer}>
        <StatusBar barStyle="dark-content" />

        {/* Header flotante */}
        <SafeAreaView style={styles.mapHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.mapBackBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.mapHeaderTitle}>Seleccionar ubicaciones</Text>
        </SafeAreaView>

        {/* Instruccion */}
        <View style={styles.mapInstruction}>
          <View style={[
            styles.instructionDot,
            { backgroundColor: selectingPoint === 'pickup' ? Colors.secondary : Colors.primary },
          ]} />
          <Text style={styles.instructionText}>
            {selectingPoint === 'pickup'
              ? 'Toca el mapa para marcar el punto de RECOGIDA'
              : 'Toca el mapa para marcar el punto de ENTREGA'}
          </Text>
        </View>

        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          onPress={handleMapPress}
          initialRegion={{
            latitude: 4.6097,
            longitude: -74.0817,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {pickup && (
            <Marker
              coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
              title="Recogida"
              pinColor={Colors.secondary}
            />
          )}
          {delivery && (
            <Marker
              coordinate={{ latitude: delivery.lat, longitude: delivery.lng }}
              title="Entrega"
              pinColor={Colors.primary}
            />
          )}
          {pickup && delivery && (
            <Polyline
              coordinates={[
                { latitude: pickup.lat, longitude: pickup.lng },
                { latitude: delivery.lat, longitude: delivery.lng },
              ]}
              strokeColor={Colors.primary}
              strokeWidth={3}
              lineDashPattern={[8, 4]}
            />
          )}
        </MapView>

        {/* Panel inferior */}
        <View style={styles.mapBottomPanel}>
          {/* Resumen de puntos */}
          <View style={styles.pointsContainer}>
            <View style={styles.pointRow}>
              <View style={[styles.pointDot, { backgroundColor: Colors.secondary }]} />
              <Text style={styles.pointLabel}>
                {pickup ? pickup.address : 'Sin seleccionar'}
              </Text>
            </View>
            <View style={[styles.pointLine, { backgroundColor: Colors.border }]} />
            <View style={styles.pointRow}>
              <View style={[styles.pointDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.pointLabel}>
                {delivery ? delivery.address : 'Sin seleccionar'}
              </Text>
            </View>
          </View>

          {/* Estimado de precio */}
          {estimating && (
            <View style={styles.estimateRow}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.estimateText}>Calculando precio...</Text>
            </View>
          )}
          {estimate && !estimating && (
            <View style={styles.estimateBox}>
              <Text style={styles.estimateTitle}>
                Distancia: {formatDistance(estimate.distanceKm)}
              </Text>
              <View style={styles.estimatePrices}>
                <Text style={styles.estimatePrice}>
                  🏍 {formatCOP(estimate.motorcyclePrice)}
                </Text>
                <Text style={styles.estimatePrice}>
                  🚲 {formatCOP(estimate.bicyclePrice)}
                </Text>
                <Text style={styles.estimatePrice}>
                  🚗 {formatCOP(estimate.carPrice)}
                </Text>
              </View>
            </View>
          )}

          <Button
            title="Continuar"
            fullWidth
            disabled={!pickup || !delivery}
            onPress={() => setStep('details')}
            style={{ backgroundColor: Colors.companySection }}
          />

          {(pickup || delivery) && (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                setPickup(null);
                setDelivery(null);
                setSelectingPoint('pickup');
                setEstimate(null);
              }}
            >
              <Text style={styles.resetText}>Reiniciar puntos</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ── STEP: DETAILS ─────────────────────────────────────────
  if (step === 'details') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.companySection} />
        <View style={styles.stepHeader}>
          <TouchableOpacity onPress={() => setStep('map')}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.stepHeaderTitle}>Detalles del pedido</Text>
          <Text style={styles.stepCounter}>2/3</Text>
        </View>

        <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
          {/* Tamaño del paquete */}
          <Text style={styles.fieldLabel}>Tamaño del paquete</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            {PACKAGE_SIZES.map(ps => (
              <TouchableOpacity
                key={ps.value}
                style={[styles.sizeOption, packageSize === ps.value && styles.sizeOptionSelected]}
                onPress={() => setPackageSize(ps.value)}
              >
                <Ionicons
                  name={ps.icon as any}
                  size={22}
                  color={packageSize === ps.value ? Colors.white : Colors.primary}
                />
                <Text style={[
                  styles.sizeLabel,
                  packageSize === ps.value && styles.sizeLabelSelected,
                ]}>{ps.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Input
            label="Descripción del paquete"
            placeholder="Ej: Camiseta talla M, color azul"
            value={description}
            onChangeText={setDescription}
            leftIcon="document-text-outline"
            error={errors.description}
            multiline
          />
          <Input
            label="Nombre del destinatario"
            placeholder="Juan Pérez"
            value={recipientName}
            onChangeText={setRecipientName}
            leftIcon="person-outline"
            error={errors.recipientName}
            autoCapitalize="words"
          />
          <Input
            label="Teléfono del destinatario"
            placeholder="3001234567"
            value={recipientPhone}
            onChangeText={setRecipientPhone}
            leftIcon="call-outline"
            keyboardType="phone-pad"
            error={errors.recipientPhone}
          />
          <Input
            label="Dirección de recogida (confirmación)"
            value={pickup?.address ?? ''}
            editable={false}
            leftIcon="location-outline"
            containerStyle={{ opacity: 0.7 }}
          />
          <Input
            label="Dirección de entrega (confirmación)"
            value={delivery?.address ?? ''}
            editable={false}
            leftIcon="navigate-outline"
            containerStyle={{ opacity: 0.7 }}
          />

          <Button
            title="Configurar pago"
            fullWidth
            onPress={() => { if (validateDetails()) setStep('payment'); }}
            style={{ backgroundColor: Colors.companySection, marginTop: 8 }}
            icon={<Ionicons name="arrow-forward" size={18} color={Colors.white} />}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── STEP: PAYMENT ─────────────────────────────────────────
  if (step === 'payment') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.companySection} />
        <View style={styles.stepHeader}>
          <TouchableOpacity onPress={() => setStep('details')}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.stepHeaderTitle}>Modo de pago</Text>
          <Text style={styles.stepCounter}>3/3</Text>
        </View>

        <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
          <PaymentModeSelector selected={paymentMode} onChange={setPaymentMode} />

          {paymentMode === 'BASE' && (
            <Input
              label="Monto de la base (COP)"
              placeholder="Ej: 50000"
              keyboardType="numeric"
              leftIcon="cash-outline"
              value={baseAmount}
              onChangeText={setBaseAmount}
              error={errors.baseAmount}
            />
          )}

          {/* Resumen de precio */}
          {estimate && (
            <View style={styles.priceSummaryCard}>
              <Text style={styles.priceSummaryTitle}>Resumen del pedido</Text>
              <View style={styles.priceSummaryRow}>
                <Text style={styles.priceSummaryLabel}>Distancia estimada</Text>
                <Text style={styles.priceSummaryValue}>{formatDistance(estimate.distanceKm)}</Text>
              </View>
              <View style={styles.priceSummaryRow}>
                <Text style={styles.priceSummaryLabel}>Precio (moto)</Text>
                <Text style={styles.priceSummaryValue}>{formatCOP(estimate.motorcyclePrice)}</Text>
              </View>
              {paymentMode === 'BASE' && Number(baseAmount) > 0 && (
                <View style={[styles.priceSummaryRow, { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8 }]}>
                  <Text style={[styles.priceSummaryLabel, { fontWeight: '700' }]}>Base que lleva domiciliario</Text>
                  <Text style={[styles.priceSummaryValue, { color: Colors.paymentBase, fontWeight: '700' }]}>
                    {formatCOP(Number(baseAmount))}
                  </Text>
                </View>
              )}
            </View>
          )}

          <Button
            title="Publicar pedido"
            fullWidth
            loading={submitting}
            onPress={handleSubmit}
            style={{ backgroundColor: Colors.companySection, marginTop: 8 }}
            icon={<Ionicons name="send-outline" size={18} color={Colors.white} />}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.companySection },
  mapContainer: { flex: 1, backgroundColor: Colors.white },
  mapHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.95)', gap: 12,
    ...Shadow.medium,
  },
  mapBackBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  mapHeaderTitle: { ...Typography.subtitle1, color: Colors.textPrimary },
  mapInstruction: {
    position: 'absolute', top: 90, left: 16, right: 16, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    ...Shadow.small,
  },
  instructionDot: { width: 10, height: 10, borderRadius: 5 },
  instructionText: { ...Typography.body2, color: Colors.textPrimary, flex: 1 },

  mapBottomPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 32,
    ...Shadow.large,
  },
  pointsContainer: { marginBottom: 14 },
  pointRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  pointDot: { width: 12, height: 12, borderRadius: 6, flexShrink: 0 },
  pointLine: { width: 2, height: 10, marginLeft: 5 },
  pointLabel: { ...Typography.body2, color: Colors.textPrimary, flex: 1 },

  estimateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  estimateText: { ...Typography.caption, color: Colors.textSecondary },
  estimateBox: { backgroundColor: Colors.background, borderRadius: 12, padding: 12, marginBottom: 14 },
  estimateTitle: { ...Typography.subtitle2, color: Colors.textPrimary, marginBottom: 6 },
  estimatePrices: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  estimatePrice: { ...Typography.body2, color: Colors.primary },

  resetBtn: { alignItems: 'center', paddingTop: 10 },
  resetText: { ...Typography.caption, color: Colors.textSecondary, textDecorationLine: 'underline' },

  // ── Web map fallback ──────────────────────────────────────────
  webMapInfo: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.infoLight, borderRadius: 12,
    padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.infoBorder,
  },
  webMapInfoText: { ...Typography.caption, color: Colors.info, flex: 1, lineHeight: 18 },
  webMapNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginBottom: 16, paddingHorizontal: 4,
  },
  webMapNoteText: { ...Typography.caption2, color: Colors.textTertiary, flex: 1, lineHeight: 16 },

  stepHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
    backgroundColor: Colors.companySection,
  },
  stepHeaderTitle: { ...Typography.h4, color: Colors.white, flex: 1 },
  stepCounter: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  stepScroll: { flex: 1, backgroundColor: Colors.white },
  stepContent: { padding: 20, paddingBottom: 40 },

  fieldLabel: { ...Typography.subtitle2, color: Colors.textPrimary, marginBottom: 10 },
  sizeOption: {
    alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 14, borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.white, marginRight: 10, minWidth: 80,
  },
  sizeOptionSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sizeLabel: { ...Typography.caption, color: Colors.textPrimary },
  sizeLabelSelected: { color: Colors.white, fontWeight: '700' },

  priceSummaryCard: {
    backgroundColor: Colors.background, borderRadius: 14,
    padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  priceSummaryTitle: { ...Typography.subtitle1, color: Colors.textPrimary, marginBottom: 12 },
  priceSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceSummaryLabel: { ...Typography.body2, color: Colors.textSecondary },
  priceSummaryValue: { ...Typography.body2, color: Colors.textPrimary, fontWeight: '600' },
});
