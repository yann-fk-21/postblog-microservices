const fastify = require('fastify')();
require('dotenv').config();
const authRoutes = require('./routes/auth.route');

const dbConnect = require('./config/db.config');
const { startUserAuthClient } = require('./events/user-auth.client');

const PORT = process.env.PORT || 7002;
let stopUserAuthClient;

fastify.register(dbConnect);
fastify.register(authRoutes);

fastify.addHook('onReady', async () => {
  stopUserAuthClient = await startUserAuthClient();
});

fastify.addHook('onClose', async () => {
  if (stopUserAuthClient) {
    await stopUserAuthClient();
  }
});

const start = async () => {
  try {
    const address = await fastify.listen({ port: Number(PORT) });
    fastify.log.info(`Auth service is running at ${address}`);
  } catch (error) {
    fastify.log.error(error);
    process.exitCode = 1;
  }
};

start();
