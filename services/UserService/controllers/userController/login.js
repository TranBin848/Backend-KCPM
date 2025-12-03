/**
 * User login handler
 * @param {Object} dependencies - { pool, bcrypt, jwt }
 * @returns {Function} Express middleware handler
 */
module.exports = ({ pool, bcrypt, jwt }) => {
  return async (req, res) => {
    const { email, password } = req.body;

    try {
      const result = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );
      const user = result.rows[0];

      if (!user)
        return res.status(401).json({ error: "Email không tồn tại!" });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: "Sai mật khẩu!" });

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "24h" }
      );
      res.json({
        message: "Login successfully",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          birthdate: user.birthdate,
          role: user.role,
          points: user.points,
          workplace: user.workplace || "",
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Error: " + error.message });
    }
  };
};
