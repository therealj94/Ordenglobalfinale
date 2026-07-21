const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const veriffConfig = require('../config/veriff');

class VeriffService {
  constructor() {
    this.client = axios.create({
      baseURL: veriffConfig.apiUrl,
      headers: {
        'X-AUTH-CLIENT': veriffConfig.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  async createSession(userId, email) {
    try {
      const externalDossierRef = uuidv4();

      const payload = {
        verification: {
          timestamp: Math.floor(Date.now() / 1000),
          vendorData: userId,
          person: {
            givenNames: '',
            surname: '',
            dateOfBirth: ''
          }
        },
        consent: {
          processing: true,
          thirdParties: false
        },
        redirectUrl: process.env.FRONTEND_URL + '/verify-result'
      };

      const response = await this.client.post('/v1/sessions', {
        verification: payload.verification,
        consent: payload.consent,
        redirectUrl: payload.redirectUrl
      });

      if (!response.data || !response.data.verification) {
        throw new Error('Invalid Veriff response');
      }

      return {
        sessionId: response.data.verification.id,
        url: response.data.verification.url,
        externalDossierRef: externalDossierRef,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Veriff session creation error:', error.response?.data || error.message);
      throw new Error('Failed to create Veriff session: ' + error.message);
    }
  }

  async getDecision(sessionId) {
    try {
      const response = await this.client.get(`/v1/sessions/${sessionId}/decision`);
      return response.data;
    } catch (error) {
      console.error('Veriff decision retrieval error:', error.response?.data || error.message);
      throw new Error('Failed to get Veriff decision: ' + error.message);
    }
  }

  validateWebhookSignature(body, signature) {
    try {
      const hash = crypto
        .createHmac('sha256', veriffConfig.secret)
        .update(body)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(hash),
        Buffer.from(signature)
      );
    } catch (error) {
      return false;
    }
  }

  parseWebhookData(data) {
    return {
      sessionId: data?.verification?.id,
      status: data?.verification?.status,
      decision: data?.verification?.decision,
      timestamp: data?.verification?.timestamp,
      person: data?.verification?.person,
      document: data?.verification?.document
    };
  }
}

module.exports = new VeriffService();
