const db = require('../config/db');
const PDFDocument = require('pdfkit');

/**
 * GET /rti/generate?ward_id=X&date_range=Y
 * Returns JSON summary + a download URL for the full PDF
 */
exports.generateRti = async (req, res) => {
  const { ward_id, date_range } = req.query;

  try {
    // 1. Build date filter
    const dateFilter = buildDateFilter(date_range);

    // 2. Fetch complaint stats for this ward
    const complaintsRes = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status NOT IN ('completed','rejected')) AS open_count,
        COUNT(*) FILTER (WHERE status = 'completed') AS resolved_count,
        COUNT(*) FILTER (WHERE sla_deadline < NOW() AND status NOT IN ('completed','rejected')) AS sla_breach_count,
        COUNT(*) AS total_count
      FROM complaints
      WHERE ward_id = $1 ${dateFilter.clause}
    `, [ward_id, ...dateFilter.params]);

    // 3. Fetch budget data for this ward
    const budgetRes = await db.query(`
      SELECT COALESCE(SUM(amount_spent), 0) AS total_spent,
             COALESCE(SUM(amount_sanctioned), 0) AS total_sanctioned
      FROM roads
      WHERE ward_id = $1
    `, [ward_id]);

    // 4. Fetch contractors who worked in this ward
    const contractorRes = await db.query(`
      SELECT c.name, COUNT(r.id) AS roads_built, 
             COALESCE(SUM(r.amount_spent), 0) AS budget_used,
             c.average_rating
      FROM roads r
      JOIN contractors c ON r.contractor_id = c.id
      WHERE r.ward_id = $1
      GROUP BY c.id, c.name, c.average_rating
      ORDER BY budget_used DESC
    `, [ward_id]);

    const stats = complaintsRes.rows[0];
    const budget = budgetRes.rows[0];

    res.json({
      message: 'RTI data generated successfully',
      ward_id,
      date_range,
      stats: {
        total_complaints: parseInt(stats.total_count),
        resolved_complaints: parseInt(stats.resolved_count),
        open_complaints: parseInt(stats.open_count),
        sla_breaches: parseInt(stats.sla_breach_count),
      },
      budget: {
        total_spent: parseFloat(budget.total_spent).toFixed(2),
        total_sanctioned: parseFloat(budget.total_sanctioned).toFixed(2),
      },
      contractors: contractorRes.rows,
      download_url: `/rti/download?ward_id=${ward_id}&date_range=${date_range}`,
    });
  } catch (error) {
    console.error('RTI generation error:', error);
    res.status(500).json({ error: 'Internal server error during RTI generation' });
  }
};

/**
 * GET /rti/download?ward_id=X&date_range=Y
 * Streams a PDF file directly to the browser
 */
exports.downloadRti = async (req, res) => {
  const { ward_id, date_range } = req.query;

  try {
    const dateFilter = buildDateFilter(date_range);

    // Fetch ward name
    let wardName = `Ward ${ward_id}`;
    try {
      const wardRes = await db.query('SELECT name FROM wards WHERE id = $1', [ward_id]);
      if (wardRes.rows.length > 0) wardName = wardRes.rows[0].name;
    } catch (_) { /* use default */ }

    // Fetch complaint stats
    const complaintsRes = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status NOT IN ('completed','rejected')) AS open_count,
        COUNT(*) FILTER (WHERE status = 'completed') AS resolved_count,
        COUNT(*) FILTER (WHERE sla_deadline < NOW() AND status NOT IN ('completed','rejected')) AS sla_breach_count,
        COUNT(*) AS total_count
      FROM complaints
      WHERE ward_id = $1 ${dateFilter.clause}
    `, [ward_id, ...dateFilter.params]);

    const budgetRes = await db.query(`
      SELECT COALESCE(SUM(amount_spent), 0) AS total_spent,
             COALESCE(SUM(amount_sanctioned), 0) AS total_sanctioned
      FROM roads WHERE ward_id = $1
    `, [ward_id]);

    const contractorRes = await db.query(`
      SELECT c.name, COUNT(r.id) AS roads_built, 
             COALESCE(SUM(r.amount_spent), 0) AS budget_used,
             c.average_rating
      FROM roads r
      JOIN contractors c ON r.contractor_id = c.id
      WHERE r.ward_id = $1
      GROUP BY c.id, c.name, c.average_rating
      ORDER BY budget_used DESC
    `, [ward_id]);

    const stats = complaintsRes.rows[0];
    const budget = budgetRes.rows[0];
    const contractors = contractorRes.rows;

    // Build PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="RTI_Report_Ward${ward_id}_${Date.now()}.pdf"`);
    doc.pipe(res);

    // ── Header ──
    doc.fontSize(18).font('Helvetica-Bold')
      .text('RIGHT TO INFORMATION ACT, 2005', { align: 'center' });
    doc.fontSize(14).font('Helvetica')
      .text('Infrastructure Accountability Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#666666')
      .text(`${wardName}  ·  Period: ${formatDateRange(date_range)}`, { align: 'center' });
    doc.fontSize(9).text(`Generated via RoadWatch Platform on ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
    doc.moveDown(1);

    // ── Divider ──
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.moveDown(1);

    // ── Complaint Statistics ──
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000').text('1. Complaint Statistics');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    const rows = [
      ['Total Complaints Filed', stats.total_count],
      ['Complaints Resolved', stats.resolved_count],
      ['Pending Resolution', stats.open_count],
      ['SLA Deadline Breaches', stats.sla_breach_count],
    ];
    rows.forEach(([label, val]) => {
      doc.text(`  ${label}:`, { continued: true }).font('Helvetica-Bold').text(`  ${val}`, { align: 'left' });
      doc.font('Helvetica');
    });
    doc.moveDown(1);

    // ── Budget ──
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000').text('2. Public Budget Accountability');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text(`  Total Budget Sanctioned:`, { continued: true })
      .font('Helvetica-Bold').text(`  ₹ ${parseFloat(budget.total_sanctioned).toLocaleString('en-IN')}`);
    doc.font('Helvetica');
    doc.text(`  Total Amount Spent:`, { continued: true })
      .font('Helvetica-Bold').text(`  ₹ ${parseFloat(budget.total_spent).toLocaleString('en-IN')}`);
    doc.moveDown(1);

    // ── Contractors ──
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000').text('3. Contractor Performance');
    doc.moveDown(0.5);
    if (contractors.length === 0) {
      doc.fontSize(11).font('Helvetica').fillColor('#666666').text('  No contractor records found for this ward.');
    } else {
      contractors.forEach((c, i) => {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000')
          .text(`  ${i + 1}. ${c.name}`);
        doc.font('Helvetica')
          .text(`      Roads Built: ${c.roads_built}   |   Budget Used: ₹ ${parseFloat(c.budget_used).toLocaleString('en-IN')}   |   Rating: ${parseFloat(c.average_rating || 0).toFixed(1)} / 5`);
        doc.moveDown(0.3);
      });
    }
    doc.moveDown(1);

    // ── Footer ──
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor('#999999')
      .text('This document has been generated from verified public infrastructure data via the RoadWatch platform under the provisions of the RTI Act, 2005. For official RTI filings, this report may be submitted to the Public Information Officer (PIO) of the respective Municipal Corporation.', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('RTI PDF generation error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'PDF generation failed' });
    }
  }
};

/**
 * GET /export/ward-report?ward_id=X
 * Generates a ward-level summary PDF (re-exported via /export route)
 */
exports.exportWardReport = async (req, res) => {
  const { ward_id } = req.query;
  // Reuse downloadRti logic
  req.query.date_range = 'all_time';
  return exports.downloadRti(req, res);
};

// ── Helpers ──

function buildDateFilter(date_range) {
  const now = new Date();
  let since;
  switch (date_range) {
    case 'last_30_days': since = new Date(now - 30 * 86400000); break;
    case 'last_90_days': since = new Date(now - 90 * 86400000); break;
    case 'last_6_months': since = new Date(now - 180 * 86400000); break;
    case 'last_year': since = new Date(now - 365 * 86400000); break;
    default: return { clause: '', params: [] }; // all_time
  }
  return { clause: 'AND created_at >= $2', params: [since] };
}

function formatDateRange(range) {
  const map = {
    last_30_days: 'Last 30 Days',
    last_90_days: 'Last 90 Days',
    last_6_months: 'Last 6 Months',
    last_year: 'Last 1 Year',
    all_time: 'All Time',
  };
  return map[range] || 'Custom Range';
}
