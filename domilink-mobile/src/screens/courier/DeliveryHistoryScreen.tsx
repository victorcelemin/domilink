import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, RefreshControl, StatusBar, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { orderApi, Order } from '../../api/orderApi';
import { Colors, Shadow, orderStatusColor } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { formatCOP, getOrderStatusLabel } from '../../utils/formatters';

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const vehicleIcon = (vt?: string) => {
  if (!vt) return 'bicycle';
  if (vt === 'CAR') return 'car';
  if (vt === 'MOTORCYCLE') return 'bicycle';
  if (vt === 'WALKING') return 'walk';
  return 'bicycle';
};

export const DeliveryHistoryScreen = ({ navigation }: any) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const { data } = await orderApi.getMyOrders();
      // Ordenar: más recientes primero
      const sorted = [...data].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrders(sorted);
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const delivered = orders.filter(o => o.status === 'DELIVERED');
  const cancelled = orders.filter(o => o.status === 'CANCELLED');
  const totalEarned = delivered.reduce((sum, o) => sum + o.finalPrice, 0);
  const avgRating = delivered.filter(o => o.courierRating)
    .reduce((sum, o, _, arr) =>
      sum + (o.courierRating ?? 0) / arr.length, 0);

  const renderItem = ({ item: order }: { item: Order }) => {
    const statusColor = orderStatusColor(order.status);
    const isDelivered = order.status === 'DELIVERED';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
        activeOpacity={0.88}
      >
        {/* Stripe de color */}
        <View style={[styles.cardStripe, { backgroundColor: statusColor }]} />

        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <View style={[styles.vehicleIcon, { backgroundColor: statusColor + '15' }]}>
              <Ionicons name={vehicleIcon(order.vehicleTypeUsed) as any} size={18} color={statusColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardRecipient} numberOfLines={1}>
                {order.recipientName}
              </Text>
              <Text style={styles.cardDate}>{formatDate(order.createdAt)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                {getOrderStatusLabel(order.status)}
              </Text>
            </View>
          </View>

          <View style={styles.cardRoute}>
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: Colors.company }]} />
              <Text style={styles.routeText} numberOfLines={1}>{order.pickupAddress}</Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: Colors.error }]} />
              <Text style={styles.routeText} numberOfLines={1}>{order.deliveryAddress}</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerDist}>{order.distanceKm.toFixed(1)} km</Text>
              {order.courierRating && (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color="#FCD34D" />
                  <Text style={styles.ratingText}>{order.courierRating}/5</Text>
                </View>
              )}
            </View>
            <Text style={[styles.footerPrice, { color: isDelivered ? Colors.courier : Colors.textSecondary }]}>
              {isDelivered ? formatCOP(order.finalPrice) : '—'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historial de entregas</Text>
        </View>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={Colors.courier} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.courierDeep} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de entregas</Text>
        <Text style={styles.headerCount}>{orders.length}</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadHistory(); }}
            tintColor={Colors.courier}
            colors={[Colors.courier]}
          />
        }
        ListHeaderComponent={
          <View style={styles.statsRow}>
            {/* Total ganado */}
            <View style={[styles.statCard, styles.statCardEarnings]}>
              <View style={styles.statIcon}>
                <Ionicons name="cash-outline" size={20} color={Colors.courier} />
              </View>
              <Text style={styles.statValue} numberOfLines={1}>{formatCOP(totalEarned)}</Text>
              <Text style={styles.statLabel}>Total ganado</Text>
            </View>

            {/* Entregas */}
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: Colors.company + '15' }]}>
                <Ionicons name="checkmark-done-outline" size={20} color={Colors.company} />
              </View>
              <Text style={[styles.statValue, { color: Colors.company }]}>{delivered.length}</Text>
              <Text style={styles.statLabel}>Entregas</Text>
            </View>

            {/* Rating promedio */}
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#FCD34D25' }]}>
                <Ionicons name="star" size={20} color="#D97706" />
              </View>
              <Text style={[styles.statValue, { color: '#D97706' }]}>
                {avgRating > 0 ? avgRating.toFixed(1) : '—'}
              </Text>
              <Text style={styles.statLabel}>Calificación</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="receipt-outline" size={44} color={Colors.courier} />
            </View>
            <Text style={styles.emptyTitle}>Sin historial</Text>
            <Text style={styles.emptyDesc}>Tus entregas aparecerán aquí</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.courierDeep },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    backgroundColor: Colors.courier,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { ...Typography.h5, color: Colors.white, flex: 1 },
  headerCount: {
    ...Typography.caption2, color: Colors.courierLight, fontWeight: '800',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },

  listContent: { padding: 16, paddingBottom: 44, gap: 10 },

  // Stats row
  statsRow: {
    flexDirection: 'row', gap: 10, marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16, padding: 12,
    alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.small,
  },
  statCardEarnings: {
    backgroundColor: Colors.courierMuted,
    borderColor: Colors.courier + '30',
  },
  statIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: Colors.courier + '15',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: { ...Typography.h5, color: Colors.courier, textAlign: 'center' },
  statLabel: { ...Typography.caption2, color: Colors.textTertiary, textAlign: 'center' },

  // Order card
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.small,
  },
  cardStripe: { width: 4 },
  cardContent: { flex: 1, padding: 14, gap: 10 },

  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vehicleIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  cardRecipient: { ...Typography.subtitle2, color: Colors.textPrimary },
  cardDate: { ...Typography.caption2, color: Colors.textTertiary },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  statusBadgeText: { ...Typography.caption2, fontWeight: '700' },

  // Route
  cardRoute: { gap: 4 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeText: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },
  routeLine: { width: 1, height: 8, backgroundColor: Colors.border, marginLeft: 4 },

  // Footer
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  footerDist: { ...Typography.caption, color: Colors.textTertiary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { ...Typography.caption2, color: '#D97706', fontWeight: '700' },
  footerPrice: { ...Typography.subtitle2, fontWeight: '800' },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 52, gap: 10 },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 24,
    backgroundColor: Colors.courierMuted,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { ...Typography.h5, color: Colors.textSecondary },
  emptyDesc: { ...Typography.body2, color: Colors.textTertiary, textAlign: 'center' },
});
