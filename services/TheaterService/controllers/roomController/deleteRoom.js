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

      await pool.query(`DELETE FROM rooms WHERE id = $1`, [roomId]);

      res.status(200).json({ message: "Xóa phòng chiếu thành công" });
    } catch (error) {
      console.error("Lỗi khi xóa phòng:", error.message);
      res.status(500).json({ error: "Lỗi khi xóa phòng chiếu" });
    }
  };
};
