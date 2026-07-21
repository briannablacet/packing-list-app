const dotenv = require('dotenv');
const { MongoClient, ObjectId } = require('mongodb');

// Don't override platform env (Vercel) with a local .env file.
dotenv.config({ override: !process.env.VERCEL });

const mongoUri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB_NAME || 'packing-list-app';
const collectionName = process.env.MONGODB_COLLECTION || 'packing_items';

if (!mongoUri) {
  throw new Error('Missing MONGODB_URI. Add it to your local .env file.');
}

function getClientPromise() {
  if (!global.__packingListMongoClientPromise) {
    const client = new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxIdleTimeMS: 10000,
      maxPoolSize: 5,
    });

    // If connect fails (common on cold start), clear the cache so the next
    // request can retry instead of reusing a rejected promise forever.
    global.__packingListMongoClientPromise = client.connect().catch((error) => {
      global.__packingListMongoClientPromise = undefined;
      throw error;
    });
  }

  return global.__packingListMongoClientPromise;
}

function normalizeFlag(value) {
  return String(value || '')
    .trim()
    .toUpperCase() === 'YES'
    ? 'YES'
    : 'NO';
}

function normalizeItem(document) {
  return {
    id: document._id.toString(),
    bring_flag: normalizeFlag(document.bring_flag),
    packed_flag: normalizeFlag(document.packed_flag),
    items_to_pack: document.items_to_pack || '',
    category: document.category || 'Other',
    notes: document.notes || '',
  };
}

function sanitizeItem(payload = {}) {
  return {
    bring_flag: normalizeFlag(payload.bring_flag),
    packed_flag: normalizeFlag(payload.packed_flag),
    items_to_pack: (payload.items_to_pack || '').trim(),
    category: (payload.category || 'Other').trim() || 'Other',
    notes: (payload.notes || '').trim(),
  };
}

async function getCollection() {
  const client = await getClientPromise();
  return client.db(databaseName).collection(collectionName);
}

async function listItems() {
  const items = await (await getCollection())
    .find({})
    .sort({ category: 1, items_to_pack: 1 })
    .toArray();

  return items.map(normalizeItem);
}

async function createItem(payload) {
  const item = sanitizeItem(payload);

  if (!item.items_to_pack) {
    const error = new Error('Item name is required.');
    error.statusCode = 400;
    throw error;
  }

  const collection = await getCollection();
  const result = await collection.insertOne(item);
  const savedItem = await collection.findOne({ _id: result.insertedId });
  return normalizeItem(savedItem);
}

async function bulkCreateItems(items) {
  const sanitizedItems = (Array.isArray(items) ? items : [])
    .map(sanitizeItem)
    .filter((item) => item.items_to_pack);

  if (sanitizedItems.length === 0) {
    const error = new Error('No valid items were provided.');
    error.statusCode = 400;
    throw error;
  }

  const collection = await getCollection();
  const result = await collection.insertMany(sanitizedItems);
  const insertedIds = Object.values(result.insertedIds);
  const savedItems = await collection
    .find({ _id: { $in: insertedIds } })
    .sort({ category: 1, items_to_pack: 1 })
    .toArray();

  return savedItems.map(normalizeItem);
}

async function updateItem(itemId, payload) {
  if (!ObjectId.isValid(itemId)) {
    const error = new Error('Invalid item id.');
    error.statusCode = 400;
    throw error;
  }

  const updates = sanitizeItem(payload);

  if (!updates.items_to_pack) {
    const error = new Error('Item name is required.');
    error.statusCode = 400;
    throw error;
  }

  const result = await (await getCollection()).findOneAndUpdate(
    { _id: new ObjectId(itemId) },
    { $set: updates },
    { returnDocument: 'after' }
  );

  if (!result) {
    const error = new Error('Item not found.');
    error.statusCode = 404;
    throw error;
  }

  return normalizeItem(result);
}

async function deleteItem(itemId) {
  if (!ObjectId.isValid(itemId)) {
    const error = new Error('Invalid item id.');
    error.statusCode = 400;
    throw error;
  }

  const result = await (await getCollection()).deleteOne({ _id: new ObjectId(itemId) });

  if (result.deletedCount === 0) {
    const error = new Error('Item not found.');
    error.statusCode = 404;
    throw error;
  }
}

async function clearItems() {
  await (await getCollection()).deleteMany({});
}

module.exports = {
  bulkCreateItems,
  clearItems,
  createItem,
  deleteItem,
  listItems,
  updateItem,
};
