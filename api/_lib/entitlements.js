// Single source of truth for which tool slugs exist and who can open them.
// A buyer's `products` field is either the string 'bundle' (full access)
// or an array of slugs from TOOL_SLUGS.

const BUNDLE = 'bundle';

const TOOL_SLUGS = ['dsat-scrubber', 'roadmap-creator', 'ramp-up-planner', 'ybr-studio', 'ai-quiz-portal'];

const TOOL_LABELS = {
  'dsat-scrubber': 'DSAT Scrubber',
  'roadmap-creator': 'Roadmap Creator',
  'ramp-up-planner': 'Ramp-up Planner',
  'ybr-studio': 'YBR Studio',
  'ai-quiz-portal': 'AI Quiz Portal',
};

function hasAccess(buyer, slug) {
  if (!buyer) return false;
  if (buyer.products === BUNDLE) return true;
  if (Array.isArray(buyer.products)) return buyer.products.includes(slug);
  return false;
}

// Validates a `products` value coming from an API request body (the admin
// panel sends either the string 'bundle' or an array of slugs). Returns
// { value, error } -- error is set (and value is null) if the input isn't
// one of those two shapes or contains an unknown slug.
function validateProducts(input) {
  if (input === BUNDLE) return { value: BUNDLE, error: null };
  if (Array.isArray(input)) {
    const unknown = input.filter((s) => !TOOL_SLUGS.includes(s));
    if (unknown.length) return { value: null, error: `Unknown product slug(s): ${unknown.join(', ')}` };
    return { value: input, error: null };
  }
  return { value: null, error: 'products must be "bundle" or an array of tool slugs' };
}

module.exports = { hasAccess, validateProducts, BUNDLE, TOOL_SLUGS, TOOL_LABELS };
