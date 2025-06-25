const express = require('express');
const router = express.Router();

function createSyncRoutes(googleContactsService) {
  // Endpoint to start sync
  router.post('/start', async (req, res) => {
    try {
      const needsAuth = await googleContactsService.checkAuthStatus();
      
      if (needsAuth) {
        const authUrl = googleContactsService.getAuthUrl();
        return res.json({
          status: 'auth_required',
          authUrl,
          message: 'Authentication required. Please visit the authorization URL.'
        });
      }

      await googleContactsService.syncContacts();
      res.json({
        status: 'success',
        message: 'Contacts synchronized successfully'
      });
    } catch (error) {
      console.error('Sync error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to sync contacts',
        error: error.message
      });
    }
  });

  // Endpoint to handle OAuth callback
  router.get('/auth-callback', async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).json({
          status: 'error',
          message: 'Authorization code is required'
        });
      }

      await googleContactsService.handleAuthCallback(code);
      res.json({
        status: 'success',
        message: 'Authentication successful. You can now sync contacts.'
      });
    } catch (error) {
      console.error('Auth callback error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Authentication failed',
        error: error.message
      });
    }
  });

  // Endpoint to check sync status
  router.get('/status', async (req, res) => {
    try {
      const status = await googleContactsService.getSyncStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to get sync status',
        error: error.message
      });
    }
  });

  return router;
}

module.exports = createSyncRoutes;