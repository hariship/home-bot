const express = require('express');

function createHealthRoutes() {
  const router = express.Router();

  router.get('/health', async (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  });

  return router;
}

module.exports = createHealthRoutes;