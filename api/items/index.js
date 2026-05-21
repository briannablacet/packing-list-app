const {
  clearItems,
  createItem,
  listItems,
} = require('../../server/items-service');

module.exports = async function handler(request, response) {
  try {
    if (request.method === 'GET') {
      return response.status(200).json(await listItems());
    }

    if (request.method === 'POST') {
      return response.status(201).json(await createItem(request.body));
    }

    if (request.method === 'DELETE') {
      await clearItems();
      return response.status(204).end();
    }

    return response.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    console.error(error);
    return response
      .status(error.statusCode || 500)
      .json({ error: error.message || 'Server error while talking to MongoDB.' });
  }
};
