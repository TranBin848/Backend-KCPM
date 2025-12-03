/**
 * Update only total_price of a booking by ID
 * @param {Object} dependencies - { pool }
 * @returns {Function} Express handler function
 */
module.exports = ({ pool }) => {
  return async (req, res) => {
    const bookingId = req.params.id;
    const { total_price } = req.body;

    if (total_price === undefined || isNaN(total_price)) {
      return res.status(400).json({ error: "Invalid or missing total_price" });
    }

    try {
      const result = await pool.query(
        `UPDATE booking 
       SET total_price = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 RETURNING *`,
        [total_price, bookingId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json({ message: "Total price updated", booking: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};
