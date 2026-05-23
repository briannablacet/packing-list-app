const {
  deleteItem,
  updateItem,
} = require('../server/items-service');

module.exports = async function handler(request, response) {
  const itemId = request.query.id;

  try {
    if (request.method === 'PATCH') {
      return response.status(200).json(await updateItem(itemId, request.body));
    }

    if (request.method === 'DELETE') {
      await deleteItem(itemId);
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
