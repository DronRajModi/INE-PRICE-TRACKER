const env = require('../config/env');

/**
 * Middleware to authenticate scheduled external cron triggers (e.g., cron-job.org)
 * Accepts token via 'Authorization: Bearer <token>' or query param '?secret=<token>'
 */
function cronAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const querySecret = req.query.secret;

  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (querySecret) {
    token = querySecret.trim();
  }

  // If CRON_SECRET is not configured or matches provided token
  if (token && token === env.cronSecret) {
    return next();
  }

  // Development bypass: allow if in local dev without secret specified in header
  if (process.env.NODE_ENV === 'development' && (!env.cronSecret || token === 'dev')) {
    return next();
  }

  return res.status(401).json({
    success: false,
    error: 'Unauthorized. Valid cron secret token required.',
    help: 'Pass header "Authorization: Bearer <CRON_SECRET>" or "?secret=<CRON_SECRET>"'
  });
}

module.exports = cronAuth;
