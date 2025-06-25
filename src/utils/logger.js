const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty', // makes it readable in dev
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
    },
  },
});

module.exports = logger;
