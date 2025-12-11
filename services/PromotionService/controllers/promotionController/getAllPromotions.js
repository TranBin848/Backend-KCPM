// Lấy danh sách tất cả ưu đãi
const getAllPromotions = ({ Promotion }) => {
  return async (req, res) => {
    try {
      const promotions = await Promotion.find();
      res.json(promotions);
    } catch (err) {
      res.status(500).json({ error: "Lỗi lấy danh sách ưu đãi" });
    }
  };
};

module.exports = getAllPromotions;

