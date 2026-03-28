const crypto = require('crypto');

const stableString = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

/**
 * Create a stable content hash for deduplication.
 * Prefer `url` when available; otherwise fall back to title+source+publishedAt.
 */
function hashForArticle(input) {
  const url = stableString(input.url);
  const origin = stableString(input.origin);
  const title = stableString(input.title);
  const source = stableString(input.source);
  const publishedAt = stableString(input.publishedAt);

  const raw =
    origin +
    '|' +
    url +
    '|' +
    title +
    '|' +
    source +
    '|' +
    publishedAt;

  return crypto.createHash('sha256').update(raw).digest('hex');
}

module.exports = { hashForArticle };

