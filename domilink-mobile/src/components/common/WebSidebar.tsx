/**
 * WebSidebar — Sidebar de navegación para dashboards en web/PC.
 * Solo se muestra en viewports >= 640px (tablet/desktop).
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow } from '../../theme/colors';
import { Typography } from '../../theme/typography';

interface NavItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  badge?: number;
}

interface Props {
  role: 'COMPANY' | 'COURIER';
  userName: string;
  userEmail?: string;
  status?: string;
  rating?: number;
  navItems: NavItem[];
  activeKey?: string;
  onLogout: () => void;
}

export const WebSidebar: React.FC<Props> = ({
  role, userName, userEmail, status, rating, navItems, activeKey, onLogout,
}) => {
  const isCompany = role === 'COMPANY';
  const accent = isCompany ? Colors.company : Colors.courier;
  const accentMuted = isCompany ? Colors.companyMuted : Colors.courierMuted;
  const accentDeep  = isCompany ? Colors.companyDeep  : Colors.courierDeep;

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: onLogout },
    ]);
  };

  return (
    <View style={styles.sidebar}>
      {/* Header del sidebar */}
      <View style={[styles.sidebarHeader, { backgroundColor: accent }]}>
        <View style={styles.headerOrb} />
        <View style={styles.headerOrb2} />

        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <Ionicons name="bicycle" size={18} color={Colors.white} />
          </View>
          <Text style={styles.logoText}>DomiLink</Text>
        </View>

        {/* Avatar + info usuario */}
        <View style={styles.userCard}>
          <View style={[styles.userAvatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name={isCompany ? 'business' : 'person'} size={22} color={Colors.white} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
            {userEmail && (
              <Text style={styles.userEmail} numberOfLines={1}>{userEmail}</Text>
            )}
          </View>
        </View>

        {/* Chips de estado */}
        <View style={styles.statusRow}>
          {status === 'ACTIVE' && (
            <View style={styles.activeChip}>
              <View style={styles.activeDot} />
              <Text style={styles.activeChipText}>Activo</Text>
            </View>
          )}
          {status === 'PENDING' && (
            <View style={styles.pendingChip}>
              <Ionicons name="time-outline" size={11} color="#FDE68A" />
              <Text style={styles.pendingChipText}>En revisión</Text>
            </View>
          )}
          {rating !== undefined && rating > 0 && (
            <View style={styles.ratingChip}>
              <Ionicons name="star" size={11} color="#FCD34D" />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Navegación */}
      <View style={styles.nav}>
        <Text style={styles.navSectionLabel}>Menú principal</Text>
        {navItems.map((item) => {
          const isActive = activeKey === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.navItem, isActive && [styles.navItemActive, { backgroundColor: accentMuted }]]}
              onPress={item.onPress}
              activeOpacity={0.8}
            >
              <View style={[styles.navIconBox, isActive && { backgroundColor: accent }]}>
                <Ionicons
                  name={isActive ? item.iconActive : item.icon}
                  size={18}
                  color={isActive ? Colors.white : Colors.textTertiary}
                />
              </View>
              <Text style={[styles.navLabel, isActive && { color: accent, fontWeight: '700' }]}>
                {item.label}
              </Text>
              {item.badge !== undefined && item.badge > 0 && (
                <View style={[styles.navBadge, { backgroundColor: accent }]}>
                  <Text style={styles.navBadgeText}>{item.badge}</Text>
                </View>
              )}
              {isActive && <View style={[styles.navActiveBar, { backgroundColor: accent }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer del sidebar */}
      <View style={styles.sidebarFooter}>
        <View style={styles.footerDivider} />
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <View style={styles.logoutIconBox}>
            <Ionicons name="log-out-outline" size={18} color={Colors.error} />
          </View>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <View style={styles.versionRow}>
          <Text style={styles.versionText}>DomiLink v1.0 · {isCompany ? 'Empresa' : 'Courier'}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    flex: 1,
    backgroundColor: Colors.white,
    flexDirection: 'column',
  },

  // Header
  sidebarHeader: {
    padding: 20,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  headerOrb: {
    position: 'absolute', top: -40, right: -40,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerOrb2: {
    position: 'absolute', bottom: -30, left: -20,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },

  logoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20,
  },
  logoBox: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: {
    fontSize: 17, fontWeight: '800', color: Colors.white, letterSpacing: -0.4,
  },

  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14,
  },
  userAvatar: {
    width: 44, height: 44, borderRadius: 14,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  userInfo: { flex: 1 },
  userName:  { ...Typography.subtitle2, color: Colors.white },
  userEmail: { ...Typography.caption2, color: 'rgba(255,255,255,0.65)', marginTop: 1 },

  statusRow: { flexDirection: 'row', gap: 6 },
  activeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(5,150,105,0.25)',
    borderWidth: 1, borderColor: 'rgba(5,150,105,0.4)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.courierLight },
  activeChipText: { ...Typography.caption2, color: Colors.courierLight, fontWeight: '700' },

  pendingChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(217,119,6,0.2)',
    borderWidth: 1, borderColor: 'rgba(217,119,6,0.4)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  pendingChipText: { ...Typography.caption2, color: '#FDE68A', fontWeight: '700' },

  ratingChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  ratingText: { ...Typography.caption2, color: Colors.white, fontWeight: '700' },

  // Navegación
  nav: { flex: 1, paddingTop: 16, paddingHorizontal: 12 },
  navSectionLabel: {
    ...Typography.overline,
    color: Colors.textDisabled,
    marginBottom: 8, marginLeft: 4,
  },

  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 10,
    borderRadius: 12, marginBottom: 2,
    position: 'relative', overflow: 'hidden',
  },
  navItemActive: { },
  navIconBox: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  navLabel: {
    ...Typography.body2, color: Colors.textSecondary, flex: 1,
  },
  navBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  navBadgeText: { ...Typography.caption2, color: Colors.white, fontWeight: '800' },
  navActiveBar: {
    position: 'absolute', right: 0, top: 8, bottom: 8,
    width: 3, borderRadius: 2,
  },

  // Footer
  sidebarFooter: { padding: 12 },
  footerDivider: { height: 1, backgroundColor: Colors.border, marginBottom: 12 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 10,
    borderRadius: 12, marginBottom: 12,
  },
  logoutIconBox: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: Colors.errorLight,
    alignItems: 'center', justifyContent: 'center',
  },
  logoutText: { ...Typography.body2, color: Colors.error, fontWeight: '600' },

  versionRow: { alignItems: 'center' },
  versionText: { ...Typography.caption2, color: Colors.textDisabled },
});
