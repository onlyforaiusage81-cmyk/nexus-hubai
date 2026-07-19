const crypto = require('crypto');

const COOKIE_NAME = 'nh_session';
const ADMIN_COOKIE_NAME = 'nh_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET environment variable is not set');
  return secret;
}

function sign(encodedPayload) {
  return crypto.createHmac('sha256', getSecret()).update(encodedPayload).digest('base64url');
}

// role defaults to 'buyer' so existing tokens minted before roles existed
// (payload had no `role` field) keep verifying the same way.
function createSessionToken(name, role) {
  const payload = JSON.stringify({ name, role: role || 'buyer', exp: Date.now() + SESSION_TTL_MS });
  const encodedPayload = Buffer.from(payload, 'utf8').toString('base64url');
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!payload || typeof payload.name !== 'string' || typeof payload.exp !== 'number') return null;
  if (Date.now() > payload.exp) return null;
  return { name: payload.name, role: payload.role || 'buyer', exp: payload.exp };
}

function parseCookies(req) {
  const header = req.headers.cookie;
  const cookies = {};
  if (!header) return cookies;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    cookies[key] = decodeURIComponent(value);
  });
  return cookies;
}

function isProd() {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
}

function buildSessionCookie(token, cookieName) {
  const parts = [
    `${cookieName || COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ];
  if (isProd()) parts.push('Secure');
  return parts.join('; ');
}

function buildClearCookie(cookieName) {
  const parts = [`${cookieName || COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (isProd()) parts.push('Secure');
  return parts.join('; ');
}

function getSessionFromRequest(req) {
  const cookies = parseCookies(req);
  return verifySessionToken(cookies[COOKIE_NAME]);
}

// Admin sessions live under a separate cookie name (so a buyer and an admin
// can be logged in simultaneously in the same browser without clobbering
// each other) and the payload's `role` must explicitly be 'admin' -- a
// buyer can never gain admin access just by presenting their own validly
// signed buyer token under the admin cookie name.
function getAdminSessionFromRequest(req) {
  const cookies = parseCookies(req);
  const session = verifySessionToken(cookies[ADMIN_COOKIE_NAME]);
  if (!session || session.role !== 'admin') return null;
  return session;
}

module.exports = {
  COOKIE_NAME,
  ADMIN_COOKIE_NAME,
  createSessionToken,
  verifySessionToken,
  parseCookies,
  buildSessionCookie,
  buildClearCookie,
  getSessionFromRequest,
  getAdminSessionFromRequest,
};
