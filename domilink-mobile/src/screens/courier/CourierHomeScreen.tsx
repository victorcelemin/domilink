import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, RefreshControl, StatusBar, Alert, Switch,
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

export const CourierHomeScreen = ({ navigation }: any) => {
  const { user, logout, courierId } = useAuth();
  const [courier, setCourier]           = useState<Courier | null>(null);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders]         = useState<Order[]>([]);
  const [available, setAvailable]       = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    finally { setRefreshing(false); }
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

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.courier} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={20} color={Colors.white} />
          </View>
          <View>
            <Text style={styles.topBarLabel}>Domiciliario</Text>
            <Text style={styles.topBarName}>
              {courier ? `${courier.firstName} ${courier.lastName}` : user?.email?.split('@')[0]}
            </Text>
          </View>
        </View>
        <View style={styles.topBarRight}>
          {courier && (
            <View style={styles.ratingChip}>
              <Ionicons name="star" size={13} color={Colors.secondary} />
              <Text style={styles.ratingText}>{courier.rating.toFixed(1)}</Text>
            </View>
          )}
          <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
            <Ionicons name="log-out-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>
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
            <View style={styles.alertIconWrap}>
              <Ionicons name="person-add-outline" size={22} color={Colors.courier} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Completa tu perfil</Text>
              <Text style={styles.alertDesc}>Registra tus datos y vehículo para comenzar</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.courier} />
          </TouchableOpacity>
        )}

        {/* Toggle disponibilidad */}
        <View style={[styles.availCard, available && styles.availCardActive]}>
          <View style={styles.availLeft}>
            <View style={[styles.availDot, { backgroundColor: available ? Colors.success : Colors.error }]} />
            <View>
              <Text style={styles.availTitle}>
                {available ? 'Disponible' : 'No disponible'}
              </Text>
              <Text style={styles.availDesc}>
                {available ? 'Recibiendo pedidos' : 'Actívate para recibir pedidos'}
              </Text>
            </View>
          </View>
          <Switch
            value={available}
            onValueChange={handleToggle}
            trackColor={{ false: Colors.border, true: Colors.success + '50' }}
            thumbColor={available ? Colors.success : Colors.textDisabled}
            ios_backgroundColor={Colors.border}
          />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={20} color={Colors.courier} style={{ marginBottom: 6 }} />
            <Text style={styles.statValue}>{formatCOP(todayEarnings)}</Text>
            <Text style={styles.statLabel}>Ganancias hoy</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={20} color={Colors.courier} style={{ marginBottom: 6 }} />
            <Text style={styles.statValue}>{courier?.totalDeliveries ?? 0}</Text>
            <Text style={styles.statLabel}>Entregas</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="list-outline" size={20} color={Colors.courier} style={{ marginBottom: 6 }} />
            <Text style={styles.statValue}>{pendingOrders.length}</Text>
            <Text style={styles.statLabel}>Disponibles</Text>
          </View>
        </View>

        {/* Pedido activo */}
        {activeOrder && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pedido activo</Text>
              <View style={styles.liveDot} />
            </View>
            <OrderCard
              order={activeOrder}
              onPress={() => navigation.navigate('CourierDelivery', { orderId: activeOrder.id })}
            />
          </>
        )}

        {/* Pedidos disponibles */}
        {!activeOrder && pendingOrders.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pedidos disponibles</Text>
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
          </>
        )}

        {!activeOrder && pendingOrders.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name={available ? 'search-outline' : 'pause-circle-outline'} size={40} color={Colors.textDisabled} />
            </View>
            <Text style={styles.emptyTitle}>
              {available ? 'Sin pedidos disponibles' : 'Estás inactivo'}
            </Text>
            <Text style={styles.emptyDesc}>
              {available
                ? 'Cuando una empresa publique un pedido aparecerá aquí'
                : 'Activa tu disponibilidad para ver pedidos'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.courier },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
  },
  topBarLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  topBarLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.65)' },
  topBarName:  { ...Typography.subtitle2, color: Colors.white },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ratingChip:  {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  ratingText: { ...Typography.caption, color: Colors.white, fontWeight: '700' },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  scroll:  { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },

  alertCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: 16,
    padding: 14, marginBottom: 16,
    borderWidth: 1.5, borderColor: Colors.courierMuted,
    ...Shadow.small,
  },
  alertIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.courierMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  alertTitle: { ...Typography.subtitle2, color: Colors.textPrimary, marginBottom: 2 },
  alertDesc:  { ...Typography.caption, color: Colors.textSecondary },

  availCard: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white, borderRadius: 16,
    padding: 16, marginBottom: 14,
    borderWidth: 1.5, borderColor: Colors.border,
    ...Shadow.small,
  },
  availCardActive: { borderColor: Colors.success, backgroundColor: Colors.successLight },
  availLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  availDot:  { width: 10, height: 10, borderRadius: 5 },
  availTitle: { ...Typography.subtitle2, color: Colors.textPrimary },
  availDesc:  { ...Typography.caption, color: Colors.textSecondary },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14, padding: 12,
    alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.xs,
  },
  statValue: { ...Typography.h5, color: Colors.courier, marginBottom: 2, textAlign: 'center' },
  statLabel: { ...Typography.caption2, color: Colors.textTertiary, textAlign: 'center' },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  sectionTitle: { ...Typography.subtitle1, color: Colors.textPrimary },
  liveDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success,
  },
  sectionBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20,
  },
  sectionBadgeText: { ...Typography.caption2, color: Colors.white, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { ...Typography.h5, color: Colors.textSecondary },
  emptyDesc:  {
    ...Typography.body2, color: Colors.textTertiary,
    textAlign: 'center', maxWidth: 240,
  },
});
