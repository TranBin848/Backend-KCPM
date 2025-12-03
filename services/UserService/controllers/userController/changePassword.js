/**
 * Change user password
 * @param {Object} dependencies - { pool, bcrypt }
 * @returns {Function} Express middleware handler
 */
module.exports = ({ pool, bcrypt }) => {
  return async (req, res) => {
    const userId = parseInt(req.params.id);
    const { oldPassword, newPassword } = req.body;

    if (req.user.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền thay đổi mật khẩu này." });
    }

    try {
      const result = await pool.query(
        "SELECT password FROM users WHERE id = $1",
        [userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Người dùng không tồn tại." });
      }

      const user = result.rows[0];
      const match = await bcrypt.compare(oldPassword, user.password);
      if (!match) {
        return res.status(400).json({ error: "Mật khẩu cũ không đúng." });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
        hashedNewPassword,
        userId,
      ]);

      res.json({ message: "Đổi mật khẩu thành công." });
    } catch (error) {
      res.status(500).json({ error: "Lỗi server: " + error.message });
    }
  };
};
