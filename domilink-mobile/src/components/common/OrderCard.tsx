import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../../api/orderApi';
import { Colors, Shadow, orderStatusColor } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { formatCOP, formatDistance, getOrderStatusLabel } from '../../utils/formatters';

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
}

const STATUS_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  PENDING:    'time-outline',
  ASSIGNED:   'bicycle-outline',
  IN_TRANSIT: 'navigate-outline',
  DELIVERED:  'checkmark-circle-outline',
  CANCELLED:  'close-circle-outline',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:    'Pendiente',
  ASSIGNED:   'Asignado',
  IN_TRANSIT: 'En camino',
  DELIVERED:  'Entregado',
  CANCELLED:  'Cancelado',
};

export const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
  const isBase       = order.paymentMode === 'BASE';
  const statusColor  = orderStatusColor(order.status);
  const paymentColor = isBase ? Colors.paymentBase    : Colors.paymentPaid;
  const paymentBg    = isBase ? Colors.paymentBaseLight: Colors.paymentPaidLight;
  const paymentBorder= isBase ? Colors.paymentBaseBorder: Colors.paymentPaidBorder;
  const isDelivered  = order.status === 'DELIVERED';
  const isCancelled  = order.status === 'CANCELLED';

  return (
    <TouchableOpacity
      style={[styles.card, isCancelled && styles.cardCancelled]}
      onPress={onPress}
      activeOpacity={0.84}
    >
      {/* Barra lateral de estado */}
      <View style={[styles.statusBar, { backgroundColor: statusColor }]}>
        <View style={styles.statusBarIcon}>
          <Ionicons
            name={STATUS_ICONS[order.status] ?? 'ellipse-outline'}
            size={12}
            color={Colors.white}
          />
        </View>
      </View>

      <View style={styles.body}>
        {/* ── Fila superior: chips + precio ── */}
        <View style={styles.topRow}>
          <View style={styles.chipsRow}>
            {/* Status chip */}
            <View style={[styles.statusChip, { backgroundColor: statusColor + '18', borderColor: statusColor + '35' }]}>
              <Text style={[styles.statusChipText, { color: statusColor }]}>
                {STATUS_LABELS[order.status] ?? order.status}
              </Text>
            </View>

            {/* Payment chip */}
            <View style={[styles.paymentChip, { backgroundColor: paymentBg, borderColor: paymentBorder }]}>
              <Ionicons
                name={isBase ? 'cash-outline' : 'checkmark-circle-outline'}
                size={10}
                color={paymentColor}
              />
              <Text style={[styles.paymentChipText, { color: paymentColor }]}>
                {isBase ? 'BASE' : 'PAGADO'}
              </Text>
            </View>
          </View>

          {/* Precio destacado */}
          <Text style={[styles.price, isDelivered && styles.priceDelivered]}>
            {formatCOP(order.finalPrice)}
          </Text>
        </View>

        {/* ── Ruta visual mejorada ── */}
        <View style={styles.routeContainer}>
          {/* Pickup */}
          <View style={styles.routeRow}>
            <View style={styles.routeIconCol}>
              <View style={[styles.routeDot, styles.pickupDot]} />
              <View style={styles.routeLine} />
            </View>
            <View style={styles.routeTextCol}>
              <Text style={styles.routeLabel}>Recogida</Text>
              <Text style={styles.routeAddress} numberOfLines={1}>
                {order.pickupAddress}
              </Text>
            </View>
          </View>

          {/* Delivery */}
          <View style={styles.routeRow}>
            <View style={styles.routeIconCol}>
              <View style={[styles.routeDot, styles.deliveryDot]} />
            </View>
            <View style={styles.routeTextCol}>
              <Text style={styles.routeLabel}>Entrega</Text>
              <Text style={styles.routeAddress} numberOfLines={1}>
                {order.deliveryAddress}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          {/* Destinatario */}
          <View style={styles.footerItem}>
            <View style={styles.footerIconBox}>
              <Ionicons name="person-outline" size={11} color={Colors.textTertiary} />
            </View>
            <Text style={styles.footerText} numberOfLines={1}>{order.recipientName}</Text>
          </View>

          {/* Distancia */}
          <View style={styles.footerItem}>
            <View style={styles.footerIconBox}>
              <Ionicons name="navigate-outline" size={11} color={Colors.textTertiary} />
            </View>
            <Text style={styles.footerText}>{formatDistance(order.distanceKm)}</Text>
          </View>

          {/* BASE amount */}
          {isBase && order.baseAmount && (
            <View style={styles.baseChip}>
              <Ionicons name="cash" size={10} color={Colors.paymentBase} />
              <Text style={styles.baseChipText}>{formatCOP(order.baseAmount)}</Text>
            </View>
          )}

          {/* Flecha */}
          <View style={styles.arrowBox}>
            <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 18,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.medium,
  },
  cardCancelled: {
    opacity: 0.65,
    borderColor: Colors.errorBorder,
  },

  // Barra lateral
  statusBar: {
    width: 6,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 16,
  },
  statusBarIcon: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },

  body: {
    flex: 1,
    padding: 14,
    paddingLeft: 12,
    gap: 10,
  },

  // ── Top row ──────────────────────────────────────────────────
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipsRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },

  statusChip: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1,
  },
  statusChipText: {
    ...Typography.overline,
    fontSize: 10,
  },

  paymentChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1,
  },
  paymentChipText: {
    ...Typography.overline,
    fontSize: 9,
  },

  price: {
    ...Typography.subtitle1,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  priceDelivered: {
    color: Colors.success,
  },

  // ── Route ────────────────────────────────────────────────────
  routeContainer: { gap: 0 },

  routeRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 36,
  },
  routeIconCol: {
    width: 20,
    alignItems: 'center',
    paddingTop: 6,
  },
  routeLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  routeDot: {
    width: 10, height: 10, borderRadius: 5,
    borderWidth: 2,
  },
  pickupDot: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary + '50',
  },
  deliveryDot: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary + '50',
  },

  routeTextCol: {
    flex: 1,
    paddingLeft: 8,
    paddingBottom: 6,
    justifyContent: 'flex-start',
  },
  routeLabel: {
    ...Typography.caption2,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 1,
  },
  routeAddress: {
    ...Typography.body3,
    color: Colors.textSecondary,
  },

  // ── Footer ───────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  footerIconBox: {
    width: 18, height: 18, borderRadius: 5,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    flex: 1,
  },

  baseChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.paymentBaseLight,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1, borderColor: Colors.paymentBaseBorder,
  },
  baseChipText: {
    ...Typography.caption2,
    color: Colors.paymentBase,
    fontWeight: '700',
  },

  arrowBox: {
    width: 24, height: 24, borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
});
