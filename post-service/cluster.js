const cluster = require('node:cluster');
const numOfWorkers = Number(process.env.WEB_CONCURRENCY || 1);

if (!Number.isSafeInteger(numOfWorkers) || numOfWorkers < 1) {
  throw new Error('WEB_CONCURRENCY must be a positive integer');
}

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  for (let i = 0; i < numOfWorkers; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.error(
      `Worker ${worker.process.pid} exited (code: ${code}, signal: ${signal}); stopping container`,
    );
    process.exit(1);
  });
} else {
  require('./app');
  console.log(`Worker ${process.pid} started`);
}
