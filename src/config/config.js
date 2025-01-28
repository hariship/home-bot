require('dotenv').config();

const config = {
  twilio: {
    accountSid: process.env.ACCOUNT_SID,
    authToken: process.env.AUTH_TOKEN,
    whatsappNumber: 'whatsapp:+14155238886'
  },
  server: {
    port: process.env.PORT || 3000
  }
};

module.exports = config;