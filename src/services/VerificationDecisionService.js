const { Op } = require('sequelize');
const EmailService = require('./EmailService');
const { assignGIDIfMissing } = require('./GIDService');

// How long the user sees a "verifying..." screen before the automatic
// decision (approve or send to manual review) is actually applied. Gives
// the process a realistic feel instead of resolving instantly.
const DECISION_DELAY_MS = 60 * 1000; // 1 minute

// Safety net in case a setTimeout is lost to a server restart — a periodic
// sweep picks up any verification whose decisionAt has already passed.
const SWEEP_INTERVAL_MS = 30 * 1000;

const timers = new Map();

function scheduleDecision(verificationId, delayMs = DECISION_DELAY_MS) {
  if (timers.has(verificationId)) {
    clearTimeout(timers.get(verificationId));
  }
  const timer = setTimeout(() => {
    timers.delete(verificationId);
    applyDecision(verificationId).catch((err) =>
      console.error(`Failed to apply decision for verification ${verificationId}:`, err)
    );
  }, Math.max(delayMs, 0));
  timers.set(verificationId, timer);
}

async function applyDecision(verificationId) {
  // Models are required lazily to avoid a circular require with ./index.js
  const { Verification, User, ManualReviewCase } = require('../models');

  const verification = await Verification.findByPk(verificationId);
  if (!verification || verification.status !== 'processing') {
    return; // already resolved (or removed) — nothing to do
  }

  const user = await User.findByPk(verification.userId);
  if (!user) return;

  const pendingDecision = verification.rawData?.pendingDecision;
  const autoApprove = !!pendingDecision?.autoApprove;

  if (autoApprove) {
    const gid = await assignGIDIfMissing(user, User);
    await user.update({ status: 'verified' });
    await verification.update({ status: 'approved', verifiedAt: new Date(), rawData: null });
    EmailService.sendVerificationApproved(user).catch(() => {});
    return { status: 'approved', gid };
  }

  await verification.update({ status: 'pending' });
  await ManualReviewCase.create({
    verificationId: verification.id,
    userId: user.id,
    reason: pendingDecision?.reason || 'Needs manual review',
    status: 'pending'
  });
  return { status: 'pending' };
}

async function sweepDueDecisions() {
  const { Verification } = require('../models');
  const due = await Verification.findAll({
    where: { status: 'processing', decisionAt: { [Op.lte]: new Date() } },
    attributes: ['id']
  });

  for (const v of due) {
    await applyDecision(v.id).catch((err) =>
      console.error(`Sweep: failed to apply decision for verification ${v.id}:`, err)
    );
  }
}

function startSweeper() {
  sweepDueDecisions().catch((err) => console.error('Initial decision sweep failed:', err));
  setInterval(() => {
    sweepDueDecisions().catch((err) => console.error('Decision sweep failed:', err));
  }, SWEEP_INTERVAL_MS);
}

module.exports = {
  DECISION_DELAY_MS,
  scheduleDecision,
  applyDecision,
  sweepDueDecisions,
  startSweeper
};
