const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config/config');
const DatabaseService = require('./services/databaseService');
const ContactService = require('./services/contactService');
const TwilioService = require('./services/twilioService');
const GoogleContactsService = require('./services/googleContactsService');
const createWhatsappRoutes = require('./routes/whatsappRoutes');
const createSyncRoutes = require('./routes/syncRoutes');
const createAuthRoutes = require('./routes/authRoutes');
const { SlackService } = require('./services/slackService');
const createSlackRoutes = require('./routes/slackRoutes');
const errorHandler = require('./middleware/errorHandler');
const createHealthRoutes = require('./routes/healthRoutes');
const cors = require('cors');

function createApp() {
  const app = express();
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(cors());

  const databaseService = new DatabaseService();
  const contactService = new ContactService(databaseService);
  const twilioService = new TwilioService();
  const googleContactsService = new GoogleContactsService(databaseService);


  app.use('/whatsapp', createWhatsappRoutes(contactService, twilioService, googleContactsService));
  app.use('/sync', createSyncRoutes(googleContactsService));
  app.use('/', createAuthRoutes(googleContactsService));
  app.use('/slack', createSlackRoutes(SlackService));
  app.use('/', createHealthRoutes());
  app.use(errorHandler);
  return app;
}



module.exports = createApp;