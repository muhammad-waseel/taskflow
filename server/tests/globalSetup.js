// Starts one in-memory MongoDB for the whole test run unless MONGO_URI_TEST is provided.
module.exports = async () => {
  if (process.env.MONGO_URI_TEST) return;
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const server = await MongoMemoryServer.create({ binary: { version: process.env.MONGOMS_VERSION || '8.0.4' } });
  globalThis.__MONGO_SERVER__ = server;
  process.env.MONGO_URI_TEST = server.getUri().replace(/\/$/, '');
};
