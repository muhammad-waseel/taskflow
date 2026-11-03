const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.AUTH_RATE_LIMIT = '1000';

const BASE_URI = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017';

async function connect(dbName) {
  const uri = `${BASE_URI.replace(/\/$/, '')}/${dbName}`;
  await mongoose.connect(uri);
}

async function clear() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

async function disconnect() {
  await mongoose.connection.dropDatabase().catch(() => {});
  await mongoose.disconnect();
}

module.exports = { connect, clear, disconnect };
