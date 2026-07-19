const bcrypt = require('bcryptjs');
const { requireAdminSession } = require('../_lib/adminGuard');
const { readBuyersFile, writeBuyersFile } = require('../_lib/github');

function scrub(buyers) {
  return buyers.map((b) => ({ name: b.name, products: b.products || [] }));
}

module.exports = async function handler(req, res) {
  const admin = requireAdminSession(req, res);
  if (!admin) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const body = req.body || {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!name) {
    res.status(400).json({ ok: false, error: 'A buyer name is required.' });
    return;
  }
  if (!password || password.length < 8) {
    res.status(400).json({ ok: false, error: 'Password must be at least 8 characters.' });
    return;
  }

  try {
    const { buyers, sha } = await readBuyersFile();
    const index = buyers.findIndex((b) => b.name === name);
    if (index === -1) {
      res.status(404).json({ ok: false, error: `No buyer named "${name}" found.` });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const updated = buyers.map((b, i) => (i === index ? { ...b, passwordHash } : b));
    await writeBuyersFile(updated, sha, `Admin: reset password for "${name}"`);

    res.status(200).json({ ok: true, buyers: scrub(updated) });
  } catch (err) {
    res.status(502).json({ ok: false, error: `Could not save to GitHub: ${err.message}` });
  }
};
