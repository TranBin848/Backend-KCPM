module.exports = ({ pool }) => {
  return async (req, res) => {
    const { roomId } = req.params;
    const { room_name, room_type } = req.body;

    if (!room_name || !room_type) {
      return res
        .status(400)
        .json({ error: "Thiếu room_name hoặc room_type" });
    }

    try {
      const existingRoom = await pool.query(
        `SELECT * FROM rooms WHERE id = $1`,
        [roomId]
      );

      if (existingRoom.rows.length === 0) {
        return res.status(404).json({ error: "Phòng không tồn tại" });
      }

      await pool.query(
        `UPDATE rooms 
         SET room_name = $1, room_type = $2, updated_at = NOW() 
         WHERE id = $3`,
        [room_name, room_type, roomId]
      );

      res.status(200).json({ message: "Cập nhật phòng thành công" });
    } catch (error) {
      console.error("Lỗi khi cập nhật phòng:", error.message);
      res.status(500).json({ error: "Lỗi khi cập nhật phòng chiếu" });
    }
  };
};
