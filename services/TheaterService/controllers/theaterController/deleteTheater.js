module.exports = ({ pool }) => {
  return async (req, res) => {
    try {
      //fixed code
      // 1. Get gallery images first
      const galleryResult = await pool.query(
        "SELECT image_url FROM theater_galleries WHERE theater_id = $1",
        [req.params.id]
      );

      // 2. Delete theater (and gallery records via cascade)
      const result = await pool.query(
        "DELETE FROM theaters WHERE id = $1 RETURNING *",
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Theater not found" });
      }

      // 3. Delete physical files
      const path = require("path"); // Ensure path is imported
      for (const row of galleryResult.rows) {
        // Assuming image_url is relative like '/uploads/abc.jpg'
        const filename = row.image_url.split('/uploads/')[1];
        if (filename) {
          const filePath = path.join(__dirname, "..", "..", "uploads", filename);
          try {
            // Use fs promises or the util.promisify version injected
            await require('fs').promises.unlink(filePath);
          } catch (e) {
            console.error("Failed to delete image:", filePath);
          }
        }
      }

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Theater not found" });
      }

      res.json({ message: "Theater deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};
