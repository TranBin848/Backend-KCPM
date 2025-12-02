const path = require("path");

/**
 * Create a new food item
 * Supports both JSON and multipart/form-data with image upload
 * @param {Object} dependencies - { Food }
 * @returns {Function} Express middleware handler
 */
module.exports = ({ Food }) => {
  return async (req, res) => {
    try {
      let foodData = {};

      // If sending form-data (multer parses req.body with text fields)
      if (req.body.data) {
        try {
          foodData = JSON.parse(req.body.data);
        } catch {
          return res
            .status(400)
            .json({ error: "Dữ liệu JSON trong 'data' không hợp lệ" });
        }
      } else {
        // If client sends raw JSON (application/json), req.body is already an object
        foodData = req.body;
      }

      // If there's an uploaded image
      if (req.file) {
        foodData.imageUrl = path.join("uploads", req.file.filename);
      }

      // Validate required fields
      if (!foodData.name || foodData.name.trim() === "") {
        return res
          .status(400)
          .json({ error: "Thiếu trường bắt buộc: name hoặc price" });
      }

      if (
        foodData.price === undefined ||
        foodData.price === null ||
        foodData.price === "" ||
        Number(foodData.price) <= 0
      ) {
        return res
          .status(400)
          .json({ error: "Thiếu trường bắt buộc: name hoặc price" });
      }

      const newFood = new Food(foodData);
      await newFood.save();

      res
        .status(201)
        .json({ message: "Thêm món ăn thành công", food: newFood });
    } catch (err) {
      res
        .status(400)
        .json({ error: "Lỗi khi thêm món ăn", details: err.message });
    }
  };
};
