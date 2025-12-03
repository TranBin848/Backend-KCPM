/**
 * Create new booking with seats and cache locked seats in Redis
 * @param {Object} dependencies - { pool, redisClient }
 * @returns {Function} Express handler function
 */
module.exports = ({ pool, redisClient }) => {
  return async (req, res) => {
    const { user_id, showtime_id, room_id, seat_ids, total_price, movie_id } =
      req.body;

    if (
      !user_id ||
      !showtime_id ||
      !room_id ||
      !seat_ids ||
      !Array.isArray(seat_ids) ||
      seat_ids.length === 0 ||
      total_price === undefined ||
      total_price === null ||
      !movie_id
    ) {
      return res
        .status(400)
        .json({ error: "Missing or invalid required fields" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const insertBookingText = `
      INSERT INTO booking (user_id, showtime_id, room_id, movie_id, total_price, status)
      VALUES ($1, $2, $3, $4, $5, 'PENDING') RETURNING id
    `;
      const bookingResult = await client.query(insertBookingText, [
        user_id,
        showtime_id,
        room_id,
        movie_id,
        total_price,
      ]);
      const bookingId = bookingResult.rows[0].id;

      const insertSeatText =
        "INSERT INTO booking_seats (booking_id, seat_id) VALUES ($1, $2)";
      for (const seatId of seat_ids) {
        await client.query(insertSeatText, [bookingId, seatId]);
      }

      await client.query("COMMIT");

      // Cache locked seats in Redis (TTL 600 seconds)
      try {
        const cacheKey = `locked_seats:${showtime_id}`;
        const existingCache = await redisClient.get(cacheKey);
        let currentLockedSeats = [];

        if (existingCache) {
          currentLockedSeats = JSON.parse(existingCache);
        }

        const updatedLockedSeats = [
          ...new Set([...currentLockedSeats, ...seat_ids]),
        ];

        await redisClient.setEx(
          cacheKey,
          600,
          JSON.stringify(updatedLockedSeats)
        );
      } catch (redisErr) {
        // Log Redis error but don't fail the booking
        console.error("Redis cache error:", redisErr.message);
      }

      res
        .status(201)
        .json({ message: "Booking created", booking_id: bookingId });
    } catch (err) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  };
};
