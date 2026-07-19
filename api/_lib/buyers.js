// Required (not fs.readFileSync) so Vercel's build-time file tracer bundles
// _data/buyers.json into the serverless function output. Also lives under
// api/ (underscore-prefixed) so Vercel never serves it as a public static
// file or treats it as a function route.
const buyers = require('../_data/buyers.json');

function findBuyer(name) {
  if (typeof name !== 'string') return null;
  return buyers.find((b) => b.name === name) || null;
}

module.exports = { findBuyer };
