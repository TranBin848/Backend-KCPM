// Xóa ưu đãi
const deletePromotion = ({ Promotion }) => {
  return async (req, res) => {
    try {
      const deleted = await Promotion.findByIdAndDelete(req.params.id);
      if (!deleted)
        return res
          .status(404)
          .json({ error: "Không tìm thấy ưu đãi để xóa" });

      res.json({ message: "Xóa ưu đãi thành công" });
    } catch (err) {
      res
        .status(400)
        .json({ error: "Lỗi khi xóa ưu đãi", details: err.message });
    }
  };
};

module.exports = deletePromotion;

