#!/usr/bin/env node
// Adds (or updates) a buyer in api/_data/buyers.json with a bcrypt-hashed
// password and a list of which tools they're entitled to open.
// Usage:
//   node scripts/add-buyer.js                                  (interactive prompts, password hidden)
//   node scripts/add-buyer.js "Name" "password" "products"     (non-interactive, for scripting)
//     where products is "bundle" or a comma-separated list of slugs,
//     e.g. "dsat-scrubber,ybr-studio"

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { BUNDLE, TOOL_SLUGS } = require('../api/_lib/entitlements');
const { ask, askHidden } = require('./_prompt');

const BUYERS_PATH = path.join(__dirname, '..', 'api', '_data', 'buyers.json');

function formatProducts(products) {
  if (products === BUNDLE) return 'bundle (all tools)';
  if (Array.isArray(products) && products.length) return products.join(', ');
  return 'none';
}

// Returns { products, warning } -- warning is set if the input contained
// slugs that don't match any known tool (likely a typo).
function parseProducts(input) {
  const trimmed = (input || '').trim();
  if (!trimmed) return { products: [], warning: null };
  if (trimmed.toLowerCase() === BUNDLE) return { products: BUNDLE, warning: null };

  const requested = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
  const valid = requested.filter((s) => TOOL_SLUGS.includes(s));
  const invalid = requested.filter((s) => !TOOL_SLUGS.includes(s));
  const warning = invalid.length ? `Ignored unknown product slug(s): ${invalid.join(', ')}` : null;
  return { products: valid, warning };
}

function loadBuyers() {
  try {
    return JSON.parse(fs.readFileSync(BUYERS_PATH, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function saveBuyers(buyers) {
  fs.writeFileSync(BUYERS_PATH, JSON.stringify(buyers, null, 2) + '\n');
}

async function main() {
  const [, , argName, argPassword, argProducts] = process.argv;
  let name = argName;
  let password = argPassword;

  if (!name) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    name = (await ask(rl, 'Buyer name: ')).trim();
    rl.close();
  }
  if (!name) {
    console.error('A buyer name is required.');
    process.exit(1);
  }

  const buyers = loadBuyers();
  const existingIndex = buyers.findIndex((b) => b.name === name);
  const existing = existingIndex >= 0 ? buyers[existingIndex] : null;

  if (!password) {
    password = await askHidden('Password: ');
  }
  if (!password) {
    console.error('A password is required.');
    process.exit(1);
  }

  let products;
  if (argProducts !== undefined) {
    const parsed = parseProducts(argProducts);
    if (parsed.warning) console.warn(parsed.warning);
    products = parsed.products;
  } else {
    console.log(`Available products: ${TOOL_SLUGS.join(', ')}`);
    const hint = existing ? ` [current: ${formatProducts(existing.products)}, Enter to keep]` : ' [Enter for none yet]';
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await ask(rl, `Products (comma-separated, or "bundle" for all)${hint}: `);
    rl.close();
    if (!answer.trim() && existing) {
      products = existing.products || [];
    } else {
      const parsed = parseProducts(answer);
      if (parsed.warning) console.warn(parsed.warning);
      products = parsed.products;
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);

  if (existingIndex >= 0) {
    buyers[existingIndex].passwordHash = passwordHash;
    buyers[existingIndex].products = products;
    console.log(`Updated buyer "${name}". Products: ${formatProducts(products)}`);
  } else {
    buyers.push({ name, passwordHash, products });
    console.log(`Added new buyer "${name}". Products: ${formatProducts(products)}`);
  }

  saveBuyers(buyers);
  console.log(`Saved to ${path.relative(process.cwd(), BUYERS_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
