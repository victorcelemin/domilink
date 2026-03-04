import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { PaymentMode } from '../../api/orderApi';

interface PaymentModeSelectorProps {
  selected: PaymentMode;
  onChange: (mode: PaymentMode) => void;
}

export const PaymentModeSelector: React.FC<PaymentModeSelectorProps> = ({ selected, onChange }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modo de pago del domicilio</Text>
      <Text style={styles.subtitle}>
        ¿Cómo maneja el pago el domiciliario al recoger?
      </Text>

      {/* PAID */}
      <TouchableOpacity
        style={[styles.option, selected === 'PAID' && styles.optionSelectedPaid]}
        onPress={() => onChange('PAID')}
        activeOpacity={0.85}
      >
        <View style={[styles.iconCircle, selected === 'PAID' && styles.iconCirclePaid]}>
          <Ionicons
            name="checkmark-circle-outline"
            size={28}
            color={selected === 'PAID' ? Colors.paymentPaid : Colors.textTertiary}
          />
        </View>
        <View style={styles.optionInfo}>
          <View style={styles.optionTitleRow}>
            <Text style={[styles.optionTitle, selected === 'PAID' && { color: Colors.paymentPaid }]}>
              Pagado
            </Text>
            {selected === 'PAID' && (
              <View style={styles.selectedBadge}>
                <Ionicons name="checkmark" size={10} color={Colors.white} />
              </View>
            )}
          </View>
          <Text style={styles.optionDesc}>
            El cliente ya pagó a la empresa. El domiciliario solo entrega el paquete sin cobrar nada.
          </Text>
        </View>
      </TouchableOpacity>

      {/* BASE */}
      <TouchableOpacity
        style={[styles.option, selected === 'BASE' && styles.optionSelectedBase]}
        onPress={() => onChange('BASE')}
        activeOpacity={0.85}
      >
        <View style={[styles.iconCircle, selected === 'BASE' && styles.iconCircleBase]}>
          <Ionicons
            name="cash-outline"
            size={28}
            color={selected === 'BASE' ? Colors.paymentBase : Colors.textTertiary}
          />
        </View>
        <View style={styles.optionInfo}>
          <View style={styles.optionTitleRow}>
            <Text style={[styles.optionTitle, selected === 'BASE' && { color: Colors.paymentBase }]}>
              Con base (efectivo)
            </Text>
            {selected === 'BASE' && (
              <View style={[styles.selectedBadge, { backgroundColor: Colors.paymentBase }]}>
                <Ionicons name="checkmark" size={10} color={Colors.white} />
              </View>
            )}
          </View>
          <Text style={styles.optionDesc}>
            El domiciliario lleva efectivo para pagar el domicilio al cliente. Recupera ese dinero al entregar.
          </Text>
        </View>
      </TouchableOpacity>

      {/* Nota informativa según selección */}
      {selected === 'BASE' && (
        <View style={styles.warningBox}>
          <Ionicons name="warning-outline" size={16} color={Colors.paymentBase} />
          <Text style={styles.warningText}>
            Deberás indicar cuánto efectivo llevará el domiciliario.
            Asegúrate de que tenga el monto disponible antes de asignarlo.
          </Text>
        </View>
      )}
      {selected === 'PAID' && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.paymentPaid} />
          <Text style={styles.infoText}>
            El domiciliario solo necesita entregar el paquete. No maneja efectivo del cliente.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 20 },

  title: {
    ...Typography.subtitle1,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.body2,
    color: Colors.textSecondary,
    marginBottom: 14,
  },

  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginBottom: 10,
    ...Shadow.xs,
  },
  optionSelectedPaid: {
    borderColor: Colors.paymentPaid,
    backgroundColor: Colors.paymentPaidLight,
  },
  optionSelectedBase: {
    borderColor: Colors.paymentBase,
    backgroundColor: Colors.paymentBaseLight,
  },

  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconCirclePaid: { backgroundColor: Colors.paymentPaidBorder },
  iconCircleBase: { backgroundColor: Colors.paymentBaseBorder },

  optionInfo: { flex: 1 },

  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  optionTitle: {
    ...Typography.subtitle1,
    color: Colors.textSecondary,
  },
  selectedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.paymentPaid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionDesc: {
    ...Typography.body3,
    color: Colors.textSecondary,
    lineHeight: 19,
  },

  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.paymentBaseLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.paymentBaseBorder,
    marginTop: 2,
  },
  warningText: {
    ...Typography.caption,
    color: Colors.paymentBaseDark,
    flex: 1,
    lineHeight: 18,
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.paymentPaidLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.paymentPaidBorder,
    marginTop: 2,
  },
  infoText: {
    ...Typography.caption,
    color: Colors.paymentPaidDark,
    flex: 1,
    lineHeight: 18,
  },
});
