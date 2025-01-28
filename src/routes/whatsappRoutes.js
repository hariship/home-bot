const express = require('express');
const { MessagingResponse } = require('twilio').twiml;

const router = express.Router();

function createWhatsappRoutes(contactService, twilioService, googleContactsService) {
  router.post('/contacts', async (req, res) => {
    const incomingMessage = req.body.Body.trim();
    const twiml = new MessagingResponse();

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
        console.error('Sync error:', error);
        return res.status(500).json({
          status: 'error',
          message: 'Failed to sync contacts',
          error: error.message
        });
      }
    }

    // Search for matching contacts
    const matchingContacts = await contactService.findMatchingContacts(incomingMessage);
    console.log(matchingContacts)
    if (matchingContacts.length > 0) {
      const contactDetails = matchingContacts.join('\n');
      await twilioService.sendMessage(
        req.body.From,
        `Here are the matching contacts:\n${contactDetails}`
      );
    } else {
      twiml.message('No matching contacts found!');
    }

    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  });

  return router;
}

module.exports = createWhatsappRoutes;