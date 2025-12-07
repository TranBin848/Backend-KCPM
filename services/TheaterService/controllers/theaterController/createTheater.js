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
        city,
        district,
        address,
        hotline,
      } = data;

      const result = await pool.query(
        `INSERT INTO theaters (name, latitude, longitude, status, city, district, address, hotline)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          name,
          latitude || 0,
          longitude || 0,
          status || "active",
          city,
          district,
          address,
          hotline,
        ]
      );

      const theaterId = result.rows[0].id;

      // Insert gallery
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

      res.status(201).json(result.rows[0]);
    } catch (error) {
      // cleanup uploaded images (trash files)
      if (req.files) {
        for (const file of req.files) {
          try {
            await unlinkFile(file.path);
          } catch {}
        }
      }

      if (error.code === "23505") {
        return res.status(400).json({
          error: "Tên rạp đã tồn tại. Vui lòng chọn tên khác.",
        });
      }

      res.status(500).json({
        error: "Thêm rạp thất bại. Vui lòng thử lại.",
      });
    }
  };
};
