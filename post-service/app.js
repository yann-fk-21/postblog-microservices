const fastify = require('fastify')({
  logger: true,
});
require('dotenv').config();

const dbConnect = require('./config/db.config');
const postRoutes = require('./routes/post.route');

fastify.register(dbConnect);
fastify.register(require('@fastify/multipart'), {
  limits: {
    files: 1,
    fileSize: 10 * 1024 * 1024,
  },
});
fastify.register(postRoutes);

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
