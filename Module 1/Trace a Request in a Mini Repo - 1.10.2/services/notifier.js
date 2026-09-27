// Notifier Service
// Sends access logs (e.g., for audit trail or analytics)

async function sendAccessLog(logData) {
  // Simulated async operation (e.g., calling an external service)
  return new Promise((resolve) => {
    setTimeout(() => {
      global.mockDB.notificationLog.push({
        ...logData,
        id: global.mockDB.notificationLog.length + 1
      });
      console.log('[NOTIFIER]', `Logged: user ${logData.user_id} ${logData.action} report ${logData.report_id}`);
      resolve();
    }, 10); // 10ms delay to simulate network call
  });
}

module.exports = { sendAccessLog };
