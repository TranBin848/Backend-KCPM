/**
 * Update booking status and handle Redis cache for seat locking
 * @param {Object} dependencies - { pool, redisClient }
 * @returns {Function} Express handler function
 */
module.exports = ({ pool, redisClient }) => {
  return async (req, res) => {
    const { status } = req.body;
    const validStatuses = ["PENDING", "PAID", "CANCELLED", "REFUND_REQUESTED"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Update booking status
      const result = await client.query(
        "UPDATE booking SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
        [status, req.params.id]
      );

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Booking not found" });
      }

      const updatedBooking = result.rows[0];

      // If PAID or CANCELLED, update Redis cache
      if (["PAID", "CANCELLED"].includes(status)) {
        const seatResult = await client.query(
          `SELECT seat_id FROM booking_seats WHERE booking_id = $1`,
          [req.params.id]
        );
        const seatIds = seatResult.rows.map((r) => r.seat_id);

        const showtimeId = updatedBooking.showtime_id;
        const cacheKey = `locked_seats:${showtimeId}`;

        const cached = await redisClient.get(cacheKey);
        if (cached) {
          const currentSeats = JSON.parse(cached);

          // Remove seats that were released
          const updatedSeats = currentSeats.filter(
            (id) => !seatIds.includes(id)
          );

          // For now just delete the cache key (existing behavior)
          await redisClient.del(cacheKey);
        }
      }

      await client.query("COMMIT");

      res.json(updatedBooking);
    } catch (err) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  };
};
