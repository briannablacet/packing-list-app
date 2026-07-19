const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');

dotenv.config({ override: true });

const mongoUri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB_NAME || 'packing-list-app';

if (!mongoUri) {
  console.error('Missing MONGODB_URI. Set it in .env or as an environment variable.');
  process.exit(1);
}

async function keepAlive() {
  const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 15000 });

  try {
    await client.connect();
    await client.db(databaseName).command({ ping: 1 });
    console.log(`[keep-alive] ${new Date().toISOString()} ping OK (${databaseName})`);
  } finally {
    await client.close();
  }
}

keepAlive().catch((error) => {
  console.error(`[keep-alive] ping FAILED: ${error.name} - ${error.message}`);
  process.exit(1);
});
