const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');

dotenv.config({ override: true });

const mongoUri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB_NAME || 'packing-list-app';
// Confirmed live (2026-09-18) against the real cluster in Atlas — this is
// the actual collection the deployed app reads and writes.
const collectionName = process.env.MONGODB_COLLECTION || 'List';

if (!mongoUri) {
  console.error('Missing MONGODB_URI. Set it in .env or as an environment variable.');
  process.exit(1);
}

// A bare `{ ping: 1 }` admin command alone was NOT enough to keep this
// cluster off Atlas's auto-pause list — confirmed live: this workflow ran
// successfully every week, yet Atlas still reported the cluster inactive
// since 2026-08-26. Atlas's inactivity tracking apparently only counts
// real data-plane operations, not administrative pings. `findOne()` reads
// an actual document from the real collection, same as the live app does.
async function keepAlive() {
  const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 15000 });

  try {
    await client.connect();
    const db = client.db(databaseName);
    await db.command({ ping: 1 });
    await db.collection(collectionName).findOne({});
    console.log(`[keep-alive] ${new Date().toISOString()} ping + real read OK (${databaseName}.${collectionName})`);
  } finally {
    await client.close();
  }
}

keepAlive().catch((error) => {
  console.error(`[keep-alive] ping FAILED: ${error.name} - ${error.message}`);
  process.exit(1);
});
