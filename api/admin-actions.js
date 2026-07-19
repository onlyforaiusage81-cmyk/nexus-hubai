// All four buyer-management writes in one Serverless Function (dispatched
// by body.action), instead of four separate files -- see api/tools/[slug].js
// for why: the Hobby plan caps a deployment at 12 functions.
const bcrypt = require('bcryptjs');
const { requireAdminSession } = require('./_lib/adminGuard');
const { readBuyersFile, writeBuyersFile } = require('./_lib/github');
const { validateProducts } = require('./_lib/entitlements');

function scrub(buyers) {
  return buyers.map((b) => ({ name: b.name, products: b.products || [] }));
}

async function createBuyer(body, buyers) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!name || name.length > 100) return { status: 400, error: 'A valid buyer name is required.' };
  if (!password || password.length < 8) return { status: 400, error: 'Password must be at least 8 characters.' };

  const { value: products, error: productsError } = validateProducts(body.products);
  if (productsError) return { status: 400, error: productsError };
  if (buyers.some((b) => b.name === name)) return { status: 409, error: `A buyer named "${name}" already exists.` };

  const passwordHash = await bcrypt.hash(password, 10);
  return { buyers: [...buyers, { name, passwordHash, products }], message: `Admin: add buyer "${name}"` };
}

async function updateProducts(body, buyers) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return { status: 400, error: 'A buyer name is required.' };

  const { value: products, error: productsError } = validateProducts(body.products);
  if (productsError) return { status: 400, error: productsError };

  const index = buyers.findIndex((b) => b.name === name);
  if (index === -1) return { status: 404, error: `No buyer named "${name}" found.` };

  const updated = buyers.map((b, i) => (i === index ? { ...b, products } : b));
  return { buyers: updated, message: `Admin: update plan for "${name}"` };
}

async function resetPassword(body, buyers) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!name) return { status: 400, error: 'A buyer name is required.' };
  if (!password || password.length < 8) return { status: 400, error: 'Password must be at least 8 characters.' };

  const index = buyers.findIndex((b) => b.name === name);
  if (index === -1) return { status: 404, error: `No buyer named "${name}" found.` };

  const passwordHash = await bcrypt.hash(password, 10);
  const updated = buyers.map((b, i) => (i === index ? { ...b, passwordHash } : b));
  return { buyers: updated, message: `Admin: reset password for "${name}"` };
}

async function deleteBuyer(body, buyers) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return { status: 400, error: 'A buyer name is required.' };

  const updated = buyers.filter((b) => b.name !== name);
  if (updated.length === buyers.length) return { status: 404, error: `No buyer named "${name}" found.` };

  return { buyers: updated, message: `Admin: delete buyer "${name}"` };
}

const ACTIONS = {
  create: createBuyer,
  'update-products': updateProducts,
  'reset-password': resetPassword,
  delete: deleteBuyer,
};

module.exports = async function handler(req, res) {
  const admin = requireAdminSession(req, res);
  if (!admin) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const body = req.body || {};
  const fn = ACTIONS[body.action];
  if (!fn) {
    res.status(400).json({ ok: false, error: 'Unknown or missing action.' });
    return;
  }

  try {
    const { buyers, sha } = await readBuyersFile();
    const result = await fn(body, buyers);

    if (result.error) {
      res.status(result.status).json({ ok: false, error: result.error });
      return;
    }

    await writeBuyersFile(result.buyers, sha, result.message);
    res.status(200).json({ ok: true, buyers: scrub(result.buyers) });
  } catch (err) {
    res.status(502).json({ ok: false, error: `Could not save to GitHub: ${err.message}` });
  }
};
