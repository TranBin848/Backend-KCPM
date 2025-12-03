/**
 * Get all refund_booking records
 * @param {Object} dependencies - { pool }
 * @returns {Function} Express handler function
 */
module.exports = ({ pool }) => {
  return async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM refund_booking ORDER BY id DESC"
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};
