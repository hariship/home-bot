const config = require('./config/config');
const createApp = require('./app');

const app = createApp();
app.listen(config.server.port, () => 
  console.log(`Server running on port ${config.server.port}`)
);