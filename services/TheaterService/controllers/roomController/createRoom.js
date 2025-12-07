module.exports = ({ pool }) => {
  return async (req, res) => {
    const { room_name, theater_id, room_type } = req.body;

    if (!room_name || !theater_id || !room_type) {
      return res
        .status(400)
        .json({ error: "Thiếu room_name, theater_id hoặc room_type" });
    }

    try {
      const existingRoom = await pool.query(
        `SELECT 1 FROM rooms WHERE theater_id = $1 AND room_name = $2`,
        [theater_id, room_name]
      );

      if (existingRoom.rows.length > 0) {
        return res
          .status(409)
          .json({ error: "Tên phòng đã tồn tại trong rạp này" });
      }

      const roomResult = await pool.query(
        `INSERT INTO rooms (theater_id, room_name, room_type) 
         VALUES ($1, $2, $3) RETURNING id`,
        [theater_id, room_name, room_type]
      );

      res.status(201).json({
        message: "Tạo phòng chiếu thành công",
        roomId: roomResult.rows[0].id,
      });
    } catch (error) {
      console.error("Lỗi khi tạo phòng:", error.message);
      res.status(500).json({ error: "Lỗi khi tạo phòng chiếu" });
    }
  };
};
