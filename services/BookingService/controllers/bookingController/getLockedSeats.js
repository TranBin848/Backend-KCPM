/**
 * Get locked seats for a showtime (from Redis cache or database)
 * @param {Object} dependencies - { pool, redisClient }
 * @returns {Function} Express handler function
 */
module.exports = ({ pool, redisClient }) => {
  return async (req, res) => {
    const { showtimeId } = req.params;
    const cacheKey = `locked_seats:${showtimeId}`;

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.json({ locked_seat_ids: JSON.parse(cached) });
      }

      const lockedSeatsResult = await pool.query(
        `
      SELECT bs.seat_id
      FROM booking b
      JOIN booking_seats bs ON b.id = bs.booking_id
      WHERE b.showtime_id = $1 AND b.status IN ('PENDING', 'PAID', 'REFUND_REQUESTED')
      `,
        [showtimeId]
      );

      const lockedSeatIds = lockedSeatsResult.rows.map((r) => r.seat_id);

      await redisClient.setEx(cacheKey, 60, JSON.stringify(lockedSeatIds));

      res.json({ locked_seat_ids: lockedSeatIds });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};
