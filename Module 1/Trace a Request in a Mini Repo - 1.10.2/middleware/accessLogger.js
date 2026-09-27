const notifier = require('../services/notifier');

function accessLogger(req, res, next) {
  res.on('finish', () => {
    // Fire access log only if the response was successful (status 200)
    if (res.statusCode === 200) {
      const reportId = parseInt(req.params.id, 10);
      const userId = req.user ? req.user.user_id : undefined;

      notifier.sendAccessLog({
        user_id: userId,
        report_id: reportId,
        timestamp: new Date().toISOString(),
        action: 'accessed'
      }).catch((err) => {
        console.error('Notification failed:', err.message);
      });
    }
  });

  // Pass control forward immediately so the handler runs without blocking
  next();
}

accessLogger.accessLogger = accessLogger;
module.exports = { accessLogger };
