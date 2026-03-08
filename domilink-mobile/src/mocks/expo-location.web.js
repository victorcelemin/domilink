/**
 * Web stub for expo-location.
 * Location APIs are not available on web without user permission
 * and behave differently. This stub prevents import crashes on web.
 * All location functions are no-ops that return safe defaults.
 */
'use strict';

const Accuracy = {
  Lowest:   1,
  Low:      2,
  Balanced: 3,
  High:     4,
  Highest:  5,
  BestForNavigation: 6,
};

async function requestForegroundPermissionsAsync() {
  // On web, try to use the browser's Geolocation API
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    return new Promise((resolve) => {
      navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
        resolve({ status: result.state === 'denied' ? 'denied' : 'granted', granted: result.state !== 'denied' });
      }).catch(() => {
        resolve({ status: 'granted', granted: true });
      });
    });
  }
  return { status: 'denied', granted: false };
}

async function requestBackgroundPermissionsAsync() {
  return { status: 'denied', granted: false };
}

async function getCurrentPositionAsync() {
  // Try to use browser geolocation
  return new Promise((resolve, reject) => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude, altitude: null, accuracy: pos.coords.accuracy, altitudeAccuracy: null, heading: null, speed: null }, timestamp: pos.timestamp }),
        () => resolve({ coords: { latitude: 4.6097, longitude: -74.0817, altitude: null, accuracy: 0, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() })
      );
    } else {
      resolve({ coords: { latitude: 4.6097, longitude: -74.0817, altitude: null, accuracy: 0, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() });
    }
  });
}

async function watchPositionAsync(_options, callback) {
  // Try to use browser geolocation watchPosition
  let watchId = null;
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    watchId = navigator.geolocation.watchPosition(
      (pos) => callback({ coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude, altitude: null, accuracy: pos.coords.accuracy, altitudeAccuracy: null, heading: null, speed: null }, timestamp: pos.timestamp }),
      () => {}
    );
  }
  return {
    remove: () => {
      if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    },
  };
}

module.exports = {
  Accuracy,
  requestForegroundPermissionsAsync,
  requestBackgroundPermissionsAsync,
  getCurrentPositionAsync,
  watchPositionAsync,
};
