/**
 * Paleta de colores DomiLink v2
 *
 * Empresa  → Índigo (#4F46E5) — profesional, confiable, moderno
 * Courier  → Esmeralda (#059669) — dinamismo, movimiento, naturaleza
 * BASE     → Ámbar (#D97706) — alerta cálida, llevas efectivo
 * PAID     → Azul cielo (#0284C7) — tranquilidad, ya está pagado
 */

export const Colors = {
  // ── Empresa (Indigo) ──────────────────────────────────────
  company: '#4F46E5',
  companyLight: '#818CF8',
  companyDark: '#3730A3',
  companyMuted: '#EEF2FF',
  companySection: '#4F46E5',

  // ── Domiciliario (Emerald) ────────────────────────────────
  courier: '#059669',
  courierLight: '#34D399',
  courierDark: '#047857',
  courierMuted: '#ECFDF5',
  courierSection: '#059669',

  // ── Acento global (Violet) ────────────────────────────────
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  primaryDark: '#3730A3',
  primaryMuted: '#EEF2FF',

  secondary: '#F59E0B',       // Ámbar acento
  secondaryLight: '#FCD34D',
  secondaryDark: '#D97706',

  // ── Modo de pago BASE (Amber) ─────────────────────────────
  paymentBase: '#D97706',
  paymentBaseDark: '#B45309',
  paymentBaseLight: '#FFFBEB',
  paymentBaseBorder: '#FDE68A',

  // ── Modo de pago PAID (Sky) ───────────────────────────────
  paymentPaid: '#0284C7',
  paymentPaidDark: '#0369A1',
  paymentPaidLight: '#F0F9FF',
  paymentPaidBorder: '#BAE6FD',

  // ── Estados de pedido ─────────────────────────────────────
  statusPending: '#D97706',
  statusAssigned: '#4F46E5',
  statusInTransit: '#7C3AED',
  statusDelivered: '#059669',
  statusCancelled: '#DC2626',

  // ── Semánticos ────────────────────────────────────────────
  success: '#059669',
  successLight: '#ECFDF5',
  successBorder: '#6EE7B7',

  warning: '#D97706',
  warningLight: '#FFFBEB',
  warningBorder: '#FDE68A',

  error: '#DC2626',
  errorLight: '#FEF2F2',
  errorBorder: '#FECACA',

  info: '#0284C7',
  infoLight: '#F0F9FF',
  infoBorder: '#BAE6FD',

  // ── Neutros (escala de grises moderna) ───────────────────
  white: '#FFFFFF',
  black: '#0F172A',

  // Superficies
  background: '#F8FAFC',      // Slate-50
  surface: '#FFFFFF',
  surfaceElevated: '#F1F5F9', // Slate-100
  card: '#FFFFFF',

  // Bordes
  border: '#E2E8F0',          // Slate-200
  borderLight: '#F1F5F9',     // Slate-100
  borderFocus: '#4F46E5',
  divider: '#E2E8F0',

  // Texto
  textPrimary: '#0F172A',     // Slate-900
  textSecondary: '#475569',   // Slate-600
  textTertiary: '#94A3B8',    // Slate-400
  textDisabled: '#CBD5E1',    // Slate-300
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#FFFFFF',
  textOnDark: '#F8FAFC',

  // Overlays
  overlay: 'rgba(15, 23, 42, 0.5)',
  overlayLight: 'rgba(15, 23, 42, 0.08)',
};

export const Shadow = {
  xs: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  small: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  large: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
};

/** Retorna el color de acento según el rol */
export const roleColor = (role?: string | null) =>
  role === 'COMPANY' ? Colors.company : Colors.courier;

/** Colores de estado de pedido */
export const orderStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    PENDING: Colors.statusPending,
    ASSIGNED: Colors.statusAssigned,
    IN_TRANSIT: Colors.statusInTransit,
    DELIVERED: Colors.statusDelivered,
    CANCELLED: Colors.statusCancelled,
  };
  return map[status] ?? Colors.textSecondary;
};
