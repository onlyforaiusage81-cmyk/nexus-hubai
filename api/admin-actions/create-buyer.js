const bcrypt = require('bcryptjs');
const { requireAdminSession } = require('../_lib/adminGuard');
const { readBuyersFile, writeBuyersFile } = require('../_lib/github');
const { validateProducts } = require('../_lib/entitlements');

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

  if (!name || name.length > 100) {
    res.status(400).json({ ok: false, error: 'A valid buyer name is required.' });
    return;
  }
  if (!password || password.length < 8) {
    res.status(400).json({ ok: false, error: 'Password must be at least 8 characters.' });
    return;
  }

  const { value: products, error: productsError } = validateProducts(body.products);
  if (productsError) {
    res.status(400).json({ ok: false, error: productsError });
    return;
  }

  try {
    const { buyers, sha } = await readBuyersFile();

    if (buyers.some((b) => b.name === name)) {
      res.status(409).json({ ok: false, error: `A buyer named "${name}" already exists.` });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const updated = [...buyers, { name, passwordHash, products }];
    await writeBuyersFile(updated, sha, `Admin: add buyer "${name}"`);

    res.status(200).json({ ok: true, buyers: scrub(updated) });
  } catch (err) {
    res.status(502).json({ ok: false, error: `Could not save to GitHub: ${err.message}` });
  }
};
