module.exports = ({ pool }) => {
  return async (req, res) => {
    const { roomId } = req.params;
    const { room_name, room_type } = req.body;


    // if (!room_name || !room_type) {
    //   return res
    //     .status(400)
    //     .json({ error: "Thiếu room_name hoặc room_type" });
    // }

    //fixed code
    // Remove the strict check if (!room_name || !room_type)
    // Build dynamic query
    const fields = [];
    const values = [];
    let idx = 1;

    if (room_name) {
      fields.push(`room_name = $${idx++}`);
      values.push(room_name);
    }
    if (room_type) {
      fields.push(`room_type = $${idx++}`);
      values.push(room_type);
    }
    // Add updated_at
    fields.push(`updated_at = NOW()`);

    try {
      const existingRoom = await pool.query(
        `SELECT * FROM rooms WHERE id = $1`,
        [roomId]
      );

      if (existingRoom.rows.length === 0) {
        return res.status(404).json({ error: "Phòng không tồn tại" });
      }

      //fixed code
      // Get theater_id from existing room first
      const theaterId = existingRoom.rows[0].theater_id;

      // Check duplicate excluding current room
      const duplicateCheck = await pool.query(
        `SELECT 1 FROM rooms WHERE theater_id = $1 AND room_name = $2 AND id != $3`,
        [theaterId, room_name, roomId]
      );

      if (duplicateCheck.rows.length > 0) {
        return res.status(409).json({ error: "Tên phòng đã tồn tại trong rạp này" });
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
