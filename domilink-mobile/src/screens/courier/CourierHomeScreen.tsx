import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, RefreshControl, StatusBar, Alert, Switch, Animated,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { orderApi, Order } from '../../api/orderApi';
import { courierApi, Courier } from '../../api/courierApi';
import { OrderCard } from '../../components/common/OrderCard';
import { Colors, Shadow } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { formatCOP } from '../../utils/formatters';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { WebDashboardLayout } from '../../components/common/WebContainer';
import { WebSidebar } from '../../components/common/WebSidebar';

export const CourierHomeScreen = ({ navigation }: any) => {
  const { user, logout, courierId } = useAuth();
  const [courier, setCourier]             = useState<Courier | null>(null);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders]           = useState<Order[]>([]);
  const [available, setAvailable]         = useState(false);
  const [refreshing, setRefreshing]       = useState(false);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animaciones
  const headerAnim = useRef(new Animated.Value(0)).current;
  const toggleScale = useRef(new Animated.Value(1)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulso del indicador de disponibilidad
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    if (available) pulse.start();
    else pulse.stop();
    return () => pulse.stop();
  }, [available]);

  const loadData = useCallback(async () => {
    try {
      const [pendingRes, myRes, courierRes] = await Promise.all([
        orderApi.getPending(),
        orderApi.getMyOrders(),
        courierApi.getMyCourier().catch(() => null),
      ]);
      setPendingOrders(pendingRes.data);
      setMyOrders(myRes.data);
      if (courierRes) {
        setCourier(courierRes.data);
        setAvailable(courierRes.data.available);
      }
    } catch { /* silencioso */ }
    finally {
      setRefreshing(false);
      Animated.spring(headerAnim, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }).start();
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (available && courier?.status === 'ACTIVE') startTracking();
    else stopTracking();
    return () => stopTracking();
  }, [available, courier?.status]);

  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    locationIntervalRef.current = setInterval(async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await courierApi.updateLocation(loc.coords.latitude, loc.coords.longitude, available);
      } catch { /* ignorar */ }
    }, 30000);
  };

  const stopTracking = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  };

  const handleToggle = async (value: boolean) => {
    if (!courier) {
      Alert.alert('Perfil incompleto', 'Completa tu perfil antes de activarte.');
      return;
    }
    if (courier.status !== 'ACTIVE') {
      Alert.alert('Cuenta pendiente', 'Tu cuenta debe estar activa.');
      return;
    }
    // Animación del toggle
    Animated.sequence([
      Animated.timing(toggleScale, { toValue: 0.92, duration: 100, useNativeDriver: true }),
      Animated.spring(toggleScale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
    ]).start();

    setAvailable(value);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null);
      await courierApi.updateLocation(loc?.coords.latitude ?? 0, loc?.coords.longitude ?? 0, value);
    } catch { /* ignorar */ }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  const activeOrder = myOrders.find(o => ['ASSIGNED', 'IN_TRANSIT'].includes(o.status));

  const todayEarnings = myOrders
    .filter(o => {
      if (o.status !== 'DELIVERED' || !o.deliveredAt) return false;
      return new Date(o.deliveredAt).toDateString() === new Date().toDateString();
    })
    .reduce((sum, o) => sum + o.finalPrice, 0);

  const totalDeliveries = courier?.totalDeliveries ?? 0;
  const rating = courier?.rating ?? 0;
  const courierFullName = courier
    ? `${courier.firstName} ${courier.lastName}`
    : user?.email?.split('@')[0] ?? 'Courier';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  const { isLarge } = useBreakpoint();

  const webNavItems = [
    { key: 'home',     label: 'Inicio',         icon: 'home-outline' as const,    iconActive: 'home' as const,           onPress: () => {} },
    { key: 'orders',   label: 'Mis entregas',    icon: 'list-outline' as const,    iconActive: 'list' as const,           onPress: () => {}, badge: activeOrder ? 1 : 0 },
    { key: 'available',label: 'Disponibles',     icon: 'flash-outline' as const,   iconActive: 'flash' as const,          onPress: () => {}, badge: pendingOrders.length },
    { key: 'profile',  label: 'Mi perfil',       icon: 'person-outline' as const,  iconActive: 'person' as const,         onPress: () => navigation.navigate('CourierProfile') },
  ];

  const MainContent = (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.courierDeep} />

      {/* ── Top Bar ── */}
      <View style={[styles.topBar, available && styles.topBarActive]}>
        <View style={styles.topBarOrb1} />
        <View style={styles.topBarOrb2} />

        <Animated.View style={[styles.topBarContent, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0,1], outputRange: [-10, 0] }) }],
        }]}>
          {/* Fila superior */}
          <View style={styles.topRow}>
            <View style={styles.topLeft}>
              <TouchableOpacity
                style={styles.avatarBtn}
                onPress={() => navigation.navigate('CourierProfile')}
              >
                <View style={styles.avatarCircle}>
                  <Ionicons name="person" size={22} color={Colors.white} />
                </View>
                <View style={[styles.avatarOnline, { backgroundColor: available ? Colors.courierLight : '#EF4444' }]} />
              </TouchableOpacity>
              <View>
                <Text style={styles.greetingText}>{greeting}</Text>
                <Text style={styles.courierName}>{courierFullName}</Text>
              </View>
            </View>

            <View style={styles.topActions}>
              {courier && (
                <View style={styles.ratingChip}>
                  <Ionicons name="star" size={12} color="#FCD34D" />
                  <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                </View>
              )}
              <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
                <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Toggle de disponibilidad (diseño premium) ── */}
          <Animated.View style={[styles.toggleCard, { transform: [{ scale: toggleScale }] }]}>
            <View style={styles.toggleLeft}>
              {/* Indicador pulsante */}
              <View style={styles.pulseContainer}>
                {available && (
                  <Animated.View style={[styles.pulseRing, {
                    transform: [{ scale: pulseAnim }],
                    opacity: pulseAnim.interpolate({ inputRange: [1, 1.4], outputRange: [0.5, 0] }),
                  }]} />
                )}
                <View style={[styles.statusDot, {
                  backgroundColor: available ? Colors.courierLight : '#EF4444',
                }]} />
              </View>

              <View>
                <Text style={styles.toggleTitle}>
                  {available ? 'Estás disponible' : 'Estás inactivo'}
                </Text>
                <Text style={styles.toggleDesc}>
                  {available ? 'Recibiendo pedidos en tiempo real' : 'Actívate para recibir pedidos'}
                </Text>
              </View>
            </View>

            <Switch
              value={available}
              onValueChange={handleToggle}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(255,255,255,0.35)' }}
              thumbColor={available ? Colors.white : 'rgba(255,255,255,0.6)'}
              ios_backgroundColor="rgba(255,255,255,0.2)"
            />
          </Animated.View>
        </Animated.View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(); }}
            tintColor={Colors.courier} colors={[Colors.courier]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Sin perfil */}
        {!courier && (
          <TouchableOpacity
            style={styles.alertCard}
            onPress={() => navigation.navigate('CourierProfile')}
            activeOpacity={0.88}
          >
            <View style={styles.alertStripe} />
            <View style={styles.alertIconWrap}>
              <Ionicons name="person-add-outline" size={22} color={Colors.courier} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Completa tu perfil de courier</Text>
              <Text style={styles.alertDesc}>Registra tus datos y vehículo para comenzar</Text>
            </View>
            <View style={styles.alertArrow}>
              <Ionicons name="arrow-forward" size={14} color={Colors.courier} />
            </View>
          </TouchableOpacity>
        )}

        {/* ── Stats en 3 columnas ── */}
        <View style={styles.statsRow}>
          {/* Ganancias hoy */}
          <View style={[styles.statCard, styles.statCardEarnings]}>
            <View style={styles.statIconWrap}>
              <Ionicons name="cash-outline" size={18} color={Colors.courier} />
            </View>
            <Text style={[styles.statValue, { color: Colors.courier }]} numberOfLines={1}>
              {formatCOP(todayEarnings)}
            </Text>
            <Text style={styles.statLabel}>Hoy</Text>
          </View>

          {/* Total entregas */}
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: Colors.company + '15' }]}>
              <Ionicons name="checkmark-done-outline" size={18} color={Colors.company} />
            </View>
            <Text style={[styles.statValue, { color: Colors.company }]}>{totalDeliveries}</Text>
            <Text style={styles.statLabel}>Entregas</Text>
          </View>

          {/* Pedidos disponibles */}
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: Colors.secondary + '18' }]}>
              <Ionicons name="list-outline" size={18} color={Colors.secondary} />
            </View>
            <Text style={[styles.statValue, { color: Colors.secondary }]}>{pendingOrders.length}</Text>
            <Text style={styles.statLabel}>Disponibles</Text>
          </View>
        </View>

        {/* ── Pedido activo ── */}
        {activeOrder && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.liveDot}>
                  <Animated.View style={[styles.livePulse, { transform: [{ scale: pulseAnim }] }]} />
                </View>
                <Text style={styles.sectionTitle}>Pedido activo</Text>
              </View>
              <View style={[styles.sectionBadge, { backgroundColor: Colors.courier }]}>
                <Ionicons name="navigate" size={10} color={Colors.white} />
                <Text style={styles.sectionBadgeText}>En curso</Text>
              </View>
            </View>
            <OrderCard
              order={activeOrder}
              onPress={() => navigation.navigate('CourierDelivery', { orderId: activeOrder.id })}
            />
          </View>
        )}

        {/* ── Pedidos disponibles ── */}
        {!activeOrder && pendingOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionDot, { backgroundColor: Colors.courier }]} />
                <Text style={styles.sectionTitle}>Pedidos disponibles</Text>
              </View>
              <View style={[styles.sectionBadge, { backgroundColor: Colors.courier }]}>
                <Text style={styles.sectionBadgeText}>{pendingOrders.length}</Text>
              </View>
            </View>
            {pendingOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onPress={() => navigation.navigate('TakeOrder', { orderId: order.id })}
              />
            ))}
          </View>
        )}

        {/* Estado vacío */}
        {!activeOrder && pendingOrders.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIllustration}>
              <View style={[styles.emptyIconBg, { backgroundColor: available ? Colors.courierMuted : Colors.surfaceElevated }]}>
                <Ionicons
                  name={available ? 'search-outline' : 'pause-circle-outline'}
                  size={44}
                  color={available ? Colors.courier : Colors.textDisabled}
                />
              </View>
              <View style={[styles.emptyDot, { top: 8, right: 14, backgroundColor: Colors.courierMuted, borderColor: Colors.courier + '40' }]} />
              <View style={[styles.emptyDot, { bottom: 6, left: 10, backgroundColor: Colors.companyMuted, borderColor: Colors.company + '40' }]} />
            </View>
            <Text style={styles.emptyTitle}>
              {available ? 'Sin pedidos por ahora' : 'Estás inactivo'}
            </Text>
            <Text style={styles.emptyDesc}>
              {available
                ? 'Cuando una empresa publique un pedido\naparecerá aquí al instante'
                : 'Activa tu disponibilidad para\ncomenzar a recibir pedidos'}
            </Text>
            {!available && (
              <TouchableOpacity
                style={styles.emptyActivateBtn}
                onPress={() => handleToggle(true)}
              >
                <Ionicons name="flash" size={16} color={Colors.white} />
                <Text style={styles.emptyActivateBtnText}>Activarme ahora</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  if (isLarge) {
    return (
      <WebDashboardLayout
        sidebarWidth={260}
        sidebar={
          <WebSidebar
            role="COURIER"
            userName={courierFullName}
            userEmail={user?.email}
            status={courier?.status}
            rating={rating}
            navItems={webNavItems}
            activeKey="home"
            onLogout={logout}
          />
        }
      >
        {MainContent}
      </WebDashboardLayout>
    );
  }

  return MainContent;
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.courierDeep },

  // ── Top Bar ───────────────────────────────────────────────────
  topBar: {
    backgroundColor: Colors.courier,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  topBarActive: {
    backgroundColor: Colors.courierDark,
  },
  topBarOrb1: {
    position: 'absolute', top: -60, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: Colors.courierAccent, opacity: 0.3,
  },
  topBarOrb2: {
    position: 'absolute', bottom: -30, left: -40,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: Colors.courierDeep, opacity: 0.45,
  },
  topBarContent: { paddingHorizontal: 18, paddingTop: 14 },

  topRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 18,
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  avatarBtn: { position: 'relative' },
  avatarCircle: {
    width: 46, height: 46, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarOnline: {
    position: 'absolute', bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: Colors.courier,
  },

  greetingText: { ...Typography.caption, color: 'rgba(255,255,255,0.6)', marginBottom: 1 },
  courierName:  { ...Typography.subtitle1, color: Colors.white },

  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  ratingText: { ...Typography.caption, color: Colors.white, fontWeight: '800' },
  iconBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Toggle card ───────────────────────────────────────────────
  toggleCard: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },

  // Pulse indicator
  pulseContainer: {
    width: 20, height: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.courierLight,
  },
  statusDot: {
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },

  toggleTitle: { ...Typography.subtitle2, color: Colors.white, marginBottom: 2 },
  toggleDesc:  { ...Typography.caption, color: 'rgba(255,255,255,0.65)' },

  // ── Content ───────────────────────────────────────────────────
  scroll:  { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 44 },

  // Alert card
  alertCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: 18,
    padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.courierMuted,
    overflow: 'hidden',
    ...Shadow.medium,
  },
  alertStripe: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: 4, backgroundColor: Colors.courier,
  },
  alertIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.courierMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  alertTitle: { ...Typography.subtitle2, color: Colors.textPrimary, marginBottom: 2 },
  alertDesc:  { ...Typography.caption, color: Colors.textSecondary },
  alertArrow: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.courierMuted,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Stats ────────────────────────────────────────────────────
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16, padding: 12,
    alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.small,
    gap: 4,
  },
  statCardEarnings: {
    borderColor: Colors.courierMuted,
    backgroundColor: Colors.courierMuted,
    borderWidth: 1.5,
  },
  statIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.courier + '15',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: { ...Typography.h5, marginBottom: 1, textAlign: 'center' },
  statLabel: { ...Typography.caption2, color: Colors.textTertiary, textAlign: 'center' },

  // ── Section ───────────────────────────────────────────────────
  section: { marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionDot: { width: 4, height: 18, borderRadius: 2 },
  sectionTitle: { ...Typography.subtitle1, color: Colors.textPrimary },

  // Live dot
  liveDot: {
    width: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  livePulse: {
    position: 'absolute',
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.success, opacity: 0.4,
  },

  sectionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20,
  },
  sectionBadgeText: { ...Typography.caption2, color: Colors.white, fontWeight: '800' },

  // ── Empty state ───────────────────────────────────────────────
  empty: { alignItems: 'center', paddingVertical: 52, gap: 10 },
  emptyIllustration: {
    position: 'relative',
    width: 100, height: 100,
    marginBottom: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyIconBg: {
    width: 90, height: 90, borderRadius: 28,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyDot: {
    position: 'absolute',
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5,
  },
  emptyTitle: { ...Typography.h5, color: Colors.textSecondary },
  emptyDesc:  {
    ...Typography.body2, color: Colors.textTertiary,
    textAlign: 'center', lineHeight: 22,
  },
  emptyActivateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.courier,
    paddingHorizontal: 22, paddingVertical: 12,
    borderRadius: 14, marginTop: 12,
    ...Shadow.colored(Colors.courier),
  },
  emptyActivateBtnText: { ...Typography.button, color: Colors.white, fontSize: 14 },
});
