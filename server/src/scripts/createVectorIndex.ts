import mongoose from 'mongoose';
import { env } from '../config/env.js';

// One-time setup: creates the Atlas Vector Search index backing $vectorSearch
// queries over ContentChunk.embedding. Run with `npm run db:setup-index`
// AFTER settling on EMBEDDING_MODEL/EMBEDDING_DIMENSIONS — the dimension
// count is baked into the index at creation and changing it later requires
// dropping and recreating the index plus re-embedding every existing chunk.
async function main() {
  await mongoose.connect(env.MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database connection not established');

  // Atlas can't attach a search index to a collection that doesn't exist yet,
  // and this runs before any chunk has ever been inserted.
  await db.createCollection('contentchunks').catch((err: any) => {
    if (err?.codeName !== 'NamespaceExists') throw err;
  });

  const collection = db.collection('contentchunks');

  const existing = await collection.listSearchIndexes(env.VECTOR_INDEX_NAME).toArray().catch(() => [] as any[]);
  if (existing.length > 0) {
    console.log(`Index "${env.VECTOR_INDEX_NAME}" already exists (status: ${(existing[0] as any).status}). Nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  console.log(`Creating Atlas Vector Search index "${env.VECTOR_INDEX_NAME}" (${env.EMBEDDING_DIMENSIONS} dims, cosine)...`);

  await collection.createSearchIndex({
    name: env.VECTOR_INDEX_NAME,
    type: 'vectorSearch',
    definition: {
      fields: [
        {
          type: 'vector',
          path: 'embedding',
          numDimensions: env.EMBEDDING_DIMENSIONS,
          similarity: 'cosine',
        },
        { type: 'filter', path: 'projectId' },
        { type: 'filter', path: 'userId' },
      ],
    },
  });

  console.log('Index creation submitted. Polling until queryable (this can take a minute)...');

  for (let attempt = 0; attempt < 60; attempt++) {
    const indexes = (await collection.listSearchIndexes(env.VECTOR_INDEX_NAME).toArray()) as any[];
    const status = indexes[0]?.status;
    const queryable = indexes[0]?.queryable;
    console.log(`  status=${status} queryable=${queryable}`);
    if (queryable) {
      console.log('Vector index is ready.');
      await mongoose.disconnect();
      return;
    }
    await new Promise((r) => setTimeout(r, 5000));
  }

  console.warn('Timed out waiting for the index to become queryable. Check the Atlas UI — it may still be building.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Failed to create vector index:', err);
  process.exit(1);
});
