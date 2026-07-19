const { requireAdminSession } = require('./_lib/adminGuard');
const { readBuyersFile } = require('./_lib/github');
const { TOOL_SLUGS, TOOL_LABELS } = require('./_lib/entitlements');

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Safe to embed in a <script> tag: escapes </script>-breaking sequences.
function toJsonForScript(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function renderAdminHtml(adminName, buyers, errorMessage) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin — Nexus Hub</title><meta name="robots" content="noindex, nofollow">
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
  --xxxs:4px;--xxs:8px;--xs:16px;--sm:24px;--md:32px;--lg:48px;--xl:64px;--maxw:1000px;
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
h1{font-family:var(--disp);font-size:clamp(26px,4vw,36px);font-weight:640;letter-spacing:-.02em;color:var(--ink);margin-bottom:8px;font-variation-settings:'wdth' 112}
h2{font-family:var(--disp);font-size:18px;font-weight:640;color:var(--ink);margin-bottom:var(--sm);font-variation-settings:'wdth' 106}
.lead{font-size:14px;line-height:1.6;color:var(--body);margin-bottom:var(--lg);max-width:60ch}

.panel{background:var(--canvas-elevated);border:1px solid var(--hairline);padding:var(--md);margin-bottom:var(--lg);position:relative}
.panel::before{content:"";position:absolute;top:-1px;left:0;width:64px;height:2px;background:var(--primary)}

.field{display:flex;flex-direction:column;gap:8px;margin-bottom:var(--sm)}
.field label{font-family:var(--mono);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--body)}
.field input{
  background:var(--canvas);border:1px solid var(--hairline);border-radius:0;color:var(--ink);
  font-family:var(--sans);font-size:14px;padding:12px var(--xs);transition:border-color .2s,box-shadow .2s;width:100%;
}
.field input:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px rgba(218,41,28,.15)}

.chk-grid{display:flex;flex-wrap:wrap;gap:10px 20px;margin-bottom:var(--sm)}
.chk{display:flex;align-items:center;gap:7px;font-size:13px;color:var(--body);cursor:pointer}
.chk input{accent-color:var(--primary)}
.chk.bundle{font-weight:600;color:var(--ink);width:100%;padding-bottom:6px;border-bottom:1px solid var(--hairline);margin-bottom:4px}

.btn{
  position:relative;display:inline-flex;align-items:center;justify-content:center;gap:10px;
  font-family:var(--mono);font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
  height:42px;padding:0 var(--sm);border:1px solid transparent;border-radius:0;
  cursor:pointer;transition:background .2s,border-color .2s;white-space:nowrap;color:#fff;background:var(--primary);
}
.btn:hover{background:var(--primary-active)}
.btn:disabled{opacity:.6;cursor:not-allowed}
.btn-sm{
  font-family:var(--mono);font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
  height:32px;padding:0 12px;border:1px solid var(--hairline);background:transparent;color:var(--body);
  cursor:pointer;transition:border-color .2s,color .2s;
}
.btn-sm:hover{color:var(--ink);border-color:var(--body)}
.btn-sm.primary{background:var(--primary);color:#fff;border-color:var(--primary)}
.btn-sm.primary:hover{background:var(--primary-active)}
.btn-sm.danger{color:#ff6b5c;border-color:rgba(255,107,92,.4)}
.btn-sm.danger:hover{background:rgba(255,107,92,.1)}

.admin-table{width:100%;border-collapse:collapse;font-size:13px}
.admin-table th{text-align:left;font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);padding:10px 8px;border-bottom:1px solid var(--hairline)}
.admin-table td{padding:12px 8px;border-bottom:1px solid var(--hairline);color:var(--body);vertical-align:top}
.admin-table tr:last-child td{border-bottom:none}
.plan-badge{font-family:var(--mono);font-size:10.5px;color:var(--ink)}
.edit-panel{background:var(--canvas);border:1px solid var(--hairline);padding:var(--sm);display:flex;flex-direction:column;gap:var(--sm)}
.edit-block strong{display:block;font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--body);margin-bottom:10px}
.edit-block{display:flex;flex-direction:column;gap:10px}
.edit-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.muted{color:var(--muted);font-size:13px}

.status-banner{display:none;font-family:var(--mono);font-size:12px;padding:12px 16px;margin-bottom:var(--sm)}
.status-banner.show{display:block}
.status-banner.ok{color:#22c58b;background:rgba(34,197,139,.1);border:1px solid rgba(34,197,139,.35)}
.status-banner.err{color:var(--primary-hot);background:rgba(218,41,28,.1);border:1px solid rgba(218,41,28,.35)}

.foot-note{text-align:center;padding:var(--lg) 0;font-family:var(--mono);font-size:11px;color:var(--muted);letter-spacing:.04em;border-top:1px solid var(--hairline)}
</style></head>
<body>
<header class="nav"><div class="nav-inner">
  <span class="brand"><span class="dot"></span>Nexus Hub &middot; Admin</span>
  <a href="/api/admin-logout" class="logout-link">Log out</a>
</div></header>

<div class="wrap band">
  <span class="eyebrow">Admin panel</span>
  <h1>Welcome, ${escapeHtml(adminName)}</h1>
  <p class="lead">Create buyer logins and control which tools each one can open. Changes commit to GitHub and go live in about 15&ndash;20 seconds.</p>

  ${errorMessage ? `<div class="status-banner err show">${escapeHtml(errorMessage)}</div>` : ''}
  <div class="status-banner" id="status-banner"></div>

  <div class="panel">
    <h2>Add new buyer</h2>
    <form id="create-form" novalidate>
      <div class="field"><label for="new-name">Name</label><input id="new-name" type="text" required autocomplete="off"></div>
      <div class="field"><label for="new-password">Password</label><input id="new-password" type="password" required autocomplete="new-password"></div>
      <label class="field"><span>Plan</span></label>
      <div class="chk-grid" id="create-checkboxes"></div>
      <button class="btn" type="submit" id="create-btn">Create buyer</button>
    </form>
  </div>

  <div class="panel">
    <h2>Existing buyers</h2>
    <div id="buyers-table-container"></div>
  </div>
</div>

<p class="foot-note">&copy; 2026 Nexus Hub &middot; An AI Operations Platform</p>

<script>
window.__TOOL_SLUGS__ = ${toJsonForScript(TOOL_SLUGS)};
window.__TOOL_LABELS__ = ${toJsonForScript(TOOL_LABELS)};
window.__BUYERS__ = ${toJsonForScript(buyers)};
</script>
<script>
(function(){
  var SLUGS = window.__TOOL_SLUGS__;
  var LABELS = window.__TOOL_LABELS__;
  var banner = document.getElementById('status-banner');

  function escapeHtml(str){
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function showStatus(message, ok){
    banner.textContent = message;
    banner.className = 'status-banner show ' + (ok ? 'ok' : 'err');
  }

  function planLabel(products){
    if (products === 'bundle') return 'Bundle (all tools)';
    if (Array.isArray(products) && products.length) return products.map(function(s){ return LABELS[s] || s; }).join(', ');
    return 'None';
  }

  function checkboxGroup(idPrefix, products){
    var bundleChecked = products === 'bundle';
    var html = '<label class="chk bundle"><input type="checkbox" class="bundle-toggle" id="'+idPrefix+'-bundle" '+(bundleChecked?'checked':'')+'> Bundle (all tools)</label>';
    html += SLUGS.map(function(slug){
      var checked = bundleChecked || (Array.isArray(products) && products.indexOf(slug) !== -1);
      return '<label class="chk"><input type="checkbox" class="slug-toggle" data-slug="'+slug+'" '+(checked?'checked':'')+' '+(bundleChecked?'disabled':'')+'> '+escapeHtml(LABELS[slug]||slug)+'</label>';
    }).join('');
    return html;
  }

  function wireBundleToggle(container){
    var bundleBox = container.querySelector('.bundle-toggle');
    var slugBoxes = container.querySelectorAll('.slug-toggle');
    bundleBox.addEventListener('change', function(){
      slugBoxes.forEach(function(b){ b.disabled = bundleBox.checked; });
    });
  }

  function collectProducts(container){
    var bundleBox = container.querySelector('.bundle-toggle');
    if (bundleBox.checked) return 'bundle';
    var slugBoxes = container.querySelectorAll('.slug-toggle');
    var products = [];
    slugBoxes.forEach(function(b){ if (b.checked) products.push(b.dataset.slug); });
    return products;
  }

  // ---- create-buyer form ----
  var createCheckboxes = document.getElementById('create-checkboxes');
  createCheckboxes.innerHTML = checkboxGroup('create', []);
  wireBundleToggle(createCheckboxes);

  document.getElementById('create-form').addEventListener('submit', function(e){
    e.preventDefault();
    var name = document.getElementById('new-name').value.trim();
    var password = document.getElementById('new-password').value;
    var products = collectProducts(createCheckboxes);
    var btn = document.getElementById('create-btn');
    if (!name || !password) { showStatus('Name and password are required.', false); return; }
    btn.disabled = true; btn.textContent = 'Creating…';
    fetch('/api/admin-actions/create-buyer', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name: name, password: password, products: products })
    }).then(function(r){ return r.json().then(function(data){ return {status:r.status, data:data}; }); })
      .then(function(res){
        btn.disabled = false; btn.textContent = 'Create buyer';
        if (res.data && res.data.ok) {
          document.getElementById('new-name').value = '';
          document.getElementById('new-password').value = '';
          renderTable(res.data.buyers);
          showStatus('Buyer "'+name+'" created. Live in ~15-20s.', true);
        } else {
          showStatus((res.data && res.data.error) || 'Failed to create buyer.', false);
        }
      }).catch(function(){
        btn.disabled = false; btn.textContent = 'Create buyer';
        showStatus('Network error. Please try again.', false);
      });
  });

  // ---- buyers table ----
  var tableContainer = document.getElementById('buyers-table-container');

  function renderTable(buyers){
    window.__BUYERS__ = buyers;
    if (!buyers.length) {
      tableContainer.innerHTML = '<p class="muted">No buyers yet. Add one above.</p>';
      return;
    }
    var rows = buyers.map(function(b, i){
      return ''
        + '<tr>'
        + '<td>'+escapeHtml(b.name)+'</td>'
        + '<td><span class="plan-badge">'+escapeHtml(planLabel(b.products))+'</span></td>'
        + '<td><button class="btn-sm" data-action="toggle" data-index="'+i+'">Manage</button></td>'
        + '</tr>'
        + '<tr class="edit-row" id="edit-row-'+i+'" style="display:none"><td colspan="3">'
        +   '<div class="edit-panel">'
        +     '<div class="edit-block"><strong>Plan</strong><div class="chk-grid" id="edit-checkboxes-'+i+'"></div>'
        +       '<div class="edit-actions"><button class="btn-sm primary" data-action="save-plan" data-index="'+i+'">Save plan</button></div></div>'
        +     '<div class="edit-block"><strong>Reset password</strong><div class="edit-actions">'
        +       '<input type="password" class="field-input" id="new-pw-'+i+'" placeholder="New password" style="background:var(--canvas-elevated);border:1px solid var(--hairline);color:var(--ink);padding:8px 10px;font-family:var(--sans);font-size:13px;flex:1;min-width:160px">'
        +       '<button class="btn-sm" data-action="reset-password" data-index="'+i+'">Reset password</button></div></div>'
        +     '<div class="edit-block"><strong>Danger zone</strong><div class="edit-actions"><button class="btn-sm danger" data-action="delete" data-index="'+i+'">Delete buyer</button></div></div>'
        +   '</div>'
        + '</td></tr>';
    }).join('');
    tableContainer.innerHTML = '<table class="admin-table"><thead><tr><th>Name</th><th>Plan</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>';

    buyers.forEach(function(b, i){
      var el = document.getElementById('edit-checkboxes-'+i);
      el.innerHTML = checkboxGroup('edit-'+i, b.products);
      wireBundleToggle(el);
    });
  }

  tableContainer.addEventListener('click', function(e){
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var index = Number(btn.dataset.index);
    var buyer = window.__BUYERS__[index];
    var action = btn.dataset.action;

    if (action === 'toggle') {
      var row = document.getElementById('edit-row-'+index);
      row.style.display = row.style.display === 'none' ? '' : 'none';
      return;
    }

    if (action === 'save-plan') {
      var container = document.getElementById('edit-checkboxes-'+index);
      var products = collectProducts(container);
      btn.disabled = true; btn.textContent = 'Saving…';
      fetch('/api/admin-actions/update-products', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ name: buyer.name, products: products })
      }).then(function(r){ return r.json().then(function(data){ return {status:r.status, data:data}; }); })
        .then(function(res){
          btn.disabled = false; btn.textContent = 'Save plan';
          if (res.data && res.data.ok) { renderTable(res.data.buyers); showStatus('Plan updated for "'+buyer.name+'". Live in ~15-20s.', true); }
          else { showStatus((res.data && res.data.error) || 'Failed to update plan.', false); }
        }).catch(function(){ btn.disabled = false; btn.textContent = 'Save plan'; showStatus('Network error. Please try again.', false); });
      return;
    }

    if (action === 'reset-password') {
      var pwInput = document.getElementById('new-pw-'+index);
      var newPassword = pwInput.value;
      if (!newPassword) { showStatus('Enter a new password first.', false); return; }
      btn.disabled = true; btn.textContent = 'Saving…';
      fetch('/api/admin-actions/reset-password', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ name: buyer.name, password: newPassword })
      }).then(function(r){ return r.json().then(function(data){ return {status:r.status, data:data}; }); })
        .then(function(res){
          btn.disabled = false; btn.textContent = 'Reset password';
          if (res.data && res.data.ok) { pwInput.value = ''; renderTable(res.data.buyers); showStatus('Password reset for "'+buyer.name+'". Live in ~15-20s.', true); }
          else { showStatus((res.data && res.data.error) || 'Failed to reset password.', false); }
        }).catch(function(){ btn.disabled = false; btn.textContent = 'Reset password'; showStatus('Network error. Please try again.', false); });
      return;
    }

    if (action === 'delete') {
      if (!window.confirm('Delete buyer "'+buyer.name+'"? This revokes their access immediately once deployed.')) return;
      btn.disabled = true; btn.textContent = 'Deleting…';
      fetch('/api/admin-actions/delete-buyer', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ name: buyer.name })
      }).then(function(r){ return r.json().then(function(data){ return {status:r.status, data:data}; }); })
        .then(function(res){
          if (res.data && res.data.ok) { renderTable(res.data.buyers); showStatus('Buyer "'+buyer.name+'" deleted.', true); }
          else { btn.disabled = false; btn.textContent = 'Delete buyer'; showStatus((res.data && res.data.error) || 'Failed to delete buyer.', false); }
        }).catch(function(){ btn.disabled = false; btn.textContent = 'Delete buyer'; showStatus('Network error. Please try again.', false); });
      return;
    }
  });

  renderTable(window.__BUYERS__);
})();
</script>
</body></html>`;
}

module.exports = async function handler(req, res) {
  const admin = requireAdminSession(req, res);
  if (!admin) return;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  try {
    const { buyers } = await readBuyersFile();
    const scrubbed = buyers.map((b) => ({ name: b.name, products: b.products || [] }));
    res.status(200).send(renderAdminHtml(admin.name, scrubbed, null));
  } catch (err) {
    res.status(200).send(renderAdminHtml(admin.name, [], `Could not load buyer data from GitHub: ${err.message}`));
  }
};
