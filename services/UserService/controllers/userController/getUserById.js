/**
 * Get user by ID
 * @param {Object} dependencies - { pool }
 * @returns {Function} Express middleware handler
 */
module.exports = ({ pool }) => {
  return async (req, res) => {
    const userId = req.params.id;

    try {
      const result = await pool.query(
        "SELECT id, name, email, phone, gender, birthdate, role, points, rank FROM users WHERE id = $1",
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User không tồn tại" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: "Lỗi server: " + error.message });
    }
  };
};
