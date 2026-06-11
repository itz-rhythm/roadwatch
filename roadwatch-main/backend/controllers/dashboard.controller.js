const db = require('../config/db');

exports.getHeatmap = async (req, res) => {
  try {
    const { ward_id, category } = req.query;
    let query = `
      SELECT id, category, severity, status, 
             ST_AsGeoJSON(location)::json as geometry 
      FROM complaints 
      WHERE status NOT IN ('completed', 'rejected')
    `;
    const params = [];
    let idx = 1;

    if (ward_id) { query += ` AND ward_id = $${idx++}`; params.push(ward_id); }
    if (category) { query += ` AND category = $${idx++}`; params.push(category); }

    const result = await db.query(query, params);
    
    const featureCollection = {
      type: "FeatureCollection",
      features: result.rows.map(row => ({
        type: "Feature",
        geometry: row.geometry,
        properties: {
          id: row.id,
          category: row.category,
          severity: row.severity,
          status: row.status
        }
      }))
    };
    
    res.json(featureCollection);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getWardRankings = async (req, res) => {
  // Complex aggregation across wards, roads, complaints
  try {
    const query = `
      SELECT w.id, w.name, 
             COUNT(c.id) as open_complaints,
             COALESCE(w.total_road_length_km, 1) as road_length,
             (COUNT(c.id) / COALESCE(w.total_road_length_km, 1)) as complaints_per_km
      FROM wards w
      LEFT JOIN complaints c ON w.id = c.ward_id AND c.status NOT IN ('completed', 'rejected')
      GROUP BY w.id
      ORDER BY complaints_per_km ASC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getBlackspots = async (req, res) => {
  try {
    const { ward_id, risk_type } = req.query;
    let query = `SELECT *, ST_AsGeoJSON(location)::json as geometry FROM black_spots WHERE 1=1`;
    const params = [];
    let idx = 1;
    if (ward_id) { query += ` AND ward_id = $${idx++}`; params.push(ward_id); }
    if (risk_type) { query += ` AND risk_type = $${idx++}`; params.push(risk_type); }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getBudgetTransparency = async (req, res) => {
  try {
    const { ward_id } = req.query;
    const query = `
      SELECT r.name as road_name, r.amount_sanctioned, r.amount_spent, r.budget_source, r.tender_id, 
             c.name as contractor_name
      FROM roads r
      LEFT JOIN contractors c ON r.contractor_id = c.id
      WHERE r.ward_id = $1
    `;
    const result = await db.query(query, [ward_id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getContractorLeaderboard = async (req, res) => {
  try {
    const query = `
      SELECT id, name, total_roads_built, total_roads_failed, average_rating, failure_frequency_score 
      FROM contractors 
      WHERE blacklisted = false
      ORDER BY average_rating DESC, failure_frequency_score ASC
      LIMIT 10
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getCityOverview = async (req, res) => {
  try {
    const openComplaintsRes = await db.query(`SELECT COUNT(*) as count FROM complaints WHERE status NOT IN ('completed', 'rejected')`);
    const budgetRes = await db.query(`SELECT SUM(amount_spent) as total_spent FROM roads`);
    
    res.json({
      total_open_complaints: openComplaintsRes.rows[0].count,
      total_budget_spent: budgetRes.rows[0].total_spent,
      // Extrapolate other metrics here
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
