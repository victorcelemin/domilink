/**
 * Paleta de colores DomiLink v3 — Design System Premium
 *
 * Empresa  → Índigo profundo (#4338CA) → Violet (#7C3AED) — liderazgo, tech, premium
 * Courier  → Esmeralda (#059669) → Teal (#0D9488) — movimiento, energía, confianza
 * BASE     → Ámbar (#D97706) — alerta cálida, llevas efectivo
 * PAID     → Azul cielo (#0284C7) — tranquilidad, ya está pagado
 */

export const Colors = {
  // ── Empresa (Indigo-Violet premium) ──────────────────────────
  company: '#4338CA',
  companyLight: '#818CF8',
  companyDark: '#3730A3',
  companyDeep: '#1E1B4B',
  companyMuted: '#EEF2FF',
  companySection: '#4338CA',
  companyAccent: '#7C3AED',   // violet para gradientes

  // ── Domiciliario (Emerald-Teal) ────────────────────────────────
  courier: '#059669',
  courierLight: '#34D399',
  courierDark: '#047857',
  courierDeep: '#064E3B',
  courierMuted: '#ECFDF5',
  courierSection: '#059669',
  courierAccent: '#0D9488',   // teal para gradientes

  // ── Acento global ─────────────────────────────────────────────
  primary: '#4338CA',
  primaryLight: '#818CF8',
  primaryDark: '#3730A3',
  primaryMuted: '#EEF2FF',

  secondary: '#F59E0B',
  secondaryLight: '#FCD34D',
  secondaryDark: '#D97706',

  // ── Modo de pago BASE (Amber) ─────────────────────────────────
  paymentBase: '#D97706',
  paymentBaseDark: '#B45309',
  paymentBaseLight: '#FFFBEB',
  paymentBaseBorder: '#FDE68A',

  // ── Modo de pago PAID (Sky) ───────────────────────────────────
  paymentPaid: '#0284C7',
  paymentPaidDark: '#0369A1',
  paymentPaidLight: '#F0F9FF',
  paymentPaidBorder: '#BAE6FD',

  // ── Estados de pedido ─────────────────────────────────────────
  statusPending: '#D97706',
  statusAssigned: '#4338CA',
  statusInTransit: '#7C3AED',
  statusDelivered: '#059669',
  statusCancelled: '#DC2626',

  // ── Semánticos ────────────────────────────────────────────────
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

  // ── Neutros ───────────────────────────────────────────────────
  white: '#FFFFFF',
  black: '#0F172A',

  // Superficies
  background: '#F1F5F9',      // Slate-100 — ligeramente más pronunciado
  surface: '#FFFFFF',
  surfaceElevated: '#F8FAFC',
  card: '#FFFFFF',

  // Bordes
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#4338CA',
  divider: '#E2E8F0',

  // Texto
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textDisabled: '#CBD5E1',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#FFFFFF',
  textOnDark: '#F8FAFC',

  // Overlays
  overlay: 'rgba(15, 23, 42, 0.55)',
  overlayLight: 'rgba(15, 23, 42, 0.06)',

  // ── Glassmorphism ─────────────────────────────────────────────
  glass: 'rgba(255, 255, 255, 0.12)',
  glassBorder: 'rgba(255, 255, 255, 0.22)',
  glassDark: 'rgba(15, 23, 42, 0.35)',
};

export const Shadow = {
  xs: {
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  small: {
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  medium: {
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  large: {
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
  },
  colored: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  }),
};

/** Retorna el color de acento según el rol */
export const roleColor = (role?: string | null) =>
  role === 'COMPANY' ? Colors.company : Colors.courier;

/** Colores de estado de pedido */
export const orderStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    PENDING:    Colors.statusPending,
    ASSIGNED:   Colors.statusAssigned,
    IN_TRANSIT: Colors.statusInTransit,
    DELIVERED:  Colors.statusDelivered,
    CANCELLED:  Colors.statusCancelled,
  };
  return map[status] ?? Colors.textSecondary;
};

/** Gradientes lineales para uso con LinearGradient (como strings para referencia) */
export const Gradients = {
  company:       ['#4338CA', '#7C3AED'],
  companyDeep:   ['#1E1B4B', '#4338CA'],
  courier:       ['#059669', '#0D9488'],
  courierDeep:   ['#064E3B', '#059669'],
  sunset:        ['#F59E0B', '#EF4444'],
  slate:         ['#1E293B', '#0F172A'],
  cardCompany:   ['#EEF2FF', '#F5F3FF'],
  cardCourier:   ['#ECFDF5', '#F0FDFA'],
};
