/**
 * Get all employees
 * @param {Object} dependencies - { pool }
 * @returns {Function} Express middleware handler
 */
module.exports = ({ pool }) => {
  return async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT id, name, email, phone, gender, birthdate, role, identity_card, workplace FROM users WHERE role = 'employee' ORDER BY id"
      );
      res.json({ employees: result.rows });
    } catch (error) {
      res.status(500).json({
        error: "Lỗi server khi lấy danh sách nhân viên: " + error.message,
      });
    }
  };
};
