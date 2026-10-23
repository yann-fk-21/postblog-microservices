require('dotenv').config();

const { kafka } = require('./kafka.config');

const admin = kafka.admin();

const TOPICS = [
  'user.check.request',
  'user.check.response',
  'auth.user.login.request',
  'auth.user.login.response',
];

async function main() {
  await admin.connect();

  await admin.createTopics({
    topics: TOPICS.map((topic) => ({
      topic,
      numPartitions: 1,
      replicationFactor: 1,
    })),
  });

  console.log(`Topics are ready: ${TOPICS.join(', ')}`);
  await admin.disconnect();
}

main().catch(async (error) => {
  console.error('Kafka topic creation failed', error);
  await admin.disconnect().catch((disconnectError) => {
    console.error('Kafka admin disconnect failed', disconnectError);
  });
  process.exit(1);
});
