// Single source of truth for which tool slugs exist and who can open them.
// A buyer's `products` field is either the string 'bundle' (full access)
// or an array of slugs from TOOL_SLUGS.

const BUNDLE = 'bundle';

const TOOL_SLUGS = ['dsat-scrubber', 'roadmap-creator', 'ramp-up-planner', 'ybr-studio', 'ai-quiz-portal'];

function hasAccess(buyer, slug) {
  if (!buyer) return false;
  if (buyer.products === BUNDLE) return true;
  if (Array.isArray(buyer.products)) return buyer.products.includes(slug);
  return false;
}

module.exports = { hasAccess, BUNDLE, TOOL_SLUGS };
