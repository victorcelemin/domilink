/**
 * Web stub for react-native-maps.
 * Maps are not supported on web in this app — screens show a placeholder instead.
 */
const React = require('react');
const { View, Text, StyleSheet } = require('react-native');

const MapPlaceholder = ({ style, children }) =>
  React.createElement(
    View,
    { style: [styles.container, style] },
    React.createElement(Text, { style: styles.text }, '🗺️  Mapa disponible en dispositivo móvil'),
    children
  );

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e8f0fe',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    minHeight: 200,
  },
  text: {
    color: '#3949ab',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    padding: 16,
  },
});

MapPlaceholder.Marker = ({ children }) => children || null;
MapPlaceholder.Polyline = () => null;
MapPlaceholder.Circle = () => null;
MapPlaceholder.Callout = ({ children }) => children || null;

module.exports = MapPlaceholder;
module.exports.default = MapPlaceholder;
module.exports.PROVIDER_GOOGLE = 'google';
module.exports.PROVIDER_DEFAULT = null;
module.exports.Marker = MapPlaceholder.Marker;
module.exports.Polyline = MapPlaceholder.Polyline;
module.exports.Circle = MapPlaceholder.Circle;
module.exports.Callout = MapPlaceholder.Callout;
