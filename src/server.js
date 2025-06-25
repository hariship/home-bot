const config = require('./config/config');
const createApp = require('./app');
const logger = require('./utils/logger')

const app = createApp();
app.listen(config.server.port, () => 
    logger.info(`Server running on port ${config.server.port}`)
);