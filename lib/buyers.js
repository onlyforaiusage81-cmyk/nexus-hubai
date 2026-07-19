// Required (not fs.readFileSync) so Vercel's build-time file tracer bundles
// data/buyers.json into the serverless function output.
const buyers = require('../data/buyers.json');

function findBuyer(name) {
  if (typeof name !== 'string') return null;
  return buyers.find((b) => b.name === name) || null;
}

module.exports = { findBuyer };
