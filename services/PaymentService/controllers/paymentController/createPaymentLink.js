// POST /api/payments/payos - Tạo link thanh toán PayOS
const createPaymentLink = ({ payOS }) => {
  return async (req, res) => {
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
  };
};

module.exports = createPaymentLink;

