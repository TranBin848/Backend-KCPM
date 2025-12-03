/**
 * Create new employee
 * @param {Object} dependencies - { pool, bcrypt }
 * @returns {Function} Express middleware handler
 */
module.exports = ({ pool, bcrypt }) => {
  return async (req, res) => {
    const {
      name,
      email,
      phone,
      gender,
      birthdate,
      password,
      role,
      identity_card,
      workplace,
    } = req.body;

    if (role !== "employee") {
      return res
        .status(400)
        .json({ error: "Chỉ được tạo tài khoản với role là employee" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        `INSERT INTO users (name, email, phone, gender, birthdate, password, role, identity_card, workplace)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, name, email, phone, gender, birthdate, role, identity_card, workplace`,
        [
          name,
          email,
          phone,
          gender,
          birthdate,
          hashedPassword,
          role,
          identity_card,
          workplace,
        ]
      );

      res.status(201).json({
        message: "Tạo nhân viên thành công",
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
      res
        .status(500)
        .json({ error: "Lỗi server khi tạo nhân viên: " + error.message });
    }
  };
};
