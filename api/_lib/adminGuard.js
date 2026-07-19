const { getAdminSessionFromRequest } = require('./auth');
const { findAdmin } = require('./admins');

// Checks the admin session cookie + role + that the admin still exists.
// Returns the admin record if access is granted; otherwise sends the
// redirect itself and returns null (caller must return immediately).
function requireAdminSession(req, res) {
  const session = getAdminSessionFromRequest(req);
  if (!session) {
    res.writeHead(302, { Location: '/admin-login' });
    res.end();
    return null;
  }

  const admin = findAdmin(session.name);
  if (!admin) {
    res.writeHead(302, { Location: '/admin-login' });
    res.end();
    return null;
  }

  return admin;
}

module.exports = { requireAdminSession };
