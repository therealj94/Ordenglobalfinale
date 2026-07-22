const { User } = require('../models');

class PublicController {
  // Public GID lookup — what a GENESIS ID card's QR code points to. No
  // authentication (anyone scanning the card needs to see this), so it
  // deliberately returns only the minimum needed to confirm identity:
  // name, photo, nationality, GID, and verified status. No date of birth,
  // no issue/expiry dates, no contact info.
  async getGidCard(req, res, next) {
    try {
      const { gid } = req.params;

      const user = await User.findOne({
        where: { gid, status: 'verified', isActive: true },
        attributes: ['fullName', 'nationality', 'gid', 'idCardPhoto']
      });

      if (!user) {
        return res.status(404).json({ error: 'GENESIS ID not found or not verified' });
      }

      res.json({
        gid: user.gid,
        fullName: user.fullName,
        nationality: user.nationality,
        idCardPhoto: user.idCardPhoto || null,
        status: 'verified'
      });
    } catch (error) {
      console.error('Public GID lookup error:', error);
      res.status(500).json({ error: 'Failed to look up GENESIS ID' });
    }
  }
}

module.exports = new PublicController();
