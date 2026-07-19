const fs = require('fs');
const path = require('path');
const { requireToolAccess } = require('../_lib/guard');

module.exports = function handler(req, res) {
  if (!requireToolAccess(req, res, 'ybr-studio')) return;

  const filePath = path.join(__dirname, '..', '_tools', 'ybr-studio.html');
  const html = fs.readFileSync(filePath, 'utf8');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(html);
};
