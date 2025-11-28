const path = require("path");
const util = require("util");
const fs = require("fs");
const unlinkFile = util.promisify(fs.unlink);

// Controller factory for Theater route handlers
// Exports a function that accepts dependencies and returns handler functions.
module.exports = ({ pool }) => {
  return {
    // Get all theaters
    getAllTheaters: async (req, res) => {
      try {
        const result = await pool.query(
          "SELECT * FROM theaters ORDER BY id DESC"
        );
        res.json(result.rows);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    // Get single theater by ID
    getTheaterById: async (req, res) => {
      try {
        const result = await pool.query(
          "SELECT * FROM theaters WHERE id = $1",
          [req.params.id]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ message: "Theater not found" });
        }
        res.json(result.rows[0]);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    // Get all gallery images by theater ID
    getTheaterGallery: async (req, res) => {
      try {
        const result = await pool.query(
          `SELECT id, image_url FROM theater_galleries WHERE theater_id = $1 ORDER BY id DESC`,
          [req.params.id]
        );
        res.json(result.rows);
      } catch (err) {
        res.status(500).json({ error: "Lỗi khi lấy ảnh gallery." });
      }
    },

    // Create new theater
    createTheater: async (req, res) => {
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

        if (req.files && req.files.length > 0) {
          const galleryQueries = req.files.map((file) => {
            const imageUrl = `/uploads/${file.filename}`;
            return pool.query(
              `INSERT INTO theater_galleries (theater_id, image_url)
               VALUES ($1, $2)`,
              [theaterId, imageUrl]
            );
          });
          await Promise.all(galleryQueries);
        }

        res.status(201).json(result.rows[0]);
      } catch (error) {
        // Nếu có ảnh đã được upload, xóa chúng đi (ảnh rác)
        if (req.files && req.files.length > 0) {
          for (const file of req.files) {
            try {
              await unlinkFile(file.path);
            } catch (deleteErr) {
              console.error(
                "Không thể xoá ảnh rác:",
                file.filename,
                deleteErr
              );
            }
          }
        }

        if (error.code === "23505") {
          res
            .status(400)
            .json({ error: "Tên rạp đã tồn tại. Vui lòng chọn tên khác." });
        } else {
          res
            .status(500)
            .json({ error: "Thêm rạp thất bại. Vui lòng thử lại." });
        }
      }
    },

    // Update theater
    updateTheater: async (req, res) => {
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

        // Cập nhật thông tin rạp
        const result = await pool.query(
          `UPDATE theaters SET 
            name = $1, latitude = $2, longitude = $3, 
            status = $4, address = $5, hotline = $6, 
            updated_at = CURRENT_TIMESTAMP 
           WHERE id = $7 RETURNING *`,
          [name, latitude, longitude, status, address, hotline, req.params.id]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ message: "Theater not found" });
        }

        const theaterId = req.params.id;

        if (deletedImages && deletedImages.length > 0) {
          for (const imageUrl of deletedImages) {
            await pool.query(
              "DELETE FROM theater_galleries WHERE theater_id = $1 AND image_url = $2",
              [
                theaterId,
                imageUrl.replace("http://localhost:8080/theaters", ""),
              ]
            );

            const filePath = path.join(
              __dirname,
              "..",
              "uploads",
              imageUrl
                .replace("http://localhost:8080/theaters", "")
                .replace("/uploads/", "")
            );

            try {
              await unlinkFile(filePath);
              console.log(`Đã xóa ảnh: ${filePath}`);
            } catch (err) {
              console.error(`Không thể xóa ảnh ${filePath}:`, err);
            }
          }
        }

        // Thêm ảnh mới nếu có
        if (req.files && req.files.length > 0) {
          const insertGalleryQueries = req.files.map((file) => {
            const imageUrl = `/uploads/${file.filename}`;
            return pool.query(
              `INSERT INTO theater_galleries (theater_id, image_url) VALUES ($1, $2)`,
              [theaterId, imageUrl]
            );
          });
          await Promise.all(insertGalleryQueries);
        }

        res.json(result.rows[0]);
      } catch (err) {
        console.error("Lỗi update rạp:", err);
        res.status(500).json({ error: "Cập nhật rạp thất bại." });
      }
    },

    // Delete theater
    deleteTheater: async (req, res) => {
      try {
        const result = await pool.query(
          "DELETE FROM theaters WHERE id = $1 RETURNING *",
          [req.params.id]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ message: "Theater not found" });
        }
        res.json({ message: "Theater deleted" });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },
  };
};
