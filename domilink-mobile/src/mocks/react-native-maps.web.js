/**
 * Web stub for react-native-maps.
 *
 * Maps are not supported on web in this app. On web, MapView renders a
 * styled placeholder card. Marker, Polyline, etc. are no-ops so the JSX
 * inside <MapView> doesn't crash.
 */
'use strict';

const React = require('react');
const { View, Text, StyleSheet } = require('react-native');

// ── MapView placeholder ───────────────────────────────────────────────────────
const MapView = function MapView({ style, children }) {
  // Render a nice placeholder — children (Marker, Polyline) are ignored on web.
  return React.createElement(
    View,
    { style: [styles.container, style] },
    React.createElement(
      View,
      { style: styles.inner },
      React.createElement(Text, { style: styles.icon }, '🗺️'),
      React.createElement(Text, { style: styles.title }, 'Mapa no disponible en web'),
      React.createElement(Text, { style: styles.subtitle }, 'Usa la app móvil para ver el mapa interactivo')
    )
  );
};

// Forward ref support (MapView is sometimes used with ref)
MapView.displayName = 'MapView';

// Attach static components so MapView.Marker etc. work
MapView.Marker   = function Marker()   { return null; };
MapView.Polyline = function Polyline() { return null; };
MapView.Circle   = function Circle()   { return null; };
MapView.Callout  = function Callout({ children }) { return children || null; };

// ── Named component exports ───────────────────────────────────────────────────
const Marker   = MapView.Marker;
const Polyline = MapView.Polyline;
const Circle   = MapView.Circle;
const Callout  = MapView.Callout;

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    minHeight: 180,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    overflow: 'hidden',
  },
  inner: {
    alignItems: 'center',
    padding: 20,
    gap: 6,
  },
  icon: {
    fontSize: 40,
    marginBottom: 4,
  },
  title: {
    color: '#3730A3',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#6366F1',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = MapView;
module.exports.default        = MapView;
module.exports.MapView        = MapView;
module.exports.Marker         = Marker;
module.exports.Polyline       = Polyline;
module.exports.Circle         = Circle;
module.exports.Callout        = Callout;
module.exports.PROVIDER_GOOGLE  = 'google';
module.exports.PROVIDER_DEFAULT = null;
