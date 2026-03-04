import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../../api/orderApi';
import { Colors, Shadow, orderStatusColor } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { formatCOP, formatDistance, getOrderStatusLabel, getPaymentModeLabel } from '../../utils/formatters';

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

export const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
  const isBase = order.paymentMode === 'BASE';
  const statusColor = orderStatusColor(order.status);
  const paymentColor = isBase ? Colors.paymentBase : Colors.paymentPaid;
  const paymentBg    = isBase ? Colors.paymentBaseLight : Colors.paymentPaidLight;
  const paymentBorder= isBase ? Colors.paymentBaseBorder : Colors.paymentPaidBorder;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Barra de color de estado */}
      <View style={[styles.statusStripe, { backgroundColor: statusColor }]} />

      <View style={styles.body}>
        {/* Fila superior: estado + modo pago + precio */}
        <View style={styles.topRow}>
          <View style={[styles.statusChip, { backgroundColor: statusColor + '18' }]}>
            <Ionicons name={STATUS_ICONS[order.status] ?? 'ellipse-outline'} size={13} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getOrderStatusLabel(order.status)}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[styles.paymentChip, { backgroundColor: paymentBg, borderColor: paymentBorder }]}>
              <Ionicons
                name={isBase ? 'cash-outline' : 'checkmark-circle-outline'}
                size={11}
                color={paymentColor}
              />
              <Text style={[styles.paymentText, { color: paymentColor }]}>
                {isBase ? 'BASE' : 'PAGADO'}
              </Text>
            </View>
            <Text style={styles.price}>{formatCOP(order.finalPrice)}</Text>
          </View>
        </View>

        {/* Ruta */}
        <View style={styles.routeContainer}>
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: Colors.secondary }]} />
            <Text style={styles.addressText} numberOfLines={1}>{order.pickupAddress}</Text>
          </View>
          <View style={styles.connector} />
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
            <Text style={styles.addressText} numberOfLines={1}>{order.deliveryAddress}</Text>
          </View>
        </View>

        {/* Footer: destinatario + distancia */}
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Ionicons name="person-outline" size={13} color={Colors.textTertiary} />
            <Text style={styles.footerText} numberOfLines={1}>{order.recipientName}</Text>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name="navigate-outline" size={13} color={Colors.textTertiary} />
            <Text style={styles.footerText}>{formatDistance(order.distanceKm)}</Text>
          </View>
          {isBase && order.baseAmount && (
            <View style={[styles.baseAmountChip]}>
              <Text style={styles.baseAmountText}>Base: {formatCOP(order.baseAmount)}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.small,
  },

  statusStripe: {
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },

  body: {
    flex: 1,
    padding: 14,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    ...Typography.overline,
    fontSize: 10,
  },

  paymentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  paymentText: {
    ...Typography.overline,
    fontSize: 9,
  },

  price: {
    ...Typography.subtitle2,
    color: Colors.textPrimary,
  },

  routeContainer: { marginBottom: 10 },

  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  connector: {
    width: 1.5,
    height: 10,
    backgroundColor: Colors.border,
    marginLeft: 3.25,
    marginVertical: 2,
  },
  addressText: {
    ...Typography.body3,
    color: Colors.textSecondary,
    flex: 1,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    flex: 1,
  },

  baseAmountChip: {
    backgroundColor: Colors.paymentBaseLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.paymentBaseBorder,
  },
  baseAmountText: {
    ...Typography.caption2,
    color: Colors.paymentBase,
    fontWeight: '700',
  },
});
