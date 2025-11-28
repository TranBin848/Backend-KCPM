// Controller factory for Seat route handlers
// Exports a function that accepts dependencies and returns handler functions.
module.exports = ({ pool }) => {
  return {
    // API tạo ghế cho phòng chiếu đã có sẵn
    generateSeats: async (req, res) => {
      const { room_id, rows, columns } = req.body;

      if (!room_id || !rows || !columns || rows <= 0 || columns <= 0) {
        return res
          .status(400)
          .json({ error: "room_id, rows, columns không hợp lệ" });
      }

      try {
        // Bước 1: Xóa tất cả ghế cũ của phòng chiếu
        await pool.query(`DELETE FROM seats WHERE room_id = $1`, [room_id]);

        let seatQueries = [];

        // Bước 2: Tạo các ghế mới
        for (let row = 1; row <= rows; row++) {
          const rowLabel = String.fromCharCode(64 + row); // A, B, C, ...
          for (let col = 1; col <= columns; col++) {
            const seatNumber = `${rowLabel}${col}`; // A1, A2, ..., I12

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

        res
          .status(201)
          .json({ message: "Tạo ghế thành công cho phòng", room_id });
      } catch (error) {
        console.error("Lỗi khi tạo ghế:", error.message);
        res.status(500).json({ error: "Lỗi khi tạo ghế" });
      }
    },

    // GET /api/seats/:id - lấy thông tin chi tiết 1 ghế
    getSeatById: async (req, res) => {
      const { id } = req.params;

      try {
        const result = await pool.query(`SELECT * FROM seats WHERE id = $1`, [
          id,
        ]);

        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Không tìm thấy ghế" });
        }

        res.status(200).json(result.rows[0]);
      } catch (error) {
        console.error("Lỗi khi lấy thông tin ghế:", error.message);
        res.status(500).json({ error: "Không thể lấy thông tin ghế" });
      }
    },

    // GET /api/seats/room/:room_id
    getSeatsByRoom: async (req, res) => {
      const { room_id } = req.params;

      try {
        const result = await pool.query(
          `SELECT * FROM seats WHERE room_id = $1 ORDER BY row_label, column_index`,
          [room_id]
        );

        res.status(200).json({ seats: result.rows });
      } catch (error) {
        console.error("Lỗi khi lấy danh sách ghế:", error.message);
        res.status(500).json({ error: "Không thể lấy danh sách ghế" });
      }
    },

    // PUT /api/seats/:id/type
    updateSeatType: async (req, res) => {
      const { id } = req.params;
      const { type } = req.body;

      if (!["vip", "regular"].includes(type)) {
        return res.status(400).json({
          error: "Loại ghế không hợp lệ. Chỉ chấp nhận 'vip' hoặc 'regular'",
        });
      }

      try {
        const result = await pool.query(`SELECT * FROM seats WHERE id = $1`, [
          id,
        ]);
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Không tìm thấy ghế" });
        }

        await pool.query(`UPDATE seats SET type = $1 WHERE id = $2`, [
          type,
          id,
        ]);
        res.status(200).json({ message: `Đã chuyển ghế sang loại '${type}'` });
      } catch (error) {
        console.error("Lỗi khi cập nhật loại ghế:", error.message);
        res.status(500).json({ error: "Lỗi khi cập nhật loại ghế" });
      }
    },

    // PUT /api/seats/:id/status
    updateSeatStatus: async (req, res) => {
      const { id } = req.params;
      const { status } = req.body;

      if (status !== "inactive" && status !== "active") {
        return res.status(400).json({
          error:
            "Trạng thái ghế không hợp lệ. Chỉ chấp nhận 'active' hoặc 'inactive'",
        });
      }

      try {
        const result = await pool.query(`SELECT * FROM seats WHERE id = $1`, [
          id,
        ]);
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Không tìm thấy ghế" });
        }

        await pool.query(`UPDATE seats SET status = $1 WHERE id = $2`, [
          status,
          id,
        ]);

        res
          .status(200)
          .json({ message: `Đã cập nhật trạng thái ghế thành '${status}'` });
      } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái ghế:", error.message);
        res.status(500).json({ error: "Lỗi khi cập nhật trạng thái ghế" });
      }
    },
  };
};
