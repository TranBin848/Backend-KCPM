/**
 * Update user information
 * @param {Object} dependencies - { pool }
 * @returns {Function} Express middleware handler
 */
module.exports = ({ pool }) => {
  return async (req, res) => {
    const userId = parseInt(req.params.id);
    const { name, email, phone, gender, birthdate } = req.body;

    try {
      const result = await pool.query(
        `UPDATE users 
         SET name = $1, email = $2, phone = $3, gender = $4, birthdate = $5 
         WHERE id = $6 
         RETURNING id, name, email, phone, gender, birthdate, role, points, rank`,
        [name, email, phone, gender, birthdate, userId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Người dùng không tồn tại." });
      }

      res.json({
        message: "Cập nhật thông tin người dùng thành công.",
        user: result.rows[0],
      });
    } catch (error) {
      if (error.code === "23505") {
        if (error.detail.includes("email")) {
          return res.status(400).json({ error: "Email đã được sử dụng." });
        } else if (error.detail.includes("phone")) {
          return res
            .status(400)
            .json({ error: "Số điện thoại đã được sử dụng." });
        }
      }
      res.status(500).json({ error: "Lỗi khi cập nhật: " + error.message });
    }
  };
};
