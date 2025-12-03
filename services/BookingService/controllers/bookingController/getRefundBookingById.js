/**
 * Get refund_booking by id
 * @param {Object} dependencies - { pool }
 * @returns {Function} Express handler function
 */
module.exports = ({ pool }) => {
  return async (req, res) => {
    try {
      const refundId = req.params.id;
      const result = await pool.query(
        "SELECT * FROM refund_booking WHERE id = $1",
        [refundId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Refund record not found" });
      }

      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};
