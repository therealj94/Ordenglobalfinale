require('dotenv').config();

module.exports = {
  apiKey: process.env.VERIFF_API_KEY,
  secret: process.env.VERIFF_SECRET,
  apiUrl: process.env.VERIFF_API_URL || 'https://stationapi.veriff.com',
  callbackUrl: process.env.VERIFF_CALLBACK_URL,

  // Veriff endpoints
  endpoints: {
    createSession: '/v1/sessions',
    getDecision: '/v1/sessions/:sessionId/decision',
    webhook: '/v1/sessions/:sessionId/webhook'
  }
};
