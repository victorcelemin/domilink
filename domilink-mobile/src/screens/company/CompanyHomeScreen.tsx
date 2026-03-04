import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, RefreshControl, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { orderApi, Order } from '../../api/orderApi';
import { companyApi, Company } from '../../api/companyApi';
import { OrderCard } from '../../components/common/OrderCard';
import { Button } from '../../components/common/Button';
import { Colors, Shadow, orderStatusColor } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { formatCOP, getOrderStatusLabel } from '../../utils/formatters';

const STATS_CONFIG = [
  { key: 'PENDING',    icon: 'time-outline' as const },
  { key: 'ASSIGNED',   icon: 'bicycle-outline' as const },
  { key: 'IN_TRANSIT', icon: 'navigate-outline' as const },
  { key: 'DELIVERED',  icon: 'checkmark-circle-outline' as const },
];

export const CompanyHomeScreen = ({ navigation }: any) => {
  const { user, logout, companyId } = useAuth();
  const [orders, setOrders]   = useState<Order[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [ordersRes, companyRes] = await Promise.all([
        orderApi.getMyOrders(),
        companyApi.getMyCompany().catch(() => null),
      ]);
      setOrders(ordersRes.data);
      if (companyRes) setCompany(companyRes.data);
    } catch { /* silencioso */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  const stats = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activeOrders = orders.filter(o =>
    ['PENDING', 'ASSIGNED', 'IN_TRANSIT'].includes(o.status)
  );
  const totalSpent = orders
    .filter(o => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + o.finalPrice, 0);

  const canCreateOrder = !!company && company.status === 'ACTIVE';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.company} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.avatarCircle}>
            <Ionicons name="business" size={20} color={Colors.white} />
          </View>
          <View>
            <Text style={styles.topBarLabel}>Empresa</Text>
            <Text style={styles.topBarName} numberOfLines={1}>
              {company?.name ?? user?.email?.split('@')[0]}
            </Text>
          </View>
        </View>
        <View style={styles.topBarRight}>
          {company?.status === 'PENDING' && (
            <View style={styles.pendingChip}>
              <Ionicons name="time-outline" size={12} color={Colors.warning} />
              <Text style={styles.pendingChipText}>En revisión</Text>
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
            tintColor={Colors.company}
            colors={[Colors.company]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Alerta: sin perfil */}
        {!company && (
          <TouchableOpacity
            style={styles.alertCard}
            onPress={() => navigation.navigate('CompanyProfile')}
            activeOpacity={0.88}
          >
            <View style={styles.alertIconWrap}>
              <Ionicons name="business-outline" size={22} color={Colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Completa tu perfil de empresa</Text>
              <Text style={styles.alertDesc}>
                Registra tu NIT y dirección para publicar pedidos
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.secondary} />
          </TouchableOpacity>
        )}

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {STATS_CONFIG.map(({ key, icon }) => {
            const color = orderStatusColor(key);
            return (
              <View key={key} style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: color + '18' }]}>
                  <Ionicons name={icon} size={18} color={color} />
                </View>
                <Text style={[styles.statNumber, { color }]}>{stats[key] ?? 0}</Text>
                <Text style={styles.statLabel}>{getOrderStatusLabel(key)}</Text>
              </View>
            );
          })}
        </View>

        {/* Ingresos totales */}
        <View style={styles.earningsCard}>
          <View>
            <Text style={styles.earningsLabel}>Total gastado en entregas</Text>
            <Text style={styles.earningsValue}>{formatCOP(totalSpent)}</Text>
          </View>
          <View style={styles.earningsIcon}>
            <Ionicons name="wallet-outline" size={28} color={Colors.company} />
          </View>
        </View>

        {/* CTA publicar */}
        <Button
          title={canCreateOrder ? 'Publicar nuevo pedido' : 'Perfil requerido para publicar'}
          fullWidth
          size="lg"
          style={{ backgroundColor: canCreateOrder ? Colors.company : Colors.textDisabled, marginBottom: 6 }}
          icon={<Ionicons name="add-circle-outline" size={20} color={Colors.white} />}
          onPress={() => navigation.navigate('CreateOrder')}
          disabled={!canCreateOrder}
        />
        {company && company.status !== 'ACTIVE' && (
          <Text style={styles.inactiveHint}>
            Tu empresa está en revisión. Pronto podrás publicar pedidos.
          </Text>
        )}

        {/* Pedidos activos */}
        {activeOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pedidos activos</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{activeOrders.length}</Text>
              </View>
            </View>
            {activeOrders.slice(0, 4).map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
              />
            ))}
          </View>
        )}

        {orders.length === 0 && !loading && (
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="cube-outline" size={40} color={Colors.textDisabled} />
            </View>
            <Text style={styles.emptyTitle}>Sin pedidos aún</Text>
            <Text style={styles.emptyDesc}>
              Publica tu primer pedido y un domiciliario lo tomará enseguida
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.company },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  topBarLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.65)' },
  topBarName:  { ...Typography.subtitle2, color: Colors.white, maxWidth: 180 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pendingChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  pendingChipText: { ...Typography.caption2, color: Colors.warning, fontWeight: '700' },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  scroll:   { flex: 1, backgroundColor: Colors.background },
  content:  { padding: 16, paddingBottom: 40 },

  alertCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: 16,
    padding: 14, marginBottom: 16,
    borderWidth: 1.5, borderColor: Colors.secondaryDark + '30',
    ...Shadow.small,
  },
  alertIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.warningLight,
    alignItems: 'center', justifyContent: 'center',
  },
  alertTitle: { ...Typography.subtitle2, color: Colors.textPrimary, marginBottom: 2 },
  alertDesc:  { ...Typography.caption, color: Colors.textSecondary },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 10, marginBottom: 14,
  },
  statCard: {
    flex: 1, minWidth: '44%',
    backgroundColor: Colors.white,
    borderRadius: 16, padding: 14,
    alignItems: 'flex-start',
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.xs,
  },
  statIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: { ...Typography.h3, marginBottom: 2 },
  statLabel:  { ...Typography.caption, color: Colors.textTertiary },

  earningsCard: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.companyMuted,
    borderRadius: 16, padding: 16, marginBottom: 18,
    borderWidth: 1, borderColor: Colors.company + '30',
  },
  earningsLabel: { ...Typography.caption, color: Colors.company, marginBottom: 4 },
  earningsValue: { ...Typography.price, color: Colors.company },
  earningsIcon:  {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: Colors.company + '18',
    alignItems: 'center', justifyContent: 'center',
  },

  inactiveHint: {
    ...Typography.caption, color: Colors.textTertiary,
    textAlign: 'center', marginBottom: 20, marginTop: 4,
  },

  section: { marginTop: 8 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  sectionTitle: { ...Typography.subtitle1, color: Colors.textPrimary },
  sectionBadge: {
    backgroundColor: Colors.company,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20,
  },
  sectionBadgeText: { ...Typography.caption2, color: Colors.white, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { ...Typography.h5, color: Colors.textSecondary },
  emptyDesc:  {
    ...Typography.body2, color: Colors.textTertiary,
    textAlign: 'center', maxWidth: 240,
  },
});
