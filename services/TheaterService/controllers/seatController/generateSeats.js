module.exports = ({ pool }) => {
  return async (req, res) => {
    const { room_id, rows, columns } = req.body;

    if (!room_id || !rows || !columns || rows <= 0 || columns <= 0) {
      return res
        .status(400)
        .json({ error: "room_id, rows, columns không hợp lệ" });
    }

    try {
      //fixed code
      // Check room existence first
      const roomCheck = await pool.query('SELECT 1 FROM rooms WHERE id = $1', [room_id]);
      if (roomCheck.rows.length === 0) {
        return res.status(404).json({ error: "Phòng chiếu không tồn tại" });
      }
      
      // Xóa ghế cũ
      await pool.query(`DELETE FROM seats WHERE room_id = $1`, [room_id]);

      let seatQueries = [];

      // Tạo ghế
      for (let row = 1; row <= rows; row++) {
        const rowLabel = String.fromCharCode(64 + row);
        for (let col = 1; col <= columns; col++) {
          const seatNumber = `${rowLabel}${col}`;

          seatQueries.push(
            pool.query(
              `INSERT INTO seats (room_id, seat_number, row_label, column_index)
               VALUES ($1, $2, $3, $4)`,
              [room_id, seatNumber, rowLabel, col]
            )
          );
        }
      }

      await Promise.all(seatQueries);

      res.status(201).json({
        message: "Tạo ghế thành công cho phòng",
        room_id,
      });
    } catch (error) {
      console.error("Lỗi khi tạo ghế:", error.message);
      res.status(500).json({ error: "Lỗi khi tạo ghế" });
    }
  };
};
