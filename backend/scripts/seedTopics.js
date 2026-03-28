/* eslint-disable no-console */
require('dotenv').config();

const connectDB = require('../config/db');
const Topic = require('../models/Topic');
const { searchAndBuild } = require('../services/aggregationService');

function slugify(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  await connectDB();

  const topics = [
    { keyword: 'Russia-Ukraine conflict', category: 'politics' },
    { keyword: 'Silicon Valley Bank collapse', category: 'business' },
    { keyword: 'OpenAI Sam Altman firing', category: 'tech' },
  ];

  for (const t of topics) {
    const slug = slugify(t.keyword);
    await Topic.findOneAndUpdate(
      { slug },
      { $setOnInsert: { keyword: t.keyword, slug, category: t.category } },
      { upsert: true }
    );

    console.log(`Seeding: ${t.keyword}`);
    const payload = await searchAndBuild({
      keyword: t.keyword,
      filters: {
        category: t.category,
        redditLimit: 10,
        newsLimit: 10,
        redditSort: 'relevance',
        newsSort: 'publishedAt',
        redditTime: 'week',
        newsTime: 'week',
        region: null,
      },
    });

    console.log(`Seeded topic: ${payload?.topic?.keyword} (id: ${payload?.topic?.id})`);
  }

  console.log('Done seeding Story DNA.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed script failed:', err.message || err);
  process.exit(1);
});

