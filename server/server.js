require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5000;
const { MONGO_URI, JWT_SECRET } = process.env;

if (!MONGO_URI || !JWT_SECRET) {
  console.error('Missing required environment variables: MONGO_URI and JWT_SECRET');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI, { dbName: process.env.MONGO_DB_NAME || undefined })
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`TaskFlow running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
