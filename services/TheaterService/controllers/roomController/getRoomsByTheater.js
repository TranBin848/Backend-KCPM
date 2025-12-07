module.exports = ({ pool }) => {
  return async (req, res) => {
    const { theaterId } = req.params;

    try {
      const result = await pool.query(
        `SELECT r.id, r.room_name, r.room_type, t.name 
         FROM rooms r
         JOIN theaters t ON r.theater_id = t.id
         WHERE r.theater_id = $1`,
        [theaterId]
      );

      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách phòng:", error.message);
      res.status(500).json({ error: "Lỗi khi lấy danh sách phòng chiếu" });
    }
  };
};
