/**
 * Send OTP to email for password reset
 * @param {Object} dependencies - { pool, otpStore, sendEmail }
 * @returns {Function} Express middleware handler
 */
module.exports = ({ pool, otpStore, sendEmail }) => {
  return async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email là bắt buộc." });

    try {
      const userResult = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "Email không tồn tại." });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore.set(email, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

      const subject = "Mã OTP đặt lại mật khẩu của bạn";
      const text = `Mã OTP của bạn là: ${otp}. Mã có hiệu lực trong 5 phút. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.`;

      await sendEmail(email, subject, text);

      res.json({ message: "OTP đã được gửi đến email." });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Lỗi server khi gửi OTP: " + error.message });
    }
  };
};
