// Catches requests to paths that must never be served as raw static files
// (source code, data files) — see vercel.json rewrites.
module.exports = function handler(req, res) {
  res.status(404).send('Not found');
};
