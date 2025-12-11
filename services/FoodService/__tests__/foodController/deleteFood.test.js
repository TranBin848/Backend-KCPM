const deleteFood = require("../../controllers/foodController/deleteFood");

describe("deleteFood", () => {
  let mockFood;
  let handler;
  let mockReq;
  let mockRes;

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  beforeEach(() => {
    // Mock Food model
    mockFood = {
      findByIdAndDelete: jest.fn(),
    };

    // Create handler
    handler = deleteFood({ Food: mockFood });

    // Mock request and response
    mockReq = {
      params: {},
    };

    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Success cases", () => {
    it("should delete food successfully with valid ID", async () => {
      const deletedFood = {
        _id: "507f1f77bcf86cd799439011",
        name: "Popcorn",
        price: 50000,
      };

      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockFood.findByIdAndDelete.mockResolvedValue(deletedFood);

      await handler(mockReq, mockRes);

      expect(mockFood.findByIdAndDelete).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Xóa món ăn thành công",
      });
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should delete food with all fields populated", async () => {
      const deletedFood = {
        _id: "507f1f77bcf86cd799439011",
        name: "Combo Set",
        price: 150000,
        description: "Full combo",
        imageUrl: "uploads/combo.jpg",
        isAvailable: true,
      };

      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockFood.findByIdAndDelete.mockResolvedValue(deletedFood);

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Xóa món ăn thành công",
      });
    });

    it("should delete food that is not available", async () => {
      const deletedFood = {
        _id: "507f1f77bcf86cd799439011",
        name: "Discontinued Item",
        price: 40000,
        isAvailable: false,
      };

      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockFood.findByIdAndDelete.mockResolvedValue(deletedFood);

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Xóa món ăn thành công",
      });
    });
  });

  describe("Not found cases", () => {
    it("should return 404 when food is not found", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockFood.findByIdAndDelete.mockResolvedValue(null);

      await handler(mockReq, mockRes);

      expect(mockFood.findByIdAndDelete).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Không tìm thấy món ăn để xóa",
      });
    });

    it("should return 404 when food was already deleted", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockFood.findByIdAndDelete.mockResolvedValue(null);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should return 404 for non-existent ID", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439999";
      mockFood.findByIdAndDelete.mockResolvedValue(null);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Không tìm thấy món ăn để xóa",
      });
    });
  });

  describe("Error cases", () => {
    it("should return 400 when database delete fails", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockFood.findByIdAndDelete.mockRejectedValue(new Error("Database error"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi xóa món ăn",
        details: "Database error",
      });
    });

    it("should return 400 for connection timeout", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockFood.findByIdAndDelete.mockRejectedValue(
        new Error("Connection timeout")
      );

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi xóa món ăn",
        details: "Connection timeout",
      });
    });

    it("should return 400 for database unavailable", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockFood.findByIdAndDelete.mockRejectedValue(
        new Error("Database unavailable")
      );

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi xóa món ăn",
        details: "Database unavailable",
      });
    });

    it("should handle foreign key constraint errors", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      const constraintError = new Error(
        "Cannot delete: referenced by other documents"
      );
      constraintError.code = 11000;

      mockFood.findByIdAndDelete.mockRejectedValue(constraintError);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi xóa món ăn",
        details: "Cannot delete: referenced by other documents",
      });
    });

    it("should handle network errors", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockFood.findByIdAndDelete.mockRejectedValue(new Error("Network error"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Edge cases", () => {
    it("should handle deletion with invalid but passed ObjectId", async () => {
      // This tests the case where ID format is valid but doesn't exist
      mockReq.params.id = "000000000000000000000000";
      mockFood.findByIdAndDelete.mockResolvedValue(null);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should handle concurrent deletion attempts", async () => {
      // Simulates race condition where item is deleted between request and execution
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockFood.findByIdAndDelete.mockResolvedValue(null);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should handle deletion of food with image", async () => {
      const deletedFood = {
        _id: "507f1f77bcf86cd799439011",
        name: "Food with Image",
        price: 50000,
        imageUrl: "uploads/food-123.jpg",
      };

      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockFood.findByIdAndDelete.mockResolvedValue(deletedFood);

      await handler(mockReq, mockRes);

      // Note: Current implementation doesn't delete image file
      // This is a potential enhancement point
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Xóa món ăn thành công",
      });
    });

    it("should not validate ObjectId format (lets Mongoose handle it)", async () => {
      // Controller doesn't validate ID format, unlike getFoodById
      mockReq.params.id = "invalid-id-format";
      mockFood.findByIdAndDelete.mockRejectedValue(
        new Error("Cast to ObjectId failed")
      );

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi xóa món ăn",
        details: "Cast to ObjectId failed",
      });
    });

    it("should handle empty string ID", async () => {
      mockReq.params.id = "";
      mockFood.findByIdAndDelete.mockRejectedValue(
        new Error("Cast to ObjectId failed")
      );

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should handle null ID", async () => {
      mockReq.params.id = null;
      mockFood.findByIdAndDelete.mockRejectedValue(
        new Error("Cast to ObjectId failed")
      );

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should handle undefined ID", async () => {
      mockReq.params.id = undefined;
      mockFood.findByIdAndDelete.mockRejectedValue(
        new Error("Cast to ObjectId failed")
      );

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Security cases", () => {
    it("should handle SQL injection attempt in ID", async () => {
      mockReq.params.id = "'; DROP TABLE foods; --";
      mockFood.findByIdAndDelete.mockRejectedValue(
        new Error("Cast to ObjectId failed")
      );

      await handler(mockReq, mockRes);

      // MongoDB/Mongoose will safely handle this
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should handle XSS attempt in ID", async () => {
      mockReq.params.id = "<script>alert('xss')</script>";
      mockFood.findByIdAndDelete.mockRejectedValue(
        new Error("Cast to ObjectId failed")
      );

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});
