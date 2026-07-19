const { buildClearCookie } = require('./_lib/auth');

module.exports = function handler(req, res) {
  res.setHeader('Set-Cookie', buildClearCookie());
  res.writeHead(302, { Location: '/login' });
  res.end();
};
