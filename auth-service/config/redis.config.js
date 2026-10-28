const { createClient } = require('redis');

let client;
let connectionPromise;

const redisClientConnection = (logger) => {
  if (!connectionPromise) {
    client = createClient(
      process.env.REDIS_URL ? { url: process.env.REDIS_URL } : {},
    );
    client.on('error', (error) => {
      logger?.error({ err: error }, 'Redis client error');
    });

    const connectingClient = client;
    connectionPromise = connectingClient.connect().catch((error) => {
      if (client === connectingClient) {
        client = undefined;
        connectionPromise = undefined;
      }

      const redisConnectError = new Error('Connection to Redis failed', {
        cause: error,
      });
      redisConnectError.statusCode = 500;
      throw redisConnectError;
    });
  }

  return connectionPromise;
};

redisClientConnection.close = async () => {
  if (client?.isOpen) {
    await client.quit();
  }
  client = undefined;
  connectionPromise = undefined;
};

module.exports = redisClientConnection;
