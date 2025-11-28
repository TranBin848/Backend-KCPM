// Controller factory for PaymentService route handlers
// Exports a function that accepts dependencies and returns handler functions.
module.exports = ({ payOS, poolUsers, poolBookings }) => {
  return {
    // POST /api/payments/payos - Tạo link thanh toán PayOS
    createPaymentLink: async (req, res) => {
      const { paymentCode, amount } = req.body;

      if (!paymentCode || !amount) {
        return res.status(400).json({ error: "Thiếu thông tin yêu cầu" });
      }

      const returnUrl = `${
        process.env.RETURN_URL || "http://localhost:3000"
      }/payment-success`;
      const cancelUrl = `${process.env.RETURN_URL || "http://localhost:3000"}/`;

      const body = {
        orderCode: Number(String(Date.now()).slice(-6)),
        amount,
        description: "Thanh toán vé",
        returnUrl,
        cancelUrl,
      };

      try {
        const paymentLinkResponse = await payOS.createPaymentLink(body);
        res.status(200).json({
          checkoutUrl: paymentLinkResponse.checkoutUrl,
        });
      } catch (err) {
        console.error("Lỗi tạo link thanh toán:", err);
        res.status(500).json({ error: "Không thể tạo link thanh toán" });
      }
    },

    // POST /api/payments/success - Xác nhận thanh toán thành công
    confirmPaymentSuccess: async (req, res) => {
      const { bookingId, userId, usedPoints = 0, foodBookingId } = req.body;

      if (!bookingId || !userId) {
        return res
          .status(400)
          .json({ error: "Thiếu thông tin xác nhận thanh toán" });
      }

      try {
        // 1. Lấy số tiền đã thanh toán từ booking
        const bookingResult = await poolBookings.query(
          `SELECT total_price FROM booking WHERE id = $1`,
          [bookingId]
        );

        if (bookingResult.rowCount === 0) {
          return res.status(404).json({ error: "Booking không tồn tại" });
        }

        let amount = Number(bookingResult.rows[0].total_price) || 0;

        if (foodBookingId) {
          const foodResult = await poolBookings.query(
            `SELECT total_price FROM food_booking WHERE id = $1`,
            [foodBookingId]
          );

          if (foodResult.rowCount === 0) {
            return res.status(404).json({ error: "Food booking không tồn tại" });
          }

          const foodPrice = Number(foodResult.rows[0].total_price) || 0;

          amount += foodPrice;

          await poolBookings.query(
            `UPDATE food_booking SET status = 'PAID' WHERE id = $1`,
            [foodBookingId]
          );
        }

        // 3. Cập nhật trạng thái booking thành PAID
        await poolBookings.query(
          `UPDATE booking SET status = 'PAID' WHERE id = $1`,
          [bookingId]
        );

        // 4. Tính điểm thưởng (5% trên số tiền thực trả)
        const earnedPoints = Math.round((amount / 1000) * 0.05) || 0;

        // 5. Cập nhật điểm user
        await poolUsers.query(
          `UPDATE users SET points = points + $1 - $2 WHERE id = $3`,
          [earnedPoints, usedPoints, userId]
        );

        res.status(200).json({
          message: "Thanh toán và cập nhật điểm thành công",
          earnedPoints,
          totalPaid: amount,
        });
      } catch (error) {
        console.error("Lỗi khi xác nhận thanh toán:", error);
        res.status(500).json({ error: "Lỗi máy chủ khi cập nhật thanh toán" });
      }
    },
  };
};
