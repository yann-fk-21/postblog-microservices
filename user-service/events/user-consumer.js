const { kafka } = require('../config/kafka.config');
const { User } = require('../models/user.model');
const bcrypt = require('bcrypt');

const REQUEST_TOPIC = 'user.check.request';
const RESPONSE_TOPIC = 'user.check.response';
const LOGIN_REQUEST_TOPIC = 'auth.user.login.request';
const LOGIN_RESPONSE_TOPIC = 'auth.user.login.response';

const consumer = kafka.consumer({ groupId: 'user-check-service' });
const producer = kafka.producer();

const startUserConsumer = async () => {
  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({
    topics: [REQUEST_TOPIC, LOGIN_REQUEST_TOPIC],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const request = JSON.parse(message.value.toString());
      if (topic === LOGIN_REQUEST_TOPIC) {
        if (
          !request.correlationId ||
          typeof request.email !== 'string' ||
          typeof request.password !== 'string'
        ) {
          throw new Error('Invalid login request');
        }

        const user = await User.findOne({
          where: { email: request.email },
        });
        const authenticated =
          Boolean(user) && (await bcrypt.compare(request.password, user.password));

        await producer.send({
          topic: LOGIN_RESPONSE_TOPIC,
          messages: [
            {
              key: request.correlationId,
              value: JSON.stringify({
                correlationId: request.correlationId,
                authenticated,
                ...(authenticated ? { userId: user.id } : {}),
              }),
            },
          ],
        });
        return;
      }

      if (
        !request.correlationId ||
        request.userId === undefined ||
        request.userId === null
      ) {
        throw new Error('Invalid user check request');
      }

      const user = await User.findByPk(request.userId);
      await producer.send({
        topic: RESPONSE_TOPIC,
        messages: [
          {
            key: request.correlationId,
            value: JSON.stringify({
              correlationId: request.correlationId,
              exists: Boolean(user),
            }),
          },
        ],
      });
    },
  });

  return async () => {
    await consumer.stop();
    await consumer.disconnect();
    await producer.disconnect();
  };
};

module.exports = { startUserConsumer };
