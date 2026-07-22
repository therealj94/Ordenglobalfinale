const rateLimit = require('express-rate-limit');

// Tighter limit for sensitive auth actions (login, register, password reset)
// to slow down brute-force and abuse. Keyed by IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' }
});

// Even tighter for the "forgot password" trigger so it can't be used to
// spam a victim's inbox or enumerate accounts at scale.
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password reset requests. Please try again later.' }
});

// The public GID lookup (scanned from a GENESIS ID card's QR code) has no
// login — bound it so it can't be used to scrape/enumerate GIDs at scale.
const publicLookupLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a moment.' }
});

module.exports = { authLimiter, passwordResetLimiter, publicLookupLimiter };
