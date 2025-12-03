/**
 * User signup handler
 * @param {Object} dependencies - { pool, bcrypt }
 * @returns {Function} Express middleware handler
 */
module.exports = ({ pool, bcrypt }) => {
  return async (req, res) => {
    const { name, email, phone, gender, birthdate, password, role } = req.body;
    const finalRole = role || "user";

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        "INSERT INTO users(name, email, phone, gender, birthdate, password, role) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id",
        [name, email, phone, gender, birthdate, hashedPassword, finalRole]
      );
      res
        .status(201)
        .json({ message: "Signup successfully", userId: result.rows[0].id });
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
      res.status(500).json({ error: "Đăng ký thất bại. Vui lòng thử lại." });
    }
  };
};
