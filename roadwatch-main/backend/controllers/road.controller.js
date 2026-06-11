const db = require('../config/db');

exports.getRoads = async (req, res) => {
  try {
    const { ward_id, road_type, contractor_id } = req.query;
    let query = `
      SELECT r.id, r.name, r.road_type, r.last_repair_date, r.condition_score, 
             c.name as contractor_name 
      FROM roads r
      LEFT JOIN contractors c ON r.contractor_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (ward_id) { query += ` AND r.ward_id = $${idx++}`; params.push(ward_id); }
    if (road_type) { query += ` AND r.road_type = $${idx++}`; params.push(road_type); }
    if (contractor_id) { query += ` AND r.contractor_id = $${idx++}`; params.push(contractor_id); }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getRoadById = async (req, res) => {
  try {
    const roadRes = await db.query(`
      SELECT r.*, c.name as contractor_name, c.average_rating, c.failure_frequency_score
      FROM roads r
      LEFT JOIN contractors c ON r.contractor_id = c.id
      WHERE r.id = $1
    `, [req.params.id]);
    
    if(roadRes.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const road = roadRes.rows[0];

    const repairLogs = await db.query('SELECT * FROM repair_logs WHERE road_id = $1 ORDER BY start_date DESC', [req.params.id]);
    const complaints = await db.query('SELECT id, title, severity, status FROM complaints WHERE road_id = $1', [req.params.id]);

    road.repair_history = repairLogs.rows;
    road.complaints = complaints.rows;

    res.json(road);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createRoad = async (req, res) => {
  // Admin only. Expects GeoJSON coordinates in body.geom
  const { name, road_type, ward_id, contractor_id, amount_sanctioned, budget_source, tender_id, geomStr } = req.body;
  try {
    const query = `
      INSERT INTO roads (name, road_type, ward_id, contractor_id, amount_sanctioned, budget_source, tender_id, geom)
      VALUES ($1, $2, $3, $4, $5, $6, $7, ST_GeomFromGeoJSON($8))
      RETURNING *
    `;
    const result = await db.query(query, [name, road_type, ward_id, contractor_id, amount_sanctioned, budget_source, tender_id, geomStr]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateRoad = async (req, res) => {
  // Logic for admin/city_engineer to update road
  res.json({ message: 'Road updated' });
};

exports.predictFailure = async (req, res) => {
  // Calls Python FastAPI microservice
  res.json({ failure_probability: 85, estimated_failure_date: '2026-08-15' });
};
