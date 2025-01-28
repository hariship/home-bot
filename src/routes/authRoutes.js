const express = require('express');
const router = express.Router();

function createAuthRoutes(googleContactsService) {
  router.get('/oauth2callback', async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).send('Authorization code is missing');
      }

      await googleContactsService.handleAuthCallback(code);
      res.send('Authentication successful! You can close this window.');
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.status(500).send('Authentication failed: ' + error.message);
    }
  });

  return router;
}

module.exports = createAuthRoutes;