const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const triageHandler = require('./api/triage');
const clientBundle = require('./lib/client-bundle');

const ROOT = __dirname;
const PUBLIC_ASSETS = new Map([
  ['/', { file: 'index.html', filePath: path.join(__dirname, 'index.html'), type: 'text/html; charset=utf-8' }],
  ['/index.html', { file: 'index.html', filePath: path.join(__dirname, 'index.html'), type: 'text/html; charset=utf-8' }],
  ['/styles.css', { file: 'styles.css', filePath: path.join(__dirname, 'styles.css'), type: 'text/css; charset=utf-8' }],
  ['/app.js', { file: 'app.js', filePath: path.join(__dirname, 'app.js'), type: 'application/javascript; charset=utf-8', fallback: () => clientBundle }],
  ['/client.js', { file: 'app.js', filePath: path.join(__dirname, 'app.js'), type: 'application/javascript; charset=utf-8', fallback: () => clientBundle }],
  ['/csv.js', { file: 'csv.js', filePath: path.join(__dirname, 'csv.js'), type: 'application/javascript; charset=utf-8' }],
  ['/favicon.svg', { file: 'favicon.svg', filePath: path.join(__dirname, 'favicon.svg'), type: 'image/svg+xml' }],
  ['/favicon.ico', { file: 'favicon.svg', filePath: path.join(__dirname, 'favicon.svg'), type: 'image/svg+xml' }],
]);

const SECURITY_HEADERS = Object.freeze({
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
});

function applySecurityHeaders(res) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(key, value);
  }
}

function readRequestBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    if (req.body !== undefined) {
      if (typeof req.body === 'string') {
        if (Buffer.byteLength(req.body, 'utf8') > maxBytes) {
          const err = new Error('Payload too large');
          err.code = 'REQUEST_TOO_LARGE';
          reject(err);
          return;
        }
        resolve(req.body);
        return;
      }
      if (Buffer.isBuffer(req.body)) {
        if (req.body.length > maxBytes) {
          const err = new Error('Payload too large');
          err.code = 'REQUEST_TOO_LARGE';
          reject(err);
          return;
        }
        resolve(req.body.toString('utf8'));
        return;
      }
      if (typeof req.body === 'object' && req.body !== null) {
        const serialized = JSON.stringify(req.body);
        if (Buffer.byteLength(serialized, 'utf8') > maxBytes) {
          const err = new Error('Payload too large');
          err.code = 'REQUEST_TOO_LARGE';
          reject(err);
          return;
        }
        resolve(serialized);
        return;
      }
    }

    const chunks = [];
    let total = 0;
    let tooLarge = false;
    req.on('data', (chunk) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
      total += buf.length;
      if (total > maxBytes) {
        tooLarge = true;
      } else {
        chunks.push(buf);
      }
    });
    req.on('end', () => {
      if (tooLarge) {
        const err = new Error('Payload too large');
        err.code = 'REQUEST_TOO_LARGE';
        reject(err);
        return;
      }
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', reject);
  });
}

async function readAssetContent(asset) {
  const candidates = [
    asset.filePath,
    path.join(ROOT, asset.file),
    path.join(process.cwd(), asset.file),
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      return await fs.promises.readFile(candidate);
    } catch {
      // Try next candidate path or embedded bundle fallback
    }
  }
  if (typeof asset.fallback === 'function') {
    const fallbackText = asset.fallback();
    if (typeof fallbackText === 'string' && fallbackText.length > 0) {
      return Buffer.from(fallbackText, 'utf8');
    }
  }
  throw new Error(`Asset unavailable: ${asset.file}`);
}

async function handleRequest(req, res) {
  try {
    applySecurityHeaders(res);

    const parsedUrl = new URL(req.url || '/', 'http://localhost');
    const pathname = parsedUrl.pathname;

    if (pathname === '/api/triage') {
      if (req.method === 'POST' && (req.body === undefined || typeof req.body === 'string' || Buffer.isBuffer(req.body))) {
        try {
          const raw = await readRequestBody(req, triageHandler.MAX_REQUEST_BYTES || 6000);
          if (!raw.trim()) {
            req.body = {};
          } else {
            try {
              req.body = JSON.parse(raw);
            } catch {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.setHeader('Cache-Control', 'no-store');
              res.end(JSON.stringify({ error: 'INVALID_JSON', message: 'Request body must be valid JSON.' }));
              return;
            }
          }
        } catch (err) {
          if (err && err.code === 'REQUEST_TOO_LARGE') {
            res.statusCode = 413;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store');
            res.end(JSON.stringify({ error: 'REQUEST_TOO_LARGE', message: 'The report is too large.' }));
            return;
          }
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'BAD_REQUEST', message: 'Could not read request body.' }));
          return;
        }
      }
      await triageHandler(req, res);
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = 405;
      res.setHeader('Allow', 'GET, HEAD');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Method Not Allowed');
      return;
    }

    const asset = PUBLIC_ASSETS.get(pathname);
    if (!asset) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Not Found');
      return;
    }

    const content = await readAssetContent(asset);
    res.statusCode = 200;
    res.setHeader('Content-Type', asset.type);
    res.setHeader('Cache-Control', 'no-cache');
    if (req.method === 'HEAD') {
      res.end();
    } else {
      res.end(content);
    }
  } catch {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    }
    res.end('Internal Server Error');
  }
}

function createServer() {
  return http.createServer(handleRequest);
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || '0.0.0.0';
  const server = createServer();
  server.listen(port, host, () => {
    console.log(`CampusResolve AI server listening on http://${host}:${port}`);
  });
}

handleRequest.createServer = createServer;
handleRequest.PUBLIC_ASSETS = PUBLIC_ASSETS;
handleRequest.SECURITY_HEADERS = SECURITY_HEADERS;

module.exports = handleRequest;
