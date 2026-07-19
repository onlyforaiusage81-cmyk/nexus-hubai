const { getSessionFromRequest } = require('./_lib/auth');

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const TOOLS = [
  {
    name: 'DSAT Scrubber',
    desc: 'Cleans and structures raw DSAT survey exports into ready-to-review data.',
    href: 'https://dsat-scrubber.vercel.app/',
    live: true,
  },
  {
    name: 'Roadmap Creator',
    desc: 'Turns operational inputs into a ranked, presentation-ready roadmap.',
    href: null,
    live: false,
  },
  {
    name: 'Ramp-up Planner',
    desc: 'Builds a structured ramp plan for new hires from your training inputs.',
    href: null,
    live: false,
  },
];

function renderToolCard(tool) {
  if (tool.live) {
    return `<a class="tool-card" href="${escapeHtml(tool.href)}" target="_blank" rel="noopener">
      <span class="tool-status live">Live</span>
      <h3>${escapeHtml(tool.name)}</h3>
      <p>${escapeHtml(tool.desc)}</p>
      <span class="tool-cta">Open tool &rarr;</span>
    </a>`;
  }
  return `<div class="tool-card is-disabled">
    <span class="tool-status soon">Coming soon</span>
    <h3>${escapeHtml(tool.name)}</h3>
    <p>${escapeHtml(tool.desc)}</p>
  </div>`;
}

function renderPortalHtml(buyerName) {
  const cards = TOOLS.map(renderToolCard).join('');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Portal — Nexus Hub</title><meta name="robots" content="noindex, nofollow">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{
  --canvas:#0b0c0e;--canvas-elevated:#15161a;
  --primary:#da291c;--primary-hot:#ff3b2f;--primary-active:#b01e0a;
  --hairline:#212329;--ink:#f5f5f3;--body:#9da0a6;--muted:#63666d;
  --sans:'Inter',-apple-system,system-ui,sans-serif;
  --disp:'Archivo','Inter',system-ui,sans-serif;
  --mono:'JetBrains Mono','SFMono-Regular',Consolas,monospace;
  --xxxs:4px;--xxs:8px;--xs:16px;--sm:24px;--md:32px;--lg:48px;--xl:64px;--maxw:1280px;
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--canvas);color:var(--body);font-family:var(--sans);font-size:14px;line-height:1.55;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
::selection{background:var(--primary);color:#fff}
:focus-visible{outline:2px solid var(--primary-hot);outline-offset:3px}
.wrap{max-width:var(--maxw);margin:0 auto;padding:0 var(--sm)}

.nav{border-bottom:1px solid var(--hairline)}
.nav-inner{max-width:var(--maxw);margin:0 auto;padding:0 var(--sm);display:flex;align-items:center;justify-content:space-between;height:66px}
.brand{display:flex;align-items:center;gap:11px;font-family:var(--mono);font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--ink)}
.brand .dot{width:8px;height:8px;background:var(--primary);flex:none}
.logout-link{font-family:var(--mono);font-size:11.5px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--body);transition:color .2s}
.logout-link:hover{color:var(--ink)}

.band{padding:var(--xl) 0}
.eyebrow{font-family:var(--mono);font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--ink);display:block;margin-bottom:var(--xs)}
.eyebrow::before{content:"/ ";color:var(--primary);font-weight:700}
h1{font-family:var(--disp);font-size:clamp(28px,4vw,40px);font-weight:640;letter-spacing:-.02em;color:var(--ink);margin-bottom:8px;font-variation-settings:'wdth' 112}
.lead{font-size:15px;line-height:1.6;color:var(--body);margin-bottom:var(--lg);max-width:60ch}

.tool-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--hairline);border:1px solid var(--hairline)}
.tool-card{background:var(--canvas-elevated);padding:var(--md);display:flex;flex-direction:column;gap:10px;transition:background .2s;position:relative}
a.tool-card:hover{background:#1a1b20}
.tool-card.is-disabled{opacity:.55}
.tool-status{font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;padding:3px 8px;border:1px solid var(--hairline);display:inline-block;width:fit-content}
.tool-status.live{color:#22c58b;border-color:rgba(34,197,139,.4)}
.tool-status.soon{color:var(--muted)}
.tool-card h3{font-family:var(--disp);font-size:18px;font-weight:640;color:var(--ink);font-variation-settings:'wdth' 106}
.tool-card p{font-size:13px;line-height:1.6;color:var(--body);flex:1}
.tool-cta{font-family:var(--mono);font-size:11.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--primary-hot)}

@media(max-width:860px){.tool-grid{grid-template-columns:1fr}}

.foot-note{text-align:center;padding:var(--lg) 0;font-family:var(--mono);font-size:11px;color:var(--muted);letter-spacing:.04em;border-top:1px solid var(--hairline)}
</style></head>
<body>
<header class="nav"><div class="nav-inner">
  <span class="brand"><span class="dot"></span>Nexus Hub &middot; Buyer Portal</span>
  <a href="/api/logout" class="logout-link">Log out</a>
</div></header>

<div class="wrap band">
  <span class="eyebrow">Buyer portal</span>
  <h1>Welcome, ${escapeHtml(buyerName)}</h1>
  <p class="lead">Your tools are below. Live tools open in a new tab; the rest are on the way.</p>
  <div class="tool-grid">${cards}</div>
</div>

<p class="foot-note">&copy; 2026 Nexus Hub &middot; An AI Operations Platform</p>
</body></html>`;
}

module.exports = function handler(req, res) {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.writeHead(302, { Location: '/login' });
    res.end();
    return;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(renderPortalHtml(session.name));
};
