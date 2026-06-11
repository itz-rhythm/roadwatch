const db = require('../config/db');
const axios = require('axios');

exports.createComplaint = async (req, res) => {
  try {
    const { category, title, description, severity, latitude, longitude } = req.body;
    const userId = req.user.id;

    // 1. Upload files -> Handled by Multer/Cloudinary middleware (req.files)
    let mediaUrls = [];
    if (req.files) {
      mediaUrls = req.files.map(file => file.path);
    }

    // 2. Google Maps Geocoding Mock
    const address = "Simulated Reverse Geocoded Address, MG Road";

    // 3. Find Ward via PostGIS ST_Contains
    const wardQuery = `
      SELECT id FROM wards 
      WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326))
      LIMIT 1
    `;
    const wardRes = await db.query(wardQuery, [longitude, latitude]);
    const wardId = wardRes.rows.length > 0 ? wardRes.rows[0].id : null;

    // 4. Duplicate Check via PostGIS ST_DWithin (20 meters)
    const duplicateQuery = `
      SELECT id FROM complaints 
      WHERE category = $1 
      AND status IN ('reported', 'assigned', 'in_progress')
      AND ST_DWithin(
        location::geography, 
        ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, 
        20
      )
      LIMIT 1
    `;
    const dupRes = await db.query(duplicateQuery, [category, longitude, latitude]);
    if (dupRes.rows.length > 0) {
      return res.status(409).json({
        message: 'A similar issue already exists nearby. Please upvote it instead.',
        duplicate_complaint_id: dupRes.rows[0].id
      });
    }

    // 5. Deep Duplicate Check via ML Service (If within 100m)
    // MOCK: In reality, fetch embeddings of nearby complaints, call Python API
    try {
      const mlResponse = await axios.post('http://ml-service:8000/detect-duplicate', {
        new_embedding: [0.1, 0.2], // Mock
        existing_embeddings: [[0.1, 0.25]] // Mock
      });
      if (mlResponse.data.status === 'duplicate_found') {
        return res.status(409).json({ message: 'Deep AI identified a highly similar existing issue.', similarity: mlResponse.data.similarity });
      }
    } catch(e) { console.error('ML Duplicate Check failed, continuing...', e.message); }

    // 6. Vision API Mock for Severity Classification
    // MOCK: Calls Google Cloud Vision API with mediaUrls[0], maps labels
    let aiSeverity = severity;
    let finalSeverity = severity;
    const detectedLabels = ['large hole', 'collapsed road']; // Simulated Vision Output
    
    if (detectedLabels.includes('collapsed road') || detectedLabels.includes('large hole')) {
        aiSeverity = 'critical';
    } else if (detectedLabels.includes('pothole') || detectedLabels.includes('waterlogging')) {
        aiSeverity = 'dangerous';
    }

    let note = '';
    if (aiSeverity === 'critical' && severity === 'minor') {
        finalSeverity = 'dangerous';
        note = 'AI analysis indicates this may be more severe than reported.';
    }

    // 7. Calculate SLA
    let slaDays = 30;
    if (finalSeverity === 'critical') slaDays = 1;
    else if (finalSeverity === 'dangerous') slaDays = 2;
    else if (finalSeverity === 'moderate') slaDays = 7;
    
    const slaDeadline = new Date();
    slaDeadline.setDate(slaDeadline.getDate() + slaDays);

    const isEmergency = finalSeverity === 'critical';

    // 8. Insert Complaint
    const insertQuery = `
      INSERT INTO complaints 
      (user_id, category, title, description, severity, ai_severity, final_severity, 
       location, address, ward_id, media_urls, sla_deadline, is_emergency)
      VALUES 
      ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($8, $9), 4326), $10, $11, $12, $13, $14)
      RETURNING *
    `;
    const newComplaint = await db.query(insertQuery, [
      userId, category, title, description, severity, aiSeverity, finalSeverity,
      longitude, latitude, address, wardId, JSON.stringify(mediaUrls), slaDeadline, isEmergency
    ]);

    // 9. Add Timeline Event
    await db.query(
      `INSERT INTO complaint_timeline (complaint_id, status, note, changed_by) VALUES ($1, $2, $3, $4)`,
      [newComplaint.rows[0].id, 'reported', note || 'Complaint reported by citizen', userId]
    );

    // 10. Gamification: Award 10 Reputation points and Check Badge
    await db.query(`UPDATE users SET reputation_points = reputation_points + 10 WHERE id = $1 RETURNING reputation_points`, [userId]);
    // Mock logic for awarding 'Road Guardian' badge if points > 100

    // 11. Emergency Socket.IO Broadcast
    if (isEmergency) {
       const io = req.app.get('io');
       if(io) {
         io.emit('emergency_alert', { message: `Critical issue reported: ${title}`, location: {lat: latitude, lng: longitude} });
       }
    }

    res.status(201).json(newComplaint.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getComplaints = async (req, res) => {
  try {
    const { ward_id, category, status } = req.query;
    let query = `
      SELECT c.*, u.name as owner_name, w.name as ward_name 
      FROM complaints c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN wards w ON c.ward_id = w.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (ward_id) { query += ` AND c.ward_id = $${idx++}`; params.push(ward_id); }
    if (category) { query += ` AND c.category = $${idx++}`; params.push(category); }
    if (status) { query += ` AND c.status = $${idx++}`; params.push(status); }

    query += ` ORDER BY c.created_at DESC LIMIT 50`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getComplaintById = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM complaints WHERE id = $1', [req.params.id]);
    if(result.rows.length === 0) return res.status(404).json({error: 'Not found'});
    
    const timeline = await db.query('SELECT * FROM complaint_timeline WHERE complaint_id = $1 ORDER BY changed_at ASC', [req.params.id]);
    
    const complaint = result.rows[0];
    complaint.timeline = timeline.rows;
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_status, note } = req.body;
    const userId = req.user.id;

    const result = await db.query(
      `UPDATE complaints SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [new_status, id]
    );

    await db.query(
      `INSERT INTO complaint_timeline (complaint_id, status, note, changed_by) VALUES ($1, $2, $3, $4)`,
      [id, new_status, note, userId]
    );

    if (new_status === 'completed') {
      await db.query(`UPDATE users SET reputation_points = reputation_points + 5 WHERE id = $1`, [result.rows[0].user_id]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.upvote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await db.query(`INSERT INTO upvotes (user_id, complaint_id) VALUES ($1, $2)`, [userId, id]);
    const result = await db.query(`UPDATE complaints SET upvote_count = upvote_count + 1 WHERE id = $1 RETURNING upvote_count, user_id`, [id]);
    
    // Reward original reporter
    await db.query(`UPDATE users SET reputation_points = reputation_points + 2 WHERE id = $1`, [result.rows[0].user_id]);

    res.json({ upvotes: result.rows[0].upvote_count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upvote. Already upvoted?' });
  }
};

exports.removeUpvote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    await db.query(`DELETE FROM upvotes WHERE user_id = $1 AND complaint_id = $2`, [userId, id]);
    const result = await db.query(`UPDATE complaints SET upvote_count = upvote_count - 1 WHERE id = $1 RETURNING upvote_count`, [id]);
    
    res.json({ upvotes: result.rows[0].upvote_count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove upvote' });
  }
};

exports.voiceComplaint = async (req, res) => {
  // MOCK: Calls OpenAI Whisper with req.file, extracts data, creates complaint
  res.status(201).json({ message: 'Voice complaint parsed and created successfully (MOCKED)' });
};

exports.getNearby = async (req, res) => {
  try {
    const { lat, lng, radius = 500 } = req.query;
    const query = `
      SELECT *, ST_Distance(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance
      FROM complaints 
      WHERE status NOT IN ('completed', 'rejected')
      AND ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
      ORDER BY distance ASC
    `;
    const result = await db.query(query, [lng, lat, radius]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
