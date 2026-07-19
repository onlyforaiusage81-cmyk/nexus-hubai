const bcrypt = require('bcryptjs');
const { findBuyer } = require('../lib/buyers');
const { createSessionToken, buildSessionCookie } = require('../lib/auth');

// Fixed dummy hash so an unknown name takes about as long as a wrong
// password, instead of returning early and leaking which names exist.
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

  const buyer = findBuyer(name.trim());
  const hash = buyer ? buyer.passwordHash : DUMMY_HASH;
  const valid = await bcrypt.compare(password, hash);

  if (!buyer || !valid) {
    res.status(401).json({ ok: false, error: 'Invalid name or password' });
    return;
  }

  const token = createSessionToken(buyer.name);
  res.setHeader('Set-Cookie', buildSessionCookie(token));
  res.status(200).json({ ok: true, redirect: '/portal' });
};
