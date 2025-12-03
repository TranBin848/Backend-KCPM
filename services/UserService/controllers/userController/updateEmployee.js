/**
 * Update employee information
 * @param {Object} dependencies - { pool }
 * @returns {Function} Express middleware handler
 */
module.exports = ({ pool }) => {
  return async (req, res) => {
    const employeeId = parseInt(req.params.id);
    const {
      name,
      email,
      phone,
      gender,
      birthdate,
      identity_card,
      workplace,
    } = req.body;

    try {
      const result = await pool.query(
        `UPDATE users SET name=$1, email=$2, phone=$3, gender=$4, birthdate=$5, identity_card=$6, workplace=$7
         WHERE id=$8 AND role='employee'
         RETURNING id, name, email, phone, gender, birthdate, role, identity_card, workplace`,
        [
          name,
          email,
          phone,
          gender,
          birthdate,
          identity_card,
          workplace,
          employeeId,
        ]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error: "Nhân viên không tồn tại hoặc không phải nhân viên",
        });
      }

      res.json({
        message: "Cập nhật nhân viên thành công",
        employee: result.rows[0],
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
      res.status(500).json({
        error: "Lỗi server khi cập nhật nhân viên: " + error.message,
      });
    }
  };
};
