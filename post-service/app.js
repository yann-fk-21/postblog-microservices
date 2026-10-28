const fastify = require('fastify')({
  logger: true,
});
require('dotenv').config();

const dbConnect = require('./config/db.config');
const authDbConnect = require('./config/auth-db.config');
const redisClientConnection = require('./config/redis.config');
const postRoutes = require('./routes/post.route');
const { startUserCheckClient } = require('./events/user-check.client');

let stopUserCheckClient;

fastify.register(dbConnect);
fastify.register(authDbConnect);
fastify.addHook('onReady', async () => {
  stopUserCheckClient = await startUserCheckClient();
});

fastify.register(require('@fastify/multipart'), {
  limits: {
    files: 1,
    fileSize: 10 * 1024 * 1024,
  },
});

fastify.register(postRoutes);

fastify.addHook('onClose', async () => {
  if (stopUserCheckClient) {
    await stopUserCheckClient();
  }
  await redisClientConnection.close();
});

const start = async () => {
  try {
    const address = await fastify.listen({
      port: Number(process.env.PORT_POST_SERVICE || 7000),
    });
    fastify.log.info(`Post service is running at ${address}`);
  } catch (error) {
    fastify.log.error(error);
    process.exitCode = 1;
  }
};

start();
