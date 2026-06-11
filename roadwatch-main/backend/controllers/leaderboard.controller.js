const db = require('../config/db');

exports.getCitizenLeaderboard = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, reputation_points, badges, profile_photo_url 
      FROM users 
      WHERE role IN ('citizen', 'volunteer')
      ORDER BY reputation_points DESC 
      LIMIT 20
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getWardLeaderboard = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT w.id, w.name, COUNT(c.id) as resolved_complaints 
      FROM wards w
      LEFT JOIN complaints c ON w.id = c.ward_id AND c.status = 'completed'
      GROUP BY w.id
      ORDER BY resolved_complaints DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
