import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, RefreshControl, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { courierApi, Courier, WalletTransaction } from '../../api/courierApi';
import { Colors, Shadow } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { formatCOP } from '../../utils/formatters';

const formatDate = (isoString: string) => {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return isoString;
  }
};

export const WalletScreen = ({ navigation }: any) => {
  const [courier, setCourier] = useState<Courier | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);

  const loadWallet = useCallback(async () => {
    try {
      const { data } = await courierApi.getWallet();
      setCourier(data);
    } catch (err: any) {
      Alert.alert('Error', 'No se pudo cargar el wallet');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadWallet(); }, [loadWallet]);

  const handlePayDebt = () => {
    if (!courier || courier.dailyDebt <= 0) return;

    Alert.alert(
      'Pagar deuda diaria',
      `¿Confirmas el pago de ${formatCOP(courier.dailyDebt)} a la plataforma?\n\nEste monto es la comisión del 10% por el uso de DomiLink hoy.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: `Pagar ${formatCOP(courier.dailyDebt)}`,
          onPress: async () => {
            try {
              setPaying(true);
              const { data } = await courierApi.payDebt(courier.dailyDebt);
              setCourier(data);
              Alert.alert('¡Pago exitoso!', 'Tu cuenta ha sido desbloqueada.');
            } catch (err: any) {
              const msg = err?.response?.data?.error ?? 'Error al procesar el pago';
              Alert.alert('Error', msg);
            } finally {
              setPaying(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={Colors.courier} />
        </View>
      </SafeAreaView>
    );
  }

  const isBlocked = courier?.blockedByDebt ?? false;
  const debt = courier?.dailyDebt ?? 0;
  const history = courier?.walletHistory ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.courierDeep} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Wallet</Text>
        <TouchableOpacity onPress={loadWallet} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadWallet(); }}
            tintColor={Colors.courier}
            colors={[Colors.courier]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta de estado del wallet */}
        <View style={[styles.walletCard, isBlocked && styles.walletCardBlocked]}>
          <View style={styles.walletCardTop}>
            <View style={styles.walletIconWrap}>
              <Ionicons
                name={isBlocked ? 'lock-closed' : 'wallet'}
                size={28}
                color={isBlocked ? Colors.error : Colors.courier}
              />
            </View>
            <View style={styles.walletStatusBadge}>
              <View style={[styles.walletStatusDot, {
                backgroundColor: isBlocked ? Colors.error : Colors.success,
              }]} />
              <Text style={[styles.walletStatusText, {
                color: isBlocked ? Colors.error : Colors.success,
              }]}>
                {isBlocked ? 'CUENTA BLOQUEADA' : 'CUENTA ACTIVA'}
              </Text>
            </View>
          </View>

          <Text style={styles.walletDebtLabel}>Deuda de hoy</Text>
          <Text style={[styles.walletDebtAmount, debt > 0 && styles.walletDebtAmountRed]}>
            {formatCOP(debt)}
          </Text>
          <Text style={styles.walletDebtSubtitle}>Comisión 10% sobre entregas del día</Text>

          {isBlocked && (
            <View style={styles.blockedBanner}>
              <Ionicons name="warning" size={16} color={Colors.white} />
              <Text style={styles.blockedBannerText}>
                Tu cuenta está bloqueada por deuda del día anterior.{'\n'}Paga para desbloquear.
              </Text>
            </View>
          )}

          {debt > 0 && (
            <TouchableOpacity
              style={[styles.payBtn, paying && styles.payBtnDisabled]}
              onPress={handlePayDebt}
              disabled={paying}
              activeOpacity={0.85}
            >
              {paying ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="card-outline" size={18} color={Colors.white} />
                  <Text style={styles.payBtnText}>Pagar {formatCOP(debt)}</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {debt <= 0 && !isBlocked && (
            <View style={styles.zeroBadge}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.zeroBadgeText}>Sin deuda pendiente</Text>
            </View>
          )}
        </View>

        {/* Info de comisiones */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.company} />
            <Text style={styles.infoTitle}>Cómo funciona la comisión</Text>
          </View>
          <Text style={styles.infoText}>
            Por cada entrega completada, DomiLink cobra el <Text style={{ fontWeight: '700' }}>10%</Text> como comisión por el uso de la plataforma.{'\n\n'}
            Al finalizar el día, tienes hasta las <Text style={{ fontWeight: '700' }}>11:59 PM</Text> para pagar. Si no pagas, tu cuenta será bloqueada al día siguiente hasta que saldues la deuda.
          </Text>
        </View>

        {/* Historial de transacciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial de movimientos</Text>
          {history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Ionicons name="receipt-outline" size={36} color={Colors.textDisabled} />
              <Text style={styles.emptyHistoryText}>Sin movimientos aún</Text>
            </View>
          ) : (
            history.map((tx) => (
              <View key={tx.id} style={styles.txCard}>
                <View style={[styles.txIconWrap, {
                  backgroundColor: tx.type === 'PAYMENT'
                    ? Colors.success + '20'
                    : Colors.error + '15',
                }]}>
                  <Ionicons
                    name={tx.type === 'PAYMENT' ? 'arrow-up-circle' : 'arrow-down-circle'}
                    size={22}
                    color={tx.type === 'PAYMENT' ? Colors.success : Colors.error}
                  />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txDescription}>{tx.description}</Text>
                  <Text style={styles.txDate}>{formatDate(tx.timestamp)}</Text>
                </View>
                <Text style={[styles.txAmount, {
                  color: tx.type === 'PAYMENT' ? Colors.success : Colors.error,
                }]}>
                  {tx.type === 'PAYMENT' ? '-' : '+'}{formatCOP(tx.amount)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.courierDeep },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    backgroundColor: Colors.courier,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { ...Typography.h5, color: Colors.white, flex: 1 },
  refreshBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 44, gap: 16 },

  // Wallet card
  walletCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
    borderColor: Colors.courier + '30',
    ...Shadow.large,
    gap: 8,
  },
  walletCardBlocked: {
    borderColor: Colors.error + '50',
    backgroundColor: '#FFF5F5',
  },
  walletCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  walletIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: Colors.courierMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  walletStatusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.background,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
  },
  walletStatusDot: { width: 8, height: 8, borderRadius: 4 },
  walletStatusText: { ...Typography.caption2, fontWeight: '800', letterSpacing: 0.5 },

  walletDebtLabel: { ...Typography.caption, color: Colors.textSecondary },
  walletDebtAmount: {
    fontSize: 36, fontWeight: '900', color: Colors.textPrimary,
    letterSpacing: -1,
  },
  walletDebtAmountRed: { color: Colors.error },
  walletDebtSubtitle: { ...Typography.caption, color: Colors.textTertiary },

  blockedBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.error,
    borderRadius: 12, padding: 12, marginTop: 8,
  },
  blockedBannerText: { ...Typography.caption, color: Colors.white, flex: 1, lineHeight: 18 },

  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.courier,
    borderRadius: 14, paddingVertical: 14, marginTop: 8,
    ...Shadow.colored(Colors.courier),
  },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { ...Typography.button, color: Colors.white },

  zeroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.success + '15',
    borderRadius: 12, padding: 10, marginTop: 4,
  },
  zeroBadgeText: { ...Typography.caption, color: Colors.success, fontWeight: '700' },

  // Info card
  infoCard: {
    backgroundColor: Colors.company + '08',
    borderRadius: 16, padding: 16, gap: 8,
    borderWidth: 1, borderColor: Colors.company + '20',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoTitle: { ...Typography.subtitle2, color: Colors.company },
  infoText: { ...Typography.body2, color: Colors.textSecondary, lineHeight: 20 },

  // Historial
  section: { gap: 10 },
  sectionTitle: { ...Typography.subtitle1, color: Colors.textPrimary, marginBottom: 4 },

  emptyHistory: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyHistoryText: { ...Typography.body2, color: Colors.textDisabled },

  txCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.small,
  },
  txIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  txInfo: { flex: 1 },
  txDescription: { ...Typography.body2, color: Colors.textPrimary, fontWeight: '600' },
  txDate: { ...Typography.caption2, color: Colors.textTertiary, marginTop: 2 },
  txAmount: { ...Typography.subtitle1, fontWeight: '800' },
});
