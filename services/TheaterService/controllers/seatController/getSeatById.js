module.exports = ({ pool }) => {
  return async (req, res) => {
    const { id } = req.params;

    try {
      //fixed code
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID ghế phải là số" });
      }
      const result = await pool.query(`SELECT * FROM seats WHERE id = $1`, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy ghế" });
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin ghế:", error.message);
      res.status(500).json({ error: "Không thể lấy thông tin ghế" });
    }
  };
};
