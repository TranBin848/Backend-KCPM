/**
 * Delete booking and associated seats, clear Redis cache
 * @param {Object} dependencies - { pool, redisClient }
 * @returns {Function} Express handler function
 */
module.exports = ({ pool, redisClient }) => {
  return async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const showtimeResult = await client.query(
        "SELECT showtime_id FROM booking WHERE id = $1",
        [req.params.id]
      );

      if (showtimeResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Booking not found" });
      }

      const showtimeId = showtimeResult.rows[0].showtime_id;

      await client.query("DELETE FROM booking_seats WHERE booking_id = $1", [
        req.params.id,
      ]);

      await client.query("DELETE FROM booking WHERE id = $1", [req.params.id]);

      const cacheKey = `locked_seats:${showtimeId}`;
      await redisClient.del(cacheKey);

      await client.query("COMMIT");
      res.json({ message: "Booking deleted" });
    } catch (err) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  };
};
