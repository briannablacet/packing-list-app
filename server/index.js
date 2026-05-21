const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const {
  bulkCreateItems,
  clearItems,
  createItem,
  deleteItem,
  listItems,
  updateItem,
} = require('./items-service');

dotenv.config({ override: true });

const app = express();
const port = process.env.PORT || process.env.API_PORT || 4000;
const buildPath = path.join(__dirname, '..', 'build');
const indexHtmlPath = path.join(buildPath, 'index.html');

app.use(cors());
app.use(express.json());

app.get('/api/health', async (_request, response) => {
  response.json({ ok: true });
});

app.get('/api/items', async (_request, response, next) => {
  try {
    response.json(await listItems());
  } catch (error) {
    next(error);
  }
});

app.post('/api/items', async (request, response, next) => {
  try {
    response.status(201).json(await createItem(request.body));
  } catch (error) {
    next(error);
  }
});

app.post('/api/items/bulk', async (request, response, next) => {
  try {
    response.status(201).json(await bulkCreateItems(request.body?.items));
  } catch (error) {
    next(error);
  }
});

app.patch('/api/items/:id', async (request, response, next) => {
  try {
    response.json(await updateItem(request.params.id, request.body));
  } catch (error) {
    next(error);
  }
});

app.delete('/api/items/:id', async (request, response, next) => {
  try {
    await deleteItem(request.params.id);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.delete('/api/items', async (_request, response, next) => {
  try {
    await clearItems();
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

if (fs.existsSync(indexHtmlPath)) {
  app.use(express.static(buildPath));

  app.get(/^(?!\/api).*/, (_request, response) => {
    response.sendFile(indexHtmlPath);
  });
}

app.use((error, _request, response, _next) => {
  console.error(error);
  response
    .status(error.statusCode || 500)
    .json({ error: error.message || 'Server error while talking to MongoDB.' });
});

async function startServer() {
  app.listen(port, () => {
    console.log(`MongoDB API listening on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
