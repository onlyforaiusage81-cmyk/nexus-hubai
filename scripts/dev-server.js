// Local dev server that emulates Vercel's static + serverless-function
// routing (including the /login and /portal rewrites from vercel.json)
// well enough to test the auth flow without needing `vercel dev` to be
// logged in / linked to a Vercel project. Run with: node scripts/dev-server.js

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = path.join(__dirname, '..');

// --- minimal .env.local loader (no dependency needed for one var) ---
const envPath = path.join(ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function sendJson(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

// Wrap a Vercel-style (req, res) => void handler so res.status().json()/.send() work.
function adaptRes(res) {
  res.status = function (code) {
    res.statusCode = code;
    return res;
  };
  res.json = function (body) {
    if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(body));
  };
  res.send = function (body) {
    res.end(body);
  };
  return res;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;
  adaptRes(res);

  try {
    if (pathname === '/api/login') {
      req.body = await readBody(req);
      delete require.cache[require.resolve('../api/login.js')];
      const handler = require('../api/login.js');
      return handler(req, res);
    }
    if (pathname === '/api/logout') {
      delete require.cache[require.resolve('../api/logout.js')];
      const handler = require('../api/logout.js');
      return handler(req, res);
    }
    if (pathname === '/portal') {
      delete require.cache[require.resolve('../api/portal.js')];
      delete require.cache[require.resolve('../api/_lib/auth.js')];
      const handler = require('../api/portal.js');
      return handler(req, res);
    }
    if (pathname === '/login') {
      const filePath = path.join(ROOT, 'login.html');
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(content);
    }
    if (pathname === '/tools/roadmap-creator') {
      delete require.cache[require.resolve('../api/tools/roadmap-creator.js')];
      delete require.cache[require.resolve('../api/_lib/auth.js')];
      const handler = require('../api/tools/roadmap-creator.js');
      return handler(req, res);
    }
    if (pathname === '/tools/ramp-up-planner') {
      delete require.cache[require.resolve('../api/tools/rampup-planner.js')];
      delete require.cache[require.resolve('../api/_lib/auth.js')];
      const handler = require('../api/tools/rampup-planner.js');
      return handler(req, res);
    }

    // Real Vercel deployments never serve /api/** as static files (that whole
    // tree is reserved for Serverless Functions) — match that here so local
    // testing doesn't give a false sense of security.
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      res.writeHead(404);
      return res.end('Not found');
    }

    // static file serving
    let filePath = path.join(ROOT, pathname === '/' ? 'index.html' : pathname);
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(400);
      return res.end('Bad request');
    }
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      return res.end('Not found');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error(err);
    sendJson(res, 500, { ok: false, error: 'Internal error' });
  }
});

const PORT = process.env.PORT || 5500;
server.listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT}`);
});
