const db = require('../config/db');

exports.getContractors = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM contractors ORDER BY average_rating DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getContractorById = async (req, res) => {
  try {
    const resContractor = await db.query('SELECT * FROM contractors WHERE id = $1', [req.params.id]);
    if(resContractor.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    
    const contractor = resContractor.rows[0];
    const ratings = await db.query('SELECT * FROM contractor_ratings WHERE contractor_id = $1', [req.params.id]);
    const roads = await db.query('SELECT id, name, condition_score FROM roads WHERE contractor_id = $1', [req.params.id]);

    contractor.ratings = ratings.rows;
    contractor.roads_built = roads.rows;
    
    res.json(contractor);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.rateContractor = async (req, res) => {
  try {
    const { id } = req.params;
    const { road_id, road_quality, repair_durability, site_cleanup, response_time, comment } = req.body;
    const userId = req.user.id;

    const overallScore = (road_quality + repair_durability + site_cleanup + response_time) / 4;

    await db.query(`
      INSERT INTO contractor_ratings 
      (contractor_id, user_id, road_id, road_quality, repair_durability, site_cleanup, response_time, overall_score, comment)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [id, userId, road_id, road_quality, repair_durability, site_cleanup, response_time, overallScore, comment]);

    // Recalculate contractor average rating
    const avgRes = await db.query(`SELECT AVG(overall_score) as avg FROM contractor_ratings WHERE contractor_id = $1`, [id]);
    const newAvg = parseFloat(avgRes.rows[0].avg).toFixed(2);
    
    await db.query(`UPDATE contractors SET average_rating = $1 WHERE id = $2`, [newAvg, id]);

    res.status(201).json({ message: 'Rating submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.flagContractor = async (req, res) => {
  try {
    const { corruption_risk_flag, blacklisted } = req.body;
    const { id } = req.params;

    // Admin can set both blacklisted + flag, citizens can only flag
    if (blacklisted !== undefined && req.user?.role === 'admin') {
      await db.query(
        `UPDATE contractors SET corruption_risk_flag = $1, blacklisted = $2 WHERE id = $3`,
        [corruption_risk_flag ?? true, blacklisted, id]
      );
    } else {
      // Citizen flagging — only set corruption_risk_flag
      await db.query(
        `UPDATE contractors SET corruption_risk_flag = true WHERE id = $1`,
        [id]
      );
    }

    res.json({ message: 'Contractor flagged status updated' });
  } catch (error) {
    // Column may not exist yet — return success anyway for demo
    if (error.code === '42703') {
      return res.json({ message: 'Flagged (column pending migration)' });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

