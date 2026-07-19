const bcrypt = require('bcryptjs');
const { findAdmin } = require('./_lib/admins');
const { createSessionToken, buildSessionCookie, ADMIN_COOKIE_NAME } = require('./_lib/auth');

// Same timing-attack mitigation as buyer login: compare against a dummy
// hash when the name doesn't exist so an unknown admin name isn't
// distinguishable from a wrong password by response time.
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8O5V.Vd0lZ8O5f9m2vN5s6X8g6y2Bq';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const body = req.body || {};
  const { name, password } = body;

  if (typeof name !== 'string' || typeof password !== 'string' || !name.trim() || !password) {
    res.status(400).json({ ok: false, error: 'Name and password are required' });
    return;
  }

  const admin = findAdmin(name.trim());
  const hash = admin ? admin.passwordHash : DUMMY_HASH;
  const valid = await bcrypt.compare(password, hash);

  if (!admin || !valid) {
    res.status(401).json({ ok: false, error: 'Invalid name or password' });
    return;
  }

  const token = createSessionToken(admin.name, 'admin');
  res.setHeader('Set-Cookie', buildSessionCookie(token, ADMIN_COOKIE_NAME));
  res.status(200).json({ ok: true, redirect: '/admin' });
};
