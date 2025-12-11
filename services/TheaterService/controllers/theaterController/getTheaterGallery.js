module.exports = ({ pool }) => {
  return async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT id, image_url FROM theater_galleries 
         WHERE theater_id = $1 ORDER BY id DESC`,
        [req.params.id]
      );

      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Lỗi khi lấy ảnh gallery." });
    }
  };
};
