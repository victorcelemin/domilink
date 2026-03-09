import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, RefreshControl, StatusBar, Alert, Animated,
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
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { WebDashboardLayout } from '../../components/common/WebContainer';
import { WebSidebar } from '../../components/common/WebSidebar';

const STATS_CONFIG = [
  { key: 'PENDING',    icon: 'time-outline' as const,             label: 'Pendientes' },
  { key: 'ASSIGNED',   icon: 'bicycle-outline' as const,          label: 'Asignados'  },
  { key: 'IN_TRANSIT', icon: 'navigate-outline' as const,         label: 'En camino'  },
  { key: 'DELIVERED',  icon: 'checkmark-circle-outline' as const, label: 'Entregados' },
];

export const CompanyHomeScreen = ({ navigation }: any) => {
  const { user, logout, companyId } = useAuth();
  const [orders, setOrders]   = useState<Order[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Animaciones de entrada
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim  = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    try {
      const [ordersRes, companyRes] = await Promise.all([
        orderApi.getMyOrders(),
        companyApi.getMyCompany().catch(() => null),
      ]);
      setOrders(ordersRes.data);
      if (companyRes) setCompany(companyRes.data);
    } catch { /* silencioso */ }
    finally {
      setLoading(false);
      setRefreshing(false);
      // Animar después de cargar
      Animated.stagger(150, [
        Animated.spring(headerAnim, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }),
        Animated.spring(statsAnim,  { toValue: 1, tension: 70, friction: 9,  useNativeDriver: true }),
      ]).start();
    }
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
  const totalDelivered = orders.filter(o => o.status === 'DELIVERED').length;
  const totalSpent = orders
    .filter(o => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + o.finalPrice, 0);

  const canCreateOrder = !!company && company.status === 'ACTIVE';
  const companyName = company?.name ?? user?.email?.split('@')[0] ?? 'Empresa';
  const { isLarge } = useBreakpoint();

  const webNavItems = [
    { key: 'home',    label: 'Inicio',         icon: 'home-outline' as const,       iconActive: 'home' as const,           onPress: () => {} },
    { key: 'orders',  label: 'Mis pedidos',     icon: 'list-outline' as const,       iconActive: 'list' as const,           onPress: () => {}, badge: activeOrders.length },
    { key: 'create',  label: 'Nuevo pedido',    icon: 'add-circle-outline' as const, iconActive: 'add-circle' as const,     onPress: () => canCreateOrder && navigation.navigate('CreateOrder') },
    { key: 'profile', label: 'Perfil empresa',  icon: 'business-outline' as const,   iconActive: 'business' as const,       onPress: () => navigation.navigate('CompanyProfile') },
  ];

  // Obtener hora del día para el saludo
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  const MainContent = (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.companyDeep} />

      {/* ── Top Bar estilo dashboard ejecutivo ── */}
      <View style={styles.topBar}>
        {/* Decoraciones */}
        <View style={styles.topBarOrb1} />
        <View style={styles.topBarOrb2} />

        <Animated.View style={[styles.topBarContent, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0,1], outputRange: [-10, 0] }) }],
        }]}>
          {/* Fila superior: avatar + acciones */}
          <View style={styles.topRow}>
            <View style={styles.topLeft}>
              <TouchableOpacity
                style={styles.avatarBtn}
                onPress={() => navigation.navigate('CompanyProfile')}
              >
                <View style={styles.avatarCircle}>
                  <Ionicons name="business" size={22} color={Colors.white} />
                </View>
                <View style={styles.avatarOnline} />
              </TouchableOpacity>
              <View>
                <Text style={styles.greetingText}>{greeting}</Text>
                <Text style={styles.companyName} numberOfLines={1}>{companyName}</Text>
              </View>
            </View>

            <View style={styles.topActions}>
              {company?.status === 'PENDING' && (
                <View style={styles.pendingChip}>
                  <View style={styles.pendingDot} />
                  <Text style={styles.pendingChipText}>En revisión</Text>
                </View>
              )}
              {company?.status === 'ACTIVE' && (
                <View style={styles.activeChip}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activeChipText}>Activa</Text>
                </View>
              )}
              <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
                <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero earnings card dentro del header */}
          <View style={styles.heroCard}>
            <View style={styles.heroCardLeft}>
              <Text style={styles.heroCardLabel}>Total invertido en entregas</Text>
              <Text style={styles.heroCardValue}>{formatCOP(totalSpent)}</Text>
              <View style={styles.heroCardMeta}>
                <Ionicons name="checkmark-circle" size={13} color={Colors.courierLight} />
                <Text style={styles.heroCardMetaText}>{totalDelivered} entrega{totalDelivered !== 1 ? 's' : ''} completada{totalDelivered !== 1 ? 's' : ''}</Text>
              </View>
            </View>
            <View style={styles.heroCardIcon}>
              <Ionicons name="trending-up" size={28} color={Colors.white} />
            </View>
          </View>
        </Animated.View>
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
            <View style={styles.alertStripe} />
            <View style={styles.alertIconWrap}>
              <Ionicons name="business-outline" size={22} color={Colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Completa tu perfil de empresa</Text>
              <Text style={styles.alertDesc}>
                Registra tu NIT y dirección para publicar pedidos
              </Text>
            </View>
            <View style={styles.alertArrow}>
              <Ionicons name="arrow-forward" size={14} color={Colors.secondary} />
            </View>
          </TouchableOpacity>
        )}

        {/* ── Stats grid rediseñado ── */}
        <Animated.View style={[styles.statsGrid, {
          opacity: statsAnim,
          transform: [{ translateY: statsAnim.interpolate({ inputRange: [0,1], outputRange: [20, 0] }) }],
        }]}>
          {STATS_CONFIG.map(({ key, icon, label }) => {
            const color = orderStatusColor(key);
            const count = stats[key] ?? 0;
            return (
              <View key={key} style={[styles.statCard, { borderTopColor: color }]}>
                <View style={[styles.statIconWrap, { backgroundColor: color + '15' }]}>
                  <Ionicons name={icon} size={20} color={color} />
                </View>
                <Text style={[styles.statNumber, { color }]}>{count}</Text>
                <Text style={styles.statLabel}>{label}</Text>
                {/* Mini barra de progreso */}
                <View style={styles.statBarBg}>
                  <View style={[
                    styles.statBarFill,
                    {
                      backgroundColor: color,
                      width: count > 0 ? `${Math.min(100, (count / Math.max(1, orders.length)) * 100)}%` : '0%',
                    },
                  ]} />
                </View>
              </View>
            );
          })}
        </Animated.View>

        {/* ── CTA publicar pedido ── */}
        <TouchableOpacity
          style={[styles.ctaCard, !canCreateOrder && styles.ctaCardDisabled]}
          onPress={() => canCreateOrder && navigation.navigate('CreateOrder')}
          activeOpacity={canCreateOrder ? 0.84 : 1}
        >
          <View style={styles.ctaLeft}>
            <View style={[styles.ctaIconBox, !canCreateOrder && { backgroundColor: Colors.border }]}>
              <Ionicons
                name={canCreateOrder ? 'add-circle' : 'lock-closed'}
                size={24}
                color={canCreateOrder ? Colors.white : Colors.textTertiary}
              />
            </View>
            <View>
              <Text style={[styles.ctaTitle, !canCreateOrder && { color: Colors.textTertiary }]}>
                {canCreateOrder ? 'Publicar nuevo pedido' : 'Perfil requerido'}
              </Text>
              <Text style={styles.ctaDesc}>
                {canCreateOrder
                  ? 'Un domiciliario lo tomará al instante'
                  : company?.status === 'PENDING'
                    ? 'Tu empresa está en revisión'
                    : 'Completa tu perfil de empresa'}
              </Text>
            </View>
          </View>
          {canCreateOrder && (
            <View style={styles.ctaArrow}>
              <Ionicons name="chevron-forward" size={18} color={Colors.white} />
            </View>
          )}
        </TouchableOpacity>

        {/* ── Sección pedidos activos ── */}
        {activeOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionDot, { backgroundColor: Colors.company }]} />
                <Text style={styles.sectionTitle}>Pedidos activos</Text>
              </View>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{activeOrders.length}</Text>
              </View>
            </View>
            {activeOrders.map(order => (
              <View key={order.id} style={styles.orderWithActions}>
                <OrderCard
                  order={order}
                  onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
                />
                {/* Botón de tracking (solo cuando tiene domiciliario asignado) */}
                {(order.status === 'ASSIGNED' || order.status === 'IN_TRANSIT') && order.courierId && (
                  <TouchableOpacity
                    style={styles.trackBtn}
                    onPress={() => navigation.navigate('OrderTracking', { orderId: order.id })}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="navigate" size={14} color={Colors.white} />
                    <Text style={styles.trackBtnText}>Ver en mapa</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Estado vacío mejorado */}
        {orders.length === 0 && !loading && (
          <View style={styles.empty}>
            <View style={styles.emptyIllustration}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="cube-outline" size={44} color={Colors.company} />
              </View>
              {/* Puntos decorativos */}
              <View style={[styles.emptyDot, { top: 10, right: 15, backgroundColor: Colors.companyMuted, borderColor: Colors.company + '40' }]} />
              <View style={[styles.emptyDot, { bottom: 8, left: 12, backgroundColor: Colors.courierMuted, borderColor: Colors.courier + '40' }]} />
            </View>
            <Text style={styles.emptyTitle}>Aún no hay pedidos</Text>
            <Text style={styles.emptyDesc}>
              Publica tu primer pedido y{'\n'}un domiciliario lo tomará enseguida
            </Text>
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
            role="COMPANY"
            userName={companyName}
            userEmail={user?.email}
            status={company?.status}
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
  safe: { flex: 1, backgroundColor: Colors.companyDeep },

  // ── Top Bar ──────────────────────────────────────────────────
  topBar: {
    backgroundColor: Colors.company,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  topBarOrb1: {
    position: 'absolute', top: -60, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: Colors.companyAccent, opacity: 0.35,
  },
  topBarOrb2: {
    position: 'absolute', bottom: -30, left: -40,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: Colors.companyDeep, opacity: 0.5,
  },
  topBarContent: { paddingHorizontal: 18, paddingTop: 14 },

  topRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 18,
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  // Avatar
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
    backgroundColor: Colors.courierLight,
    borderWidth: 2, borderColor: Colors.company,
  },

  greetingText: { ...Typography.caption, color: 'rgba(255,255,255,0.6)', marginBottom: 1 },
  companyName:  { ...Typography.subtitle1, color: Colors.white, maxWidth: 160 },

  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  pendingChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(217,119,6,0.2)',
    borderWidth: 1, borderColor: 'rgba(217,119,6,0.4)',
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
  },
  pendingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.warning },
  pendingChipText: { ...Typography.caption2, color: '#FDE68A', fontWeight: '700' },

  activeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(5,150,105,0.2)',
    borderWidth: 1, borderColor: 'rgba(5,150,105,0.4)',
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.courierLight },
  activeChipText: { ...Typography.caption2, color: Colors.courierLight, fontWeight: '700' },

  iconBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Hero card
  heroCard: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  heroCardLeft: { flex: 1 },
  heroCardLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.65)', marginBottom: 4 },
  heroCardValue: {
    fontSize: 28, fontWeight: '800', color: Colors.white,
    letterSpacing: -0.5, marginBottom: 6,
  },
  heroCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroCardMetaText: { ...Typography.caption, color: Colors.courierLight },
  heroCardIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Content ───────────────────────────────────────────────────
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 44 },

  // Alert card
  alertCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: 18,
    padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.warningBorder,
    overflow: 'hidden',
    ...Shadow.medium,
  },
  alertStripe: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: 4, backgroundColor: Colors.warning,
  },
  alertIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.warningLight,
    alignItems: 'center', justifyContent: 'center',
  },
  alertTitle: { ...Typography.subtitle2, color: Colors.textPrimary, marginBottom: 2 },
  alertDesc:  { ...Typography.caption, color: Colors.textSecondary },
  alertArrow: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.warningLight,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Stats grid ────────────────────────────────────────────────
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 10, marginBottom: 16,
  },
  statCard: {
    flex: 1, minWidth: '44%',
    backgroundColor: Colors.white,
    borderRadius: 18, padding: 14,
    alignItems: 'flex-start',
    borderWidth: 1, borderColor: Colors.border,
    borderTopWidth: 3,
    ...Shadow.small,
    gap: 4,
  },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  statNumber: { fontSize: 26, fontWeight: '800', lineHeight: 32, letterSpacing: -0.3 },
  statLabel:  { ...Typography.caption, color: Colors.textTertiary },
  statBarBg: {
    width: '100%', height: 3, borderRadius: 2,
    backgroundColor: Colors.borderLight,
    marginTop: 6,
  },
  statBarFill: { height: 3, borderRadius: 2, minWidth: 4 },

  // ── CTA Card ─────────────────────────────────────────────────
  ctaCard: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.company,
    borderRadius: 18, padding: 16,
    marginBottom: 20,
    ...Shadow.colored(Colors.company),
    overflow: 'hidden',
  },
  ctaCardDisabled: {
    backgroundColor: Colors.surfaceElevated,
    shadowOpacity: 0, elevation: 0,
    borderWidth: 1, borderColor: Colors.border,
  },
  ctaLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  ctaIconBox: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  ctaTitle: { ...Typography.subtitle1, color: Colors.white, marginBottom: 2 },
  ctaDesc: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  ctaArrow: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Order + tracking ─────────────────────────────────────────
  orderWithActions: { gap: 6, marginBottom: 2 },
  trackBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.company,
    borderRadius: 12, paddingVertical: 8,
    marginBottom: 10,
    ...Shadow.colored(Colors.company),
  },
  trackBtnText: { ...Typography.caption, color: Colors.white, fontWeight: '700' },

  // ── Section ───────────────────────────────────────────────────
  section: { marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionDot: { width: 4, height: 18, borderRadius: 2 },
  sectionTitle: { ...Typography.subtitle1, color: Colors.textPrimary },
  sectionBadge: {
    backgroundColor: Colors.company,
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
    backgroundColor: Colors.companyMuted,
    borderWidth: 2, borderColor: Colors.company + '25',
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
});
