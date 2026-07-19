const fs = require('fs');
const path = require('path');
const { getSessionFromRequest } = require('../_lib/auth');

module.exports = function handler(req, res) {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.writeHead(302, { Location: '/login' });
    res.end();
    return;
  }

  const filePath = path.join(__dirname, '..', '_tools', 'ybr-studio.html');
  const html = fs.readFileSync(filePath, 'utf8');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(html);
};
