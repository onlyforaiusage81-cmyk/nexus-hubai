// A single Serverless Function handling every embedded tool (Vercel's
// [param] dynamic-route convention), instead of one function per tool --
// the Hobby plan caps a deployment at 12 functions, and separate files
// would eat that budget fast as more tools get added. New tools only need
// an entry below + an HTML file in api/_tools/, no new function.
const fs = require('fs');
const path = require('path');
const { requireToolAccess } = require('../_lib/guard');

const TOOL_FILES = {
  'roadmap-creator': 'roadmap-creator.html',
  'ramp-up-planner': 'rampup-planner.html',
  'ybr-studio': 'ybr-studio.html',
  'ai-quiz-portal': 'ai-quiz-portal.html',
};

function getSlug(req) {
  if (req.query && req.query.slug) return req.query.slug;
  const pathname = req.url.split('?')[0];
  return pathname.split('/').filter(Boolean).pop();
}

module.exports = function handler(req, res) {
  const slug = getSlug(req);
  const filename = TOOL_FILES[slug];
  if (!filename) {
    res.status(404).send('Not found');
    return;
  }

  if (!requireToolAccess(req, res, slug)) return;

  const filePath = path.join(__dirname, '..', '_tools', filename);
  const html = fs.readFileSync(filePath, 'utf8');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(html);
};
