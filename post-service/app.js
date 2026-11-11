const fastify = require('fastify')({
  logger: true,
  pluginTimeout: 60000,
});
const { createReadStream } = require('node:fs');
const { stat } = require('node:fs/promises');
const path = require('node:path');
require('dotenv').config();

const dbConnect = require('./config/db.config');
const authDbConnect = require('./config/auth-db.config');
const redisClientConnection = require('./config/redis.config');
const postRoutes = require('./routes/post.route');
const { startUserCheckClient } = require('./events/user-check.client');

const uploadDirectory = path.join(__dirname, 'uploads-images');
const imageContentTypes = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

let stopUserCheckClient;

fastify.get('/uploads-images/:filename', async (request, reply) => {
  const { filename } = request.params;
  if (path.basename(filename) !== filename) {
    return reply.code(404).send({ message: 'Image not found' });
  }

  const filePath = path.join(uploadDirectory, filename);
  try {
    const fileStats = await stat(filePath);
    if (!fileStats.isFile()) {
      return reply.code(404).send({ message: 'Image not found' });
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      return reply.code(404).send({ message: 'Image not found' });
    }
    throw error;
  }

  return reply
    .type(
      imageContentTypes[path.extname(filename).toLowerCase()] ||
        'application/octet-stream',
    )
    .header('X-Content-Type-Options', 'nosniff')
    .send(createReadStream(filePath));
});

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
      host: '0.0.0.0',
    });
    fastify.log.info(`Post service is running at ${address}`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();
