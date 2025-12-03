/**
 * Get all users with role 'user'
 * @param {Object} dependencies - { pool }
 * @returns {Function} Express middleware handler
 */
module.exports = ({ pool }) => {
  return async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT id, name, email, phone, gender, birthdate, role, points, rank
         FROM users
         WHERE role = 'user'
         ORDER BY id ASC`
      );

      res.json(result.rows);
    } catch (error) {
      res.status(500).json({
        error: "Lỗi server khi lấy danh sách user: " + error.message,
      });
    }
  };
};
