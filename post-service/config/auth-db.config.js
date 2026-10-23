const fastifyPlugin = require('fastify-plugin');
const { authConnection } = require('../models/auth.model');

const authDbConnect = async (fastify) => {
  const mongoUri = process.env.MONGO_DB_AUTH;

  if (!mongoUri) {
    throw new Error('MONGO_DB_AUTH is not configured');
  }

  await authConnection.openUri(mongoUri);
  fastify.log.info('Connected to MongoDB for auth tokens');

  fastify.addHook('onClose', async () => {
    await authConnection.close();
  });
};

module.exports = fastifyPlugin(authDbConnect);
