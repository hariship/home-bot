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
    logger.info('🟢 Incoming Slack webhook payload', { payload });
  
    // Slack's URL verification during initial setup
    if (payload.type === 'url_verification') {
      logger.info('✅ URL verification challenge received from Slack');
      return res.json({ challenge: payload.challenge });
    }
  
    // Event Callback - Main Slack Event Dispatcher
    if (payload.type === 'event_callback') {
      const event = payload.event;
      logger.info(`📩 Event Type: ${event.type}`, { user: event.user, channel: event.channel });
  
      // 1. Ignore bot-generated messages
      if (event.bot_id) {
        logger.info('⚠️ Ignored message from bot user');
        return res.status(200).send(); // Avoid Slack retries
      }
  
      // 2. Handle user messages
      if (event.type === 'message') {
        const messageText = (event.text || '').toLowerCase();
  
        logger.info(`💬 User Message: "${event.text}" from ${event.user}`);
  
        // Simulate slash command or keyword triggers
        if (messageText.includes('help') || messageText.startsWith('/help')) {
          logger.info('📘 Responding to help request');
          return res.json({
            response_type: 'ephemeral',
            message: `🛠️ *Slack Integration Help Menu*\n• Type \`/help\` – Get this menu\n• Type \`/sync\` – Simulate sync\n• Mention a topic to get dummy resources.`,
          });
        }
  
        if (messageText.includes('sync')) {
          logger.info('🔄 Simulating contact sync request via Slack message');
          return res.json({
            response_type: 'in_channel',
            message: `Contacts are being synced... ✅ (Dummy response)`,
          });
        }
  
        // 3. Threaded reply (dummy)
        const isThread = !!event.thread_ts;
        if (isThread) {
          logger.info(`📎 Replying in thread: ${event.thread_ts}`);
          return res.json({
            thread_ts: event.thread_ts,
            message: `👋 Thanks for replying in thread! This is a threaded response (simulated).`,
          });
        }
  
        // 4. General echo
        return res.json({
          response_type: 'in_channel',
          message: `Echo: "${event.text}"`,
          user: event.user,
        });
      }
  
      // 5. Reaction events
      if (event.type === 'reaction_added') {
        logger.info(`😊 Reaction ":${event.reaction}:" added by ${event.user} on`, event.item);
        return res.json({
          status: 'reaction_logged',
          message: `Got your :${event.reaction}: reaction!`,
        });
      }
  
      // 6. Unhandled events
      logger.warn(`🚫 Unhandled event type: ${event.type}`);
      return res.json({
        status: 'ignored',
        message: `No action taken for event type "${event.type}".`,
      });
    }
  
    // 7. Catch-all error for unknown requests
    logger.error('❌ Unknown or malformed Slack request structure', { body: req.body });
    return res.status(400).json({
      status: 'error',
      message: 'Invalid Slack request structure',
    });
  });
}  

module.exports = createWhatsappRoutes;