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

  router.post('/slack', async (req, res) => {
    const payload = req.body;
    logger.info('Received Slack event', { payload });
  
    // 1. URL verification (required during Slack setup)
    if (payload.type === 'url_verification') {
      logger.info('Slack URL verification request');
      return res.json({ challenge: payload.challenge });
    }
  
    // 2. Handle event callbacks
    if (payload.type === 'event_callback') {
      const event = payload.event;
  
      // Ignore bot messages
      if (event.bot_id) {
        logger.info('Ignoring bot message');
        return res.status(200).send(); // Respond quickly to avoid retries
      }
  
      // 3. Handle user messages
      if (event.type === 'message') {
        logger.info(`Slack user ${event.user} said: ${event.text}`);
  
        // Dummy keyword response
        if (event.text.toLowerCase().includes('help')) {
          logger.info('Detected "help" keyword in Slack message');
          // Simulate sending help message
          return res.json({
            status: 'responded',
            message: 'Here is what I can do:\n• Echo messages\n• Respond to "help"\n• Track reactions',
          });
        }
  
        // Simulate delayed response
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1s delay
  
        return res.json({
          status: 'received',
          echo: event.text,
          user: event.user,
          channel: event.channel,
        });
      }
  
      // 4. Handle reactions (dummy logging)
      if (event.type === 'reaction_added') {
        logger.info(`User ${event.user} added reaction :${event.reaction}: to item`, event.item);
        return res.json({
          status: 'tracked',
          message: `Reaction :${event.reaction}: noted.`,
        });
      }
  
      // 5. Unknown event type
      logger.warn(`Unhandled Slack event type: ${event.type}`);
      return res.status(200).json({
        status: 'ignored',
        message: `No handler for event type "${event.type}"`,
      });
    }
  
    // 6. Catch-all fallback
    logger.error('Unknown Slack payload structure', payload);
    return res.status(400).json({
      status: 'error',
      message: 'Unsupported Slack request type',
    });
  });    

  return router;
}

module.exports = createWhatsappRoutes;