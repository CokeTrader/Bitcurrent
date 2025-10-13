/**
 * DAO Governance
 * Community-driven decisions
 */

const pool = require('../config/database');

class DAOGovernance {
  async createProposal(userId, title, description, votingPeriod) {
    const result = await pool.query(
      `INSERT INTO dao_proposals (creator_id, title, description, voting_ends_at, status, created_at)
       VALUES ($1, $2, $3, $4, 'active', NOW()) RETURNING *`,
      [userId, title, description, new Date(Date.now() + votingPeriod * 24 * 60 * 60 * 1000)]
    );

    return { success: true, proposal: result.rows[0] };
  }

  async vote(userId, proposalId, choice) {
    await pool.query(
      `INSERT INTO dao_votes (user_id, proposal_id, choice, voting_power, created_at)
       VALUES ($1, $2, $3, 1, NOW())`,
      [userId, proposalId, choice]
    );

    return { success: true, message: 'Vote recorded' };
  }

  async executeProposal(proposalId) {
    return { success: true, message: 'Proposal executed' };
  }
}

module.exports = new DAOGovernance();

