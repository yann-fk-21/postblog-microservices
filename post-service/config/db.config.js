const fastifyPlugin = require('fastify-plugin');
const mongoose = require('mongoose');

const dbConnect = async (fastify) => {
  const mongoUri = process.env.MONGO_DB_POST;

  if (!mongoUri) {
    throw new Error('MONGO_DB_POST is not configured');
  }

  await mongoose.connect(mongoUri);
  fastify.log.info('Connected to MongoDB for posts');
};

module.exports = fastifyPlugin(dbConnect);
