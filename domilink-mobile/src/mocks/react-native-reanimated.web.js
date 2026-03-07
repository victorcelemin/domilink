/**
 * Web stub for react-native-reanimated ~3.6.
 *
 * react-native-reanimated 3.x ships only an ESM build (lib/module/index.js)
 * that Metro for web cannot transpile, causing "Unexpected token 'export'" at
 * runtime. This stub replaces the package on web with equivalents from
 * React Native's built-in Animated API, which Metro handles correctly.
 *
 * Hooks and components used in this project are re-exported with compatible
 * signatures so no screen code needs to change.
 */
'use strict';

const ReactNative = require('react-native');
const React = require('react');

const Animated = ReactNative.Animated;

// ── useSharedValue → plain ref-like object ────────────────────────────────────
function useSharedValue(initial) {
  const ref = React.useRef(null);
  if (ref.current === null) {
    ref.current = new Animated.Value(initial);
    ref.current._value = initial;
  }
  return ref.current;
}

// ── useAnimatedStyle → inline style (no-op on web) ───────────────────────────
function useAnimatedStyle(fn) {
  return fn();
}

// ── useDerivedValue ───────────────────────────────────────────────────────────
function useDerivedValue(fn) {
  return { value: fn() };
}

// ── Animation helpers → delegate to RN Animated ──────────────────────────────
function withTiming(toValue, config, callback) {
  return { toValue, ...config, _isAnimation: true, _type: 'timing', callback };
}
function withSpring(toValue, config, callback) {
  return { toValue, ...config, _isAnimation: true, _type: 'spring', callback };
}
function withDelay(delay, animation) {
  return { ...animation, delay };
}
function withRepeat(animation, numberOfReps, reverse) {
  return animation;
}
function withSequence(...animations) {
  return animations[animations.length - 1] || {};
}
function withDecay(config) {
  return config;
}
function cancelAnimation() {}
function runOnJS(fn) { return fn; }
function runOnUI(fn) { return fn; }

// ── interpolate ───────────────────────────────────────────────────────────────
function interpolate(value, inputRange, outputRange) {
  const v = typeof value === 'object' && value !== null ? value._value ?? 0 : value;
  const len = inputRange.length;
  if (v <= inputRange[0]) return outputRange[0];
  if (v >= inputRange[len - 1]) return outputRange[len - 1];
  for (let i = 0; i < len - 1; i++) {
    if (v >= inputRange[i] && v <= inputRange[i + 1]) {
      const t = (v - inputRange[i]) / (inputRange[i + 1] - inputRange[i]);
      return outputRange[i] + t * (outputRange[i + 1] - outputRange[i]);
    }
  }
  return outputRange[len - 1];
}

const Extrapolation = { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' };

// ── Animated components ───────────────────────────────────────────────────────
const ReanimatedView       = Animated.View;
const ReanimatedText       = Animated.Text;
const ReanimatedImage      = Animated.Image;
const ReanimatedScrollView = Animated.ScrollView;
const ReanimatedFlatList   = Animated.FlatList;

function createAnimatedComponent(Component) {
  return Animated.createAnimatedComponent(Component);
}

// ── useAnimatedRef ────────────────────────────────────────────────────────────
function useAnimatedRef() {
  return React.useRef(null);
}

// ── useAnimatedScrollHandler (no-op) ─────────────────────────────────────────
function useAnimatedScrollHandler(handlers) {
  return handlers.onScroll || function () {};
}

// ── useAnimatedGestureHandler (no-op) ────────────────────────────────────────
function useAnimatedGestureHandler(handlers) {
  return handlers;
}

// ── useAnimatedProps (no-op) ──────────────────────────────────────────────────
function useAnimatedProps(fn) {
  return fn();
}

// ── Layout animations (no-op stubs) ──────────────────────────────────────────
const FadeIn            = { duration: function() { return FadeIn; }, delay: function() { return FadeIn; } };
const FadeOut           = { duration: function() { return FadeOut; }, delay: function() { return FadeOut; } };
const FadeInUp          = FadeIn;
const FadeInDown        = FadeIn;
const FadeOutUp         = FadeOut;
const FadeOutDown       = FadeOut;
const SlideInLeft       = FadeIn;
const SlideInRight      = FadeIn;
const SlideOutLeft      = FadeOut;
const SlideOutRight     = FadeOut;
const ZoomIn            = FadeIn;
const ZoomOut           = FadeOut;
const Layout            = { duration: function() { return Layout; } };
const LinearTransition  = Layout;
const BounceIn          = FadeIn;
const BounceOut         = FadeOut;

function enableLayoutAnimations() {}

// ── useFrameCallback (no-op) ──────────────────────────────────────────────────
function useFrameCallback() {}

// ── Keyframe (no-op) ─────────────────────────────────────────────────────────
class Keyframe {
  constructor() {}
  duration() { return this; }
  delay() { return this; }
}

// ── Worklet utils ─────────────────────────────────────────────────────────────
function makeShareableCloneRecursive(v) { return v; }
function makeMutable(initial) { return { value: initial }; }
function isReanimated3() { return false; }
function isConfigured() { return false; }

// ── clamp ─────────────────────────────────────────────────────────────────────
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  // Core Animated
  default: Animated,
  Animated,

  // Animated components
  View:       ReanimatedView,
  Text:       ReanimatedText,
  Image:      ReanimatedImage,
  ScrollView: ReanimatedScrollView,
  FlatList:   ReanimatedFlatList,
  createAnimatedComponent,

  // Hooks
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedGestureHandler,
  useAnimatedProps,
  useFrameCallback,

  // Animations
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  withDecay,
  cancelAnimation,

  // Utils
  interpolate,
  clamp,
  Extrapolation,
  runOnJS,
  runOnUI,
  makeMutable,
  makeShareableCloneRecursive,
  isReanimated3,
  isConfigured,
  enableLayoutAnimations,

  // Layout animations
  FadeIn,
  FadeOut,
  FadeInUp,
  FadeInDown,
  FadeOutUp,
  FadeOutDown,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
  ZoomIn,
  ZoomOut,
  Layout,
  LinearTransition,
  BounceIn,
  BounceOut,
  Keyframe,
};
