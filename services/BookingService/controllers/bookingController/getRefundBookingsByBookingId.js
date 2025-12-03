/**
 * Get refund_booking by booking_id
 * @param {Object} dependencies - { pool }
 * @returns {Function} Express handler function
 */
module.exports = ({ pool }) => {
  return async (req, res) => {
    try {
      const bookingId = req.params.bookingId;
      const result = await pool.query(
        "SELECT * FROM refund_booking WHERE booking_id = $1",
        [bookingId]
      );

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Refund record not found for this booking" });
      }

      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};
