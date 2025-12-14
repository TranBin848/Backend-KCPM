const path = require("path");
const util = require("util");
const fs = require("fs");
const unlinkFile = util.promisify(fs.unlink);

module.exports = ({ pool }) => {
  return async (req, res) => {
    try {
      const data = JSON.parse(req.body.data);
      const {
        name,
        latitude,
        longitude,
        status,
        address,
        hotline,
        deletedImages,
      } = data;

      const result = await pool.query(
        `UPDATE theaters SET 
          name = $1, latitude = $2, longitude = $3,
          status = $4, address = $5, hotline = $6,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $7 RETURNING *`,
        [
          name,
          latitude,
          longitude,
          status,
          address,
          hotline,
          req.params.id,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Theater not found" });
      }

      const theaterId = req.params.id;

      // ==== DELETE OLD IMAGES ====
      if (deletedImages && deletedImages.length > 0) {
        for (const url of deletedImages) {
          //fixed code
          const relativePath = url.substring(url.indexOf("/uploads/")); 

          await pool.query(
            "DELETE FROM theater_galleries WHERE theater_id = $1 AND image_url = $2",
            [
              theaterId,
              relativePath // Dùng biến này an toàn hơn
            ]
          );

          // await pool.query(
          //   "DELETE FROM theater_galleries WHERE theater_id = $1 AND image_url = $2",
          //   [
          //     theaterId,
          //     url.replace("http://localhost:8080/theaters", ""),
          //   ]
          // );

          const filePath = path.join(
            __dirname,
            "..",
            "..",
            "uploads",
            url.split("/uploads/")[1]
          );

          try {
            await unlinkFile(filePath);
          } catch (err) {
            console.error("Không thể xóa ảnh:", filePath, err);
          }
        }
      }

      // ==== INSERT NEW IMAGES ====
      if (req.files && req.files.length > 0) {
        const queries = req.files.map((file) =>
          pool.query(
            `INSERT INTO theater_galleries (theater_id, image_url)
             VALUES ($1, $2)`,
            [theaterId, `/uploads/${file.filename}`]
          )
        );
        await Promise.all(queries);
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error("Lỗi update rạp:", err);
      res.status(500).json({ error: "Cập nhật rạp thất bại." });
    }
  };
};
