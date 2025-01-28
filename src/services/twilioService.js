const twilio = require('twilio');
const config = require('../config/config');

class TwilioService {
  constructor() {
    this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
  }

  async sendMessage(to, body) {
    try {
      await this.client.messages.create({
        body,
        from: config.twilio.whatsappNumber,
        to
      });
      return true;
    } catch (error) {
      console.error('Error sending message via Twilio:', error.message);
      return false;
    }
  }
}

module.exports = TwilioService;