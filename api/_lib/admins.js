// Required (not fs.readFileSync) so Vercel's build-time file tracer bundles
// _data/admins.json into the serverless function output. Only used to
// verify admin login -- once logged in, admin actions read live data from
// GitHub instead (see github.js), since this bundled copy is a snapshot
// from the last deploy and buyer/admin changes commit straight to GitHub.
const admins = require('../_data/admins.json');

function findAdmin(name) {
  if (typeof name !== 'string') return null;
  return admins.find((a) => a.name === name) || null;
}

module.exports = { findAdmin };
