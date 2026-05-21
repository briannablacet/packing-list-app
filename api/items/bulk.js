const { bulkCreateItems } = require('../../server/items-service');

module.exports = async function handler(request, response) {
  try {
    if (request.method !== 'POST') {
      return response.status(405).json({ error: 'Method not allowed.' });
    }

    return response.status(201).json(await bulkCreateItems(request.body?.items));
  } catch (error) {
    console.error(error);
    return response
      .status(error.statusCode || 500)
      .json({ error: error.message || 'Server error while talking to MongoDB.' });
  }
};
