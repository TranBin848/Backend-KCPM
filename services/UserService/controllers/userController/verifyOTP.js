/**
 * Verify OTP code
 * @param {Object} dependencies - { otpStore }
 * @returns {Function} Express middleware handler
 */
module.exports = ({ otpStore }) => {
  return (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ error: "Email và OTP là bắt buộc." });

    const record = otpStore.get(email);
    if (!record)
      return res
        .status(400)
        .json({ error: "OTP không hợp lệ hoặc đã hết hạn." });

    if (record.expiresAt < Date.now()) {
      otpStore.delete(email);
      return res.status(400).json({ error: "OTP đã hết hạn." });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ error: "OTP không chính xác." });
    }

    res.json({ message: "Xác thực OTP thành công." });
  };
};
