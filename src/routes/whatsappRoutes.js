const express = require('express');
const { MessagingResponse } = require('twilio').twiml;
const logger = require('../utils/logger');
const router = express.Router();
const {ALLOWED_SENDERS} = require('../utils/constants');

function createWhatsappRoutes(contactService, twilioService, googleContactsService) {
  router.post('/contacts', async (req, res) => {

    const allowedSenders = ALLOWED_SENDERS
        ? ALLOWED_SENDERS.split(',').map((n) => n.trim())
        : [];

        const sender = req.body.From;

        if (!allowedSenders.includes(sender)) {
            logger.warn(`Blocked message from unknown sender: ${sender}`);

            const twiml = new MessagingResponse();
            twiml.message('Sorry, you are not authorized to use this service.');

            res.writeHead(403, { 'Content-Type': 'text/xml' });
            return res.end(twiml.toString());
        }

    const incomingMessage = req.body.Body.trim();
    const twiml = new MessagingResponse();

    if (!req.body || typeof req.body.Body !== 'string' || !req.body.Body.trim()) {
        twiml.message('Invalid request. Please send a valid contact name or type "sync".');
        logger.warn('Invalid or missing message body');
        res.writeHead(400, { 'Content-Type': 'text/xml' });
        return res.end(twiml.toString());
      }

      if (incomingMessage.toLowerCase() === 'help') {
        twiml.message(`Hi! Here is what I can do:
      • Type "sync" to sync contacts from Google.
      • Type "help" to see this message again.`);
      
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        return res.end(twiml.toString());
      }

    // Check if user requested a sync
    if (incomingMessage && incomingMessage.toLowerCase() === 'sync') {
      try {
        const needsAuth = await googleContactsService.checkAuthStatus();
        
        if (needsAuth) {
          const authUrl = googleContactsService.getAuthUrl(); // Use instance method correctly
          return res.json({
            status: 'auth_required',
            authUrl,
            message: 'Authentication required. Please visit the URL.'
          });
        }

        await googleContactsService.syncContacts();
        return res.json({
          status: 'success',
          message: 'Contacts synchronized successfully'
        });
      } catch (error) {
        logger.error('Sync error:', error);
        return res.status(500).json({
          status: 'error',
          message: 'Failed to sync contacts',
          error: error.message
        });
      }
    }

    // Search for matching contacts
    try {
        const matchingContacts = await contactService.findMatchingContacts(incomingMessage);
      
        if (matchingContacts.length > 0) {
          const contactDetails = matchingContacts.join('\n');
          await twilioService.sendMessage(
            req.body.From,
            `Here are the matching contacts:\n${contactDetails}`
          );
        } else {
          twiml.message('No matching contacts found!');
          res.writeHead(200, { 'Content-Type': 'text/xml' });
          return res.end(twiml.toString());
        }
      } catch (error) {
        logger.error('Contact lookup failed:', error);
        twiml.message('Sorry, something went wrong while looking up contacts.');
        res.writeHead(500, { 'Content-Type': 'text/xml' });
        return res.end(twiml.toString());
      }

  });

  return router;
}

module.exports = createWhatsappRoutes;