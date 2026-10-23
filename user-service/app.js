require('dotenv').config();

const fastify = require('fastify');

const app = fastify({
  logger: true,
});

const userRoutes = require('./routes/user.route');
const { squelizeDB } = require('./models/user.model');
const { startUserConsumer } = require('./events/user-consumer');

app.register(userRoutes);

const PORT = 7001;
let stopUserConsumer;

app.addHook('onClose', async () => {
  if (stopUserConsumer) {
    await stopUserConsumer();
  }
  await squelizeDB.close();
});

const start = async () => {
  try {
    await squelizeDB.sync();
    stopUserConsumer = await startUserConsumer();

    const address = await app.listen({
      port: Number(PORT),
    });
    app.log.info(`User service is running at ${address}`);
  } catch (error) {
    app.log.error(error);
    process.exitCode = 1;
  }
};

start();
