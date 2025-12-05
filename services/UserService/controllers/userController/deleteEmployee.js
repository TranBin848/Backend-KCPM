/**
 * Delete employee
 * @param {Object} dependencies - { pool }
 * @returns {Function} Express middleware handler
 */
module.exports = ({ pool }) => {
  return async (req, res) => {
    const employeeId = parseInt(req.params.id);

    try {
      const result = await pool.query(
        "DELETE FROM users WHERE id = $1 AND role = 'employee'",
        [employeeId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error: "Nhân viên không tồn tại hoặc không phải nhân viên",
        });
      }

      res.json({ message: "Xóa nhân viên thành công" });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Lỗi server khi xóa nhân viên: " + error.message });
    }
  };
};
