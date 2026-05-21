# Packing List App

This app now uses a local Node/Express API to talk to MongoDB instead of Supabase.

## Local setup

1. Create a `.env` file in the project root.
2. Copy the values from `.env.example`.
3. Paste your real MongoDB connection string into `MONGODB_URI`.

Example:

```env
MONGODB_URI=your-real-mongodb-connection-string
MONGODB_DB_NAME=packing-list-app
MONGODB_COLLECTION=packing_items
API_PORT=4000
```

## Run the app

Use the combined dev script to start both the React app and the MongoDB API:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Available scripts

- `npm run dev`: starts the API server and the React app together
- `npm run server`: starts just the MongoDB API on port `4000`
- `npm start`: starts just the React app on port `3000`
- `npm test`: runs the test suite
- `npm run build`: builds the frontend for production

## API routes

The local server exposes these routes:

- `GET /api/items`
- `POST /api/items`
- `POST /api/items/bulk`
- `PATCH /api/items/:id`
- `DELETE /api/items/:id`
- `DELETE /api/items`
