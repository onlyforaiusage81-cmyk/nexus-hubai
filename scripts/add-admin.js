#!/usr/bin/env node
// Adds (or updates) an admin in api/_data/admins.json with a bcrypt-hashed
// password. Admins have full control over buyer credentials via /admin --
// there's no products/entitlements field here, admins aren't gated.
// Usage:
//   node scripts/add-admin.js                  (interactive prompts, password hidden)
//   node scripts/add-admin.js "Name" "password" (non-interactive, for scripting)

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { ask, askHidden } = require('./_prompt');

const ADMINS_PATH = path.join(__dirname, '..', 'api', '_data', 'admins.json');

function loadAdmins() {
  try {
    return JSON.parse(fs.readFileSync(ADMINS_PATH, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function saveAdmins(admins) {
  fs.writeFileSync(ADMINS_PATH, JSON.stringify(admins, null, 2) + '\n');
}

async function main() {
  const [, , argName, argPassword] = process.argv;
  let name = argName;
  let password = argPassword;

  if (!name) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    name = (await ask(rl, 'Admin name: ')).trim();
    rl.close();
  }
  if (!name) {
    console.error('An admin name is required.');
    process.exit(1);
  }

  if (!password) {
    password = await askHidden('Password: ');
  }
  if (!password) {
    console.error('A password is required.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admins = loadAdmins();
  const existingIndex = admins.findIndex((a) => a.name === name);

  if (existingIndex >= 0) {
    admins[existingIndex].passwordHash = passwordHash;
    console.log(`Updated password for existing admin "${name}".`);
  } else {
    admins.push({ name, passwordHash });
    console.log(`Added new admin "${name}".`);
  }

  saveAdmins(admins);
  console.log(`Saved to ${path.relative(process.cwd(), ADMINS_PATH)}`);
  console.log('Remember to commit and push api/_data/admins.json for this to take effect on the live site.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
