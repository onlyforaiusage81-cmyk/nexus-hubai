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
  if (!name) {
    res.status(400).json({ ok: false, error: 'A buyer name is required.' });
    return;
  }

  try {
    const { buyers, sha } = await readBuyersFile();
    const updated = buyers.filter((b) => b.name !== name);
    if (updated.length === buyers.length) {
      res.status(404).json({ ok: false, error: `No buyer named "${name}" found.` });
      return;
    }

    await writeBuyersFile(updated, sha, `Admin: delete buyer "${name}"`);

    res.status(200).json({ ok: true, buyers: scrub(updated) });
  } catch (err) {
    res.status(502).json({ ok: false, error: `Could not save to GitHub: ${err.message}` });
  }
};
