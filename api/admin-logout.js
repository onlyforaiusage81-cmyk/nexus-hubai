const { buildClearCookie, ADMIN_COOKIE_NAME } = require('./_lib/auth');

module.exports = function handler(req, res) {
  res.setHeader('Set-Cookie', buildClearCookie(ADMIN_COOKIE_NAME));
  res.writeHead(302, { Location: '/admin-login' });
  res.end();
};
