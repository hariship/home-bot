const express = require('express');

function createSlackRoutes(slackService) {
  const router = express.Router();

  // Send message to a channel
  router.post('/message', async (req, res) => {
    try {
      const { channel, text } = req.body;
      const result = await slackService.sendMessage(channel, text);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update user status
  router.post('/status', async (req, res) => {
    try {
      const { userId, status, emoji } = req.body;
      const result = await slackService.updateUserStatus(userId, status, emoji);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get channel list
  router.get('/channels', async (req, res) => {
    try {
      const channels = await slackService.getChannelList();
      res.json(channels);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createSlackRoutes;