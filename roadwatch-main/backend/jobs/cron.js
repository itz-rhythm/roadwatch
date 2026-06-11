const cron = require('node-cron');
const db = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// 1. SLA ENFORCEMENT AND AUTO ESCALATION (Runs every hour)
cron.schedule('0 * * * *', async () => {
  console.log('Running Hourly SLA Escalation Job...');
  try {
    const query = `
      SELECT c.*, w.executive_engineer_email, w.zone_engineer_email, w.city_engineer_email, w.state_engineer_email 
      FROM complaints c
      JOIN wards w ON c.ward_id = w.id
      WHERE c.status NOT IN ('completed', 'rejected') 
      AND c.sla_deadline < now()
    `;
    const overdue = await db.query(query);

    for (let complaint of overdue.rows) {
      // Find current highest escalation level
      const escRes = await db.query(`SELECT escalation_level, email_sent_at FROM escalations WHERE complaint_id = $1 ORDER BY escalation_level DESC LIMIT 1`, [complaint.id]);
      
      let nextLevel = 1;
      let escalateTo = complaint.executive_engineer_email;
      let shouldEscalate = false;

      if (escRes.rows.length === 0) {
        shouldEscalate = true; // Level 0 -> 1
      } else {
        const lastEsc = escRes.rows[0];
        const hoursSinceLast = (new Date() - new Date(lastEsc.email_sent_at)) / (1000 * 60 * 60);
        
        if (lastEsc.escalation_level === 1 && hoursSinceLast >= 48) { nextLevel = 2; escalateTo = complaint.zone_engineer_email; shouldEscalate = true; }
        else if (lastEsc.escalation_level === 2 && hoursSinceLast >= 72) { nextLevel = 3; escalateTo = complaint.city_engineer_email; shouldEscalate = true; }
        else if (lastEsc.escalation_level === 3 && hoursSinceLast >= 168) { nextLevel = 4; escalateTo = complaint.state_engineer_email; shouldEscalate = true; }
      }

      if (shouldEscalate && escalateTo) {
        await db.query(`
          INSERT INTO escalations (complaint_id, escalated_from_email, escalated_to_email, escalation_level, reason, email_sent_at)
          VALUES ($1, $2, $3, $4, $5, now())
        `, [complaint.id, 'system@roadwatch.org', escalateTo, nextLevel, `Overdue by ${nextLevel} levels`]);
        
        console.log(`Escalated complaint ${complaint.id} to Level ${nextLevel} (${escalateTo})`);

        if (nextLevel === 4) {
          // AUTO GENERATE RTI AT LEVEL 4
          console.log(`Generating RTI for Level 4 Escalation on complaint ${complaint.id}`);
          const doc = new PDFDocument();
          const p = path.join(__dirname, '..', 'rti_exports', `RTI_${complaint.id}.pdf`);
          if (!fs.existsSync(path.dirname(p))) fs.mkdirSync(path.dirname(p));
          doc.pipe(fs.createWriteStream(p));
          doc.fontSize(20).text('Right to Information (RTI) Application', { align: 'center' });
          doc.moveDown();
          doc.fontSize(12).text(`Regarding unresolved complaint ID: ${complaint.id}`);
          doc.text(`Location: ${complaint.address}`);
          doc.text(`SLA Breached heavily. Auto-filed by RoadWatch System.`);
          doc.end();
        }
      }
    }
  } catch (err) { console.error('SLA Job Error:', err); }
});

// 2. CONTRACTOR PERFORMANCE AI (Runs daily at midnight)
cron.schedule('0 0 * * *', async () => {
  console.log('Running Daily Contractor AI Job...');
  try {
    const contractors = await db.query(`SELECT id, total_roads_built, total_roads_failed FROM contractors`);
    
    for (let c of contractors.rows) {
      if (c.total_roads_built > 0) {
        const failure_score = (c.total_roads_failed / c.total_roads_built) * 100;
        
        let flag = false;
        if (failure_score > 50.0) {
          flag = true;
          console.log(`Alert! Contractor ${c.id} crossed 50% failure threshold. Flagging for corruption risk.`);
          // Mock sending email to admin
        }
        
        await db.query(`UPDATE contractors SET failure_frequency_score = $1, corruption_risk_flag = $2 WHERE id = $3`, 
          [failure_score, flag, c.id]);
      }
    }
  } catch (err) { console.error('Contractor AI Error:', err); }
});

// 3. BLACK SPOT INTELLIGENCE (Runs daily at 1 AM)
cron.schedule('0 1 * * *', async () => {
  console.log('Running Black Spot Aggregation...');
  try {
    // Find clusters of 3+ dangerous complaints within 50m over 90 days.
    // Highly complex PostGIS aggregation handled here.
    const query = `
      WITH clusters AS (
        SELECT 
          ST_ClusterDBSCAN(location::geometry, eps := 50, minpoints := 3) over () AS cid,
          location, ward_id, category, created_at
        FROM complaints
        WHERE category IN ('black_spot', 'pothole', 'waterlogging', 'accident_prone')
        AND created_at > now() - interval '90 days'
      )
      SELECT cid, ST_Centroid(ST_Collect(location::geometry)) as center, COUNT(*) as cnt, MAX(ward_id) as ward
      FROM clusters
      WHERE cid IS NOT NULL
      GROUP BY cid
    `;
    const res = await db.query(query);
    
    for (let row of res.rows) {
      // Check if blackspot already exists nearby
      const exist = await db.query(`
        SELECT id FROM black_spots 
        WHERE ST_DWithin(location::geography, $1::geometry::geography, 20)
      `, [row.center]);
      
      if (exist.rows.length === 0) {
        await db.query(`
          INSERT INTO black_spots (location, ward_id, risk_type, report_count, time_based_risk)
          VALUES ($1::geometry, $2, 'accident_prone', $3, '{"night": "high"}')
        `, [row.center, row.ward, row.cnt]);
        console.log(`Auto-created new Black Spot in ward ${row.ward} with ${row.cnt} reports.`);
      }
    }
  } catch (err) { console.error('Black Spot Job Error:', err); }
});

module.exports = cron;
