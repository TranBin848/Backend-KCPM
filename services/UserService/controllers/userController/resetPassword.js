/**
 * Reset password using OTP
 * @param {Object} dependencies - { pool, bcrypt, otpStore }
 * @returns {Function} Express middleware handler
 */
module.exports = ({ pool, bcrypt, otpStore }) => {
  return async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({ error: "Email, OTP và mật khẩu mới là bắt buộc." });
    }

    const record = otpStore.get(email);
    if (!record)
      return res
        .status(400)
        .json({ error: "OTP không hợp lệ hoặc đã hết hạn." });

    if (record.expiresAt <= Date.now()) {
      otpStore.delete(email);
      return res.status(400).json({ error: "OTP đã hết hạn." });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ error: "OTP không chính xác." });
    }

    try {
      const userResult = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "Email không tồn tại." });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query("UPDATE users SET password = $1 WHERE email = $2", [
        hashedPassword,
        email,
      ]);

      otpStore.delete(email);

      res.json({ message: "Đặt lại mật khẩu thành công." });
    } catch (error) {
      res.status(500).json({
        error: "Lỗi server khi cập nhật mật khẩu: " + error.message,
      });
    }
  };
};
