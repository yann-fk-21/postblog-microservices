const { kafka } = require('../config/kafka-config');

const producer = kafka.producer();

const sendUserEvent = async (user, topic) => {
  await producer.connect();
  console.log('Producer connected to Kafka');
  await producer.send({
    topic: topic,
    messages: [
      {
        key: user.id,
        value: JSON.stringify(user),
      },
    ],
  });
  console.log('User event sent to Kafka');
  await producer.disconnect();
  console.log('Producer disconnected from Kafka');
};

module.exports = { sendUserEvent };
