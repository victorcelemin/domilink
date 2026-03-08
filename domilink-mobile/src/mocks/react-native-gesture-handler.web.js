/**
 * Web stub for react-native-gesture-handler.
 * On web, gesture handler is not needed — we use standard React/DOM events.
 * This stub exports the required symbols so imports don't crash on web.
 */
'use strict';

const React = require('react');
const { View, ScrollView, FlatList, TouchableOpacity } = require('react-native');

// GestureHandlerRootView is simply a View on web
const GestureHandlerRootView = ({ style, children }) =>
  React.createElement(View, { style }, children);

// PanGestureHandler, TapGestureHandler etc. just render their children
const noopHandler = ({ children }) => children || null;

const GestureDetector = ({ children }) => children || null;
const Gesture = {
  Pan: () => ({ onUpdate: () => Gesture.Pan(), onEnd: () => Gesture.Pan(), enabled: () => Gesture.Pan() }),
  Tap: () => ({ onEnd: () => Gesture.Tap(), enabled: () => Gesture.Tap() }),
  Simultaneous: (...g) => g[0],
  Race: (...g) => g[0],
  Exclusive: (...g) => g[0],
};

module.exports = {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
  PanGestureHandler:        noopHandler,
  TapGestureHandler:        noopHandler,
  PinchGestureHandler:      noopHandler,
  RotationGestureHandler:   noopHandler,
  LongPressGestureHandler:  noopHandler,
  FlingGestureHandler:      noopHandler,
  ForceTouchGestureHandler: noopHandler,
  NativeViewGestureHandler: noopHandler,
  RawButton:                TouchableOpacity,
  BaseButton:               TouchableOpacity,
  RectButton:               TouchableOpacity,
  BorderlessButton:         TouchableOpacity,
  ScrollView,
  FlatList,
  State: { UNDETERMINED: 0, FAILED: 1, BEGAN: 2, CANCELLED: 3, ACTIVE: 4, END: 5 },
  Directions: { RIGHT: 1, LEFT: 2, UP: 4, DOWN: 8 },
};
