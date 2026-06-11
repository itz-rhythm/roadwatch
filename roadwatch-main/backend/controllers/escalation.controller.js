const db = require('../config/db');

exports.checkEscalations = async (req, res) => {
  try {
    // 1. Find all open complaints where SLA deadline is passed
    const query = `
      SELECT c.*, w.executive_engineer_email, w.zone_engineer_email, w.city_engineer_email, w.state_engineer_email 
      FROM complaints c
      JOIN wards w ON c.ward_id = w.id
      WHERE c.status NOT IN ('completed', 'rejected') 
      AND c.sla_deadline < now()
    `;
    const result = await db.query(query);

    for (let complaint of result.rows) {
      // Determine level logic
      // e.g., if no escalation exists, escalate to level 1 (Zone Engineer).
      // If level 1 exists > 24 hours, escalate to level 2 (City Engineer).
      // MOCK: Sending emails via SendGrid
      
      const insertEscalation = `
        INSERT INTO escalations (complaint_id, escalated_from_email, escalated_to_email, escalation_level, reason, email_sent_at)
        VALUES ($1, $2, $3, $4, $5, now())
      `;
      await db.query(insertEscalation, [
        complaint.id, 
        complaint.executive_engineer_email, 
        complaint.zone_engineer_email, 
        1, 
        'SLA Breached'
      ]);
    }

    res.json({ message: `Checked and escalated ${result.rows.length} complaints.` });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getEscalationHistory = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM escalations WHERE complaint_id = $1 ORDER BY email_sent_at ASC', [req.params.complaint_id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
