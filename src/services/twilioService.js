const twilio = require('twilio');
const config = require('../config/config');
const logger = require('./utils/logger');

class TwilioService {
  constructor() {
    this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
  }

  async sendMessage(to, body) {
    try {
      logger.info('Sending message to WhatsApp bot...');
      await this.client.messages.create({
        body,
        from: config.twilio.whatsappNumber,
        to
      });
      return true;
    } catch (error) {
      logger.error('Twilio auth failed', err);
      return false;
    }
  }
}

module.exports = TwilioService;