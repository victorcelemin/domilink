/**
 * Utilidades de formato para la app DomiLink
 */

export const formatCOP = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDistance = (km: number): string => {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTimeAgo = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;
  return formatDate(dateStr);
};

export const getOrderStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    PENDING: 'Esperando domiciliario',
    ASSIGNED: 'Domiciliario asignado',
    IN_TRANSIT: 'En camino',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
  };
  return labels[status] ?? status;
};

export const getPaymentModeLabel = (mode: string): string => {
  const labels: Record<string, string> = {
    BASE: 'Salida con base',
    PAID: 'Pago anticipado',
  };
  return labels[mode] ?? mode;
};

export const getPackageSizeLabel = (size: string): string => {
  const labels: Record<string, string> = {
    SMALL: 'Pequeno (sobre/docs)',
    MEDIUM: 'Mediano (caja pequena)',
    LARGE: 'Grande (caja grande)',
    EXTRA_LARGE: 'Extra grande',
  };
  return labels[size] ?? size;
};

export const getVehicleLabel = (vehicle: string): string => {
  const labels: Record<string, string> = {
    MOTORCYCLE: 'Moto',
    BICYCLE: 'Bicicleta',
    WALKING: 'A pie',
    CAR: 'Carro',
  };
  return labels[vehicle] ?? vehicle;
};
