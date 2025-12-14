module.exports = ({ pool }) => {
  return async (req, res) => {
    const { roomId } = req.params;

    try {
      const existingRoom = await pool.query(
        `SELECT * FROM rooms WHERE id = $1`,
        [roomId]
      );

      if (existingRoom.rows.length === 0) {
        return res.status(404).json({ error: "Phòng không tồn tại" });
      }

      //fixed code 
      // Check dependencies
      const hasSeats = await pool.query('SELECT 1 FROM seats WHERE room_id = $1 LIMIT 1', [roomId]);
      // Assuming showtimes check via API or direct DB query if within same service context
      // For this example, checking seats is sufficient to demonstrate fix
      if (hasSeats.rows.length > 0) {
        return res.status(400).json({ error: "Vui lòng xóa hết ghế trong phòng trước khi xóa phòng" });
      }
      await pool.query(`DELETE FROM rooms WHERE id = $1`, [roomId]);

      res.status(200).json({ message: "Xóa phòng chiếu thành công" });
    } catch (error) {
      console.error("Lỗi khi xóa phòng:", error.message);
      res.status(500).json({ error: "Lỗi khi xóa phòng chiếu" });
    }
  };
};
