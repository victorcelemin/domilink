/**
 * scripts/patch-reanimated.js
 *
 * Patches react-native-reanimated's package.json so that Metro on web
 * uses our CJS stub instead of the ESM-only lib/module/index entry point,
 * which causes "Unexpected token 'export'" at runtime.
 *
 * Run automatically via `postinstall` in package.json.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const pkgPath = path.join(
  __dirname, '..', 'node_modules', 'react-native-reanimated', 'package.json'
);

if (!fs.existsSync(pkgPath)) {
  console.log('[patch-reanimated] package not found, skipping.');
  process.exit(0);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// If already patched, do nothing
if (pkg._reanimated_patched) {
  console.log('[patch-reanimated] already patched, skipping.');
  process.exit(0);
}

// Relative path from node_modules/react-native-reanimated/ to our stub
const stubRelative = '../../src/mocks/react-native-reanimated.web.js';

pkg._orig_main   = pkg.main;
pkg._orig_module = pkg.module;
pkg._reanimated_patched = true;

// Metro on web checks 'browser' field first, then 'main'
pkg.browser = stubRelative;
pkg.main    = stubRelative;
delete pkg.module; // avoid Metro preferring ESM module field

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log('[patch-reanimated] patched successfully.');
console.log('  main:', pkg.main);
console.log('  browser:', pkg.browser);
