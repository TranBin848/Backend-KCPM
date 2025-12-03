/**
 * Get booking by ID (with seat_ids array)
 * @param {Object} dependencies - { pool }
 * @returns {Function} Express handler function
 */
module.exports = ({ pool }) => {
  return async (req, res) => {
    try {
      const bookingResult = await pool.query(
        "SELECT * FROM booking WHERE id = $1",
        [req.params.id]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const booking = bookingResult.rows[0];

      const seatsResult = await pool.query(
        "SELECT seat_id FROM booking_seats WHERE booking_id = $1",
        [booking.id]
      );

      booking.seat_ids = seatsResult.rows.map((r) => r.seat_id);

      res.json(booking);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};
