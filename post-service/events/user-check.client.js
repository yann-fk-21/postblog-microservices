const { randomUUID } = require('node:crypto');
const { kafka } = require('../config/kafka.config');

const REQUEST_TOPIC = 'user.check.request';
const RESPONSE_TOPIC = 'user.check.response';
const pendingRequests = new Map();

const producer = kafka.producer();
const consumer = kafka.consumer({
  groupId: `post-user-check-${randomUUID()}`,
});

const startUserCheckClient = async () => {
  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: RESPONSE_TOPIC, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const response = JSON.parse(message.value.toString());
      const pending = pendingRequests.get(response.correlationId);
      if (!pending) {
        return;
      }

      clearTimeout(pending.timeout);
      pendingRequests.delete(response.correlationId);
      pending.resolve(response.exists === true);
    },
  });

  return async () => {
    await consumer.stop();
    await consumer.disconnect();
    await producer.disconnect();

    for (const pending of pendingRequests.values()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('User check client has been stopped'));
    }
    pendingRequests.clear();
  };
};

const userExists = async (userId) => {
  const correlationId = randomUUID();
  const timeoutMs = Number(process.env.USER_CHECK_TIMEOUT_MS || 5000);

  const responsePromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(correlationId);
      reject(new Error(`Timed out checking user ${userId}`));
    }, timeoutMs);

    pendingRequests.set(correlationId, { resolve, reject, timeout });
  });

  try {
    await producer.send({
      topic: REQUEST_TOPIC,
      messages: [
        {
          key: correlationId,
          value: JSON.stringify({ correlationId, userId }),
        },
      ],
    });
  } catch (error) {
    const pending = pendingRequests.get(correlationId);
    if (pending) {
      clearTimeout(pending.timeout);
      pendingRequests.delete(correlationId);
      pending.reject(error);
    }
  }

  return responsePromise;
};

module.exports = { startUserCheckClient, userExists };
