// Vercel's serverless functions have a read-only filesystem in production,
// so the admin panel can't just write api/_data/buyers.json directly and
// have it stick. Instead it commits the change to GitHub via the Contents
// API; since this project's Vercel project is connected to that repo, the
// commit triggers a normal auto-deploy (~15-20s) and the change goes live.

const REPO_OWNER = 'onlyforaiusage81-cmyk';
const REPO_NAME = 'nexus-hubai';
const BRANCH = 'master';
const BUYERS_PATH = 'api/_data/buyers.json';

function getToken() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN environment variable is not set');
  return token;
}

async function githubRequest(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options && options.headers),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GitHub API ${res.status} ${res.statusText}: ${body}`);
  }
  return res.json();
}

async function readBuyersFile() {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${BUYERS_PATH}?ref=${BRANCH}`;
  const data = await githubRequest(url);
  const content = Buffer.from(data.content, 'base64').toString('utf8');
  return { buyers: JSON.parse(content), sha: data.sha };
}

async function writeBuyersFile(buyers, sha, message) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${BUYERS_PATH}`;
  const content = Buffer.from(JSON.stringify(buyers, null, 2) + '\n', 'utf8').toString('base64');
  await githubRequest(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content, sha, branch: BRANCH }),
  });
}

module.exports = { readBuyersFile, writeBuyersFile };
