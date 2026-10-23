const { randomUUID } = require('node:crypto');
const { kafka } = require('../config/kafka.config');

const REQUEST_TOPIC = 'auth.user.login.request';
const RESPONSE_TOPIC = 'auth.user.login.response';
const pendingRequests = new Map();

const producer = kafka.producer();
const consumer = kafka.consumer({
  groupId: `auth-user-login-${randomUUID()}`,
});

const startUserAuthClient = async () => {
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
      pending.resolve(
        response.authenticated === true && Number.isInteger(response.userId)
          ? { id: response.userId }
          : null,
      );
    },
  });

  return async () => {
    await consumer.stop();
    await consumer.disconnect();
    await producer.disconnect();

    for (const pending of pendingRequests.values()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('User authentication client has been stopped'));
    }
    pendingRequests.clear();
  };
};

const authenticateUser = async (email, password) => {
  const correlationId = randomUUID();
  const timeoutMs = Number(process.env.USER_AUTH_TIMEOUT_MS || 5000);

  const responsePromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(correlationId);
      reject(new Error('Timed out waiting for user authentication'));
    }, timeoutMs);

    pendingRequests.set(correlationId, { resolve, reject, timeout });
  });

  try {
    await producer.send({
      topic: REQUEST_TOPIC,
      messages: [
        {
          key: correlationId,
          value: JSON.stringify({ correlationId, email, password }),
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

module.exports = { authenticateUser, startUserAuthClient };
