const { getSessionFromRequest } = require('./auth');
const { findBuyer } = require('./buyers');
const { hasAccess } = require('./entitlements');

// Checks session + buyer existence + per-tool entitlement for a protected
// tool route. Returns the buyer record if access is granted; otherwise
// sends the appropriate redirect itself and returns null (caller must
// return immediately when this returns null).
function requireToolAccess(req, res, slug) {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.writeHead(302, { Location: '/login' });
    res.end();
    return null;
  }

  const buyer = findBuyer(session.name);
  if (!buyer) {
    res.writeHead(302, { Location: '/login' });
    res.end();
    return null;
  }

  if (!hasAccess(buyer, slug)) {
    res.writeHead(302, { Location: '/portal' });
    res.end();
    return null;
  }

  return buyer;
}

module.exports = { requireToolAccess };
