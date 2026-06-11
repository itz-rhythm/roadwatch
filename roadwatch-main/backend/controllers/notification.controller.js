const db = require('../config/db');

/**
 * GET /notifications
 * Returns notifications for the authenticated user from DB.
 * Falls back to an empty array gracefully if table doesn't exist yet.
 */
exports.getUserNotifications = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const result = await db.query(
      `SELECT id, message, type, read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    // Table may not exist yet — return empty array instead of crashing
    if (error.code === '42P01') {
      return res.json([]);
    }
    console.error('Notification fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PATCH /notifications/:id/read
 * Marks a single notification as read.
 */
exports.markAsRead = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const result = await db.query(
      `UPDATE notifications SET read = true
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PATCH /notifications/read-all
 * Marks all notifications for the user as read.
 */
exports.markAllAsRead = async (req, res) => {
  const userId = req.user?.id;
  try {
    await db.query(
      `UPDATE notifications SET read = true WHERE user_id = $1`,
      [userId]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
