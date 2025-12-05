/**
 * Get all bookings by user_id (with aggregated seat_ids)
 * @param {Object} dependencies - { pool }
 * @returns {Function} Express handler function
 */
module.exports = ({ pool }) => {
  return async (req, res) => {
    try {
      const userId = req.params.userId;

      const bookingsResult = await pool.query(
        `
      SELECT 
        b.*, 
        json_agg(bs.seat_id) AS seat_ids
      FROM booking b
      LEFT JOIN booking_seats bs ON b.id = bs.booking_id
      WHERE b.user_id = $1
      GROUP BY b.id
      ORDER BY b.created_at DESC
      `,
        [userId]
      );

      res.json(bookingsResult.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};
