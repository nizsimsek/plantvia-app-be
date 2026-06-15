let client = null;

function getClient() {
  return client;
}

export function analyticsMiddleware(req, res, next) {
  res.on('finish', () => {
    try {
      const ph = getClient();
      if (!ph) return;

      const userId = req.user?.id ? String(req.user.id) : null;
      const status = res.statusCode;
      const method = req.method;
      const path = req.path;

      if (!userId || status >= 400) return;

      if (method === 'POST' && path === '/auth/register' && status === 201) {
        ph.capture({ distinctId: userId, event: 'signed_up' });
      } else if (method === 'POST' && path === '/auth/login' && status === 200) {
        ph.capture({ distinctId: userId, event: 'logged_in' });
      } else if (method === 'POST' && path === '/plants' && status === 201) {
        ph.capture({ distinctId: userId, event: 'plant_added' });
      } else if (method === 'POST' && path === '/ai/analyze' && status === 200) {
        ph.capture({ distinctId: userId, event: 'ai_analysis_completed' });
      }
    } catch (_) {}
  });
  next();
}

export function shutdownAnalytics() {
  client = null;
}
