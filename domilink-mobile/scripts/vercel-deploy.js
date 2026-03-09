/**
 * scripts/vercel-deploy.js
 *
 * Sube el contenido de dist/ a Vercel usando la API REST directamente,
 * sin necesitar el CLI ni asociacion git.
 *
 * Uso: node scripts/vercel-deploy.js
 */
'use strict';

const https  = require('https');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const TOKEN      = 'vca_61gbXSNYGwnSHiHcw1V26XUIzWbDNN5oqVHJJpyiLsLsMRFfBx1p7kl0';
const TEAM_ID    = 'victorcelemins-projects';
const PROJECT_ID = 'prj_DqbrJKu3rmfIlGShv3xC9gVUfOIG';

// ── helpers ──────────────────────────────────────────────────────────────────

function apiRequest(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? Buffer.from(JSON.stringify(body)) : null;
    const options = {
      hostname: 'api.vercel.com',
      path: urlPath + (urlPath.includes('?') ? '&' : '?') + 'teamId=' + TEAM_ID,
      method,
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': payload.length } : {}),
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', d => { data += d; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function uploadFile(sha, content, mimeType) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: '/v2/files?teamId=' + TEAM_ID,
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Content-Type': mimeType || 'application/octet-stream',
        'Content-Length': content.length,
        'x-vercel-digest': sha,
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', d => { data += d; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(content);
    req.end();
  });
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'application/javascript',
    '.css':  'text/css',
    '.json': 'application/json',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.ico':  'image/x-icon',
    '.ttf':  'font/ttf',
    '.woff': 'font/woff',
    '.woff2':'font/woff2',
    '.svg':  'image/svg+xml',
    '.txt':  'text/plain',
    '.map':  'application/json',
  };
  return map[ext] || 'application/octet-stream';
}

function walkDir(dir, base) {
  base = base || dir;
  const results = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      results.push(...walkDir(full, base));
    } else {
      const relPath = full.slice(base.length).replace(/\\/g, '/').replace(/^\//, '');
      const content = fs.readFileSync(full);
      const sha = crypto.createHash('sha1').update(content).digest('hex');
      results.push({ relPath, content, sha, size: content.length, mime: getMimeType(relPath) });
    }
  }
  return results;
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const distDir = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(distDir)) {
    console.error('ERROR: dist/ no existe. Corre expo export primero.');
    process.exit(1);
  }

  const files = walkDir(distDir);
  console.log('Archivos a desplegar:', files.length);

  // 1. Subir archivos
  console.log('\n[1/3] Subiendo archivos...');
  let uploaded = 0;
  for (const f of files) {
    const res = await uploadFile(f.sha, f.content, f.mime);
    if (res.status !== 200 && res.status !== 201) {
      // 409 = ya existe (ok)
      if (res.status !== 409) {
        console.log('  WARN upload', f.relPath, res.status);
      }
    }
    uploaded++;
    if (uploaded % 5 === 0) process.stdout.write('.');
  }
  console.log('\n  Subidos:', uploaded, 'archivos');

  // 2. Crear deployment
  console.log('\n[2/3] Creando deployment...');
  const deployBody = {
    name: 'domilink-mobile',
    project: PROJECT_ID,
    target: 'production',
    // Subir los archivos tal cual — sin buildCommand para despliegue estático
    files: files.map(f => ({ file: f.relPath, sha: f.sha, size: f.size })),
    // Sin builds = Vercel trata los archivos como output estático directo
    builds: [],
    routes: [
      {
        src: '/api/(.*)',
        dest: 'https://domilink-api-gateway-755906643293.us-central1.run.app/api/$1',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-User-Id,X-User-Role,X-User-Email,X-Company-Id,X-Courier-Id',
          'Access-Control-Max-Age': '3600',
        },
      },
      { src: '/_expo/static/(.*)', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' }, continue: true },
      { src: '/assets/(.*)',        headers: { 'Cache-Control': 'public, max-age=604800' },               continue: true },
      { handle: 'filesystem' },
      { src: '/((?!_expo|static|favicon\\.ico|assets|api).*)', dest: '/index.html' },
    ],
  };

  const deployRes = await apiRequest('POST', '/v13/deployments', deployBody);
  console.log('  Status:', deployRes.status);

  if (deployRes.status !== 200 && deployRes.status !== 201) {
    console.error('  ERROR:', JSON.stringify(deployRes.body, null, 2));
    process.exit(1);
  }

  const deployment = deployRes.body;
  console.log('  ID:', deployment.id);
  console.log('  URL:', deployment.url);

  // 3. Esperar a que esté listo
  console.log('\n[3/3] Esperando deployment...');
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const statusRes = await apiRequest('GET', '/v13/deployments/' + deployment.id, null);
    const state = statusRes.body.readyState || statusRes.body.status;
    process.stdout.write('\r  Estado: ' + state + '          ');
    if (state === 'READY') {
      console.log('\n\nDeploy exitoso!');
      console.log('URL produccion: https://' + deployment.url);
      console.log('URL alias:      https://domilink-mobile-victorcelemins-projects.vercel.app');
      return;
    }
    if (state === 'ERROR' || state === 'CANCELED') {
      console.log('\n\nDeploy FALLIDO. Estado:', state);
      const errRes = await apiRequest('GET', '/v13/deployments/' + deployment.id + '/events', null);
      console.log('Eventos:', JSON.stringify(errRes.body, null, 2).slice(0, 2000));
      process.exit(1);
    }
  }
  console.log('\nTimeout esperando deploy. URL:', 'https://' + deployment.url);
}

main().catch(e => { console.error(e); process.exit(1); });
