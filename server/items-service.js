const dotenv = require('dotenv');
const { MongoClient, ObjectId } = require('mongodb');

dotenv.config({ override: true });

const mongoUri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB_NAME || 'packing-list-app';
const collectionName = process.env.MONGODB_COLLECTION || 'packing_items';

if (!mongoUri) {
  throw new Error('Missing MONGODB_URI. Add it to your local .env file.');
}

let clientPromise;

if (global.__packingListMongoClientPromise) {
  clientPromise = global.__packingListMongoClientPromise;
} else {
  const client = new MongoClient(mongoUri);
  clientPromise = client.connect();
  global.__packingListMongoClientPromise = clientPromise;
}

function normalizeItem(document) {
  return {
    id: document._id.toString(),
    bring_flag: document.bring_flag || 'NO',
    packed_flag: document.packed_flag || 'NO',
    items_to_pack: document.items_to_pack || '',
    category: document.category || 'Other',
    notes: document.notes || '',
  };
}

function sanitizeItem(payload = {}) {
  return {
    bring_flag: payload.bring_flag === 'YES' ? 'YES' : 'NO',
    packed_flag: payload.packed_flag === 'YES' ? 'YES' : 'NO',
    items_to_pack: (payload.items_to_pack || '').trim(),
    category: (payload.category || 'Other').trim() || 'Other',
    notes: (payload.notes || '').trim(),
  };
}

async function getCollection() {
  const client = await clientPromise;
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
