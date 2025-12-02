const mongoose = require("mongoose");
const updateFood = require("../../controllers/foodController/updateFood");

describe("updateFood", () => {
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
      findByIdAndUpdate: jest.fn(),
    };

    // Create handler
    handler = updateFood({ Food: mockFood });

    // Mock request and response
    mockReq = {
      params: {},
      body: {},
      file: null,
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
    it("should update food successfully with valid data", async () => {
      const updatedFood = {
        _id: "507f1f77bcf86cd799439011",
        name: "Updated Popcorn",
        price: 55000,
        isAvailable: true,
      };

      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body.data = JSON.stringify({
        name: "Updated Popcorn",
        price: 55000,
      });

      mockFood.findByIdAndUpdate.mockResolvedValue(updatedFood);

      await handler(mockReq, mockRes);

      expect(mockFood.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        expect.objectContaining({
          name: "Updated Popcorn",
          price: 55000,
        }),
        { new: true }
      );
      expect(mockRes.json).toHaveBeenCalledWith(updatedFood);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should update only specific fields", async () => {
      const updatedFood = {
        _id: "507f1f77bcf86cd799439011",
        name: "Popcorn",
        price: 60000, // Only price changed
        description: "Original description",
      };

      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body.data = JSON.stringify({
        price: 60000,
      });

      mockFood.findByIdAndUpdate.mockResolvedValue(updatedFood);

      await handler(mockReq, mockRes);

      expect(mockFood.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        { price: 60000 },
        { new: true }
      );
    });

    it("should update food with new image", async () => {
      const updatedFood = {
        _id: "507f1f77bcf86cd799439011",
        name: "Popcorn",
        price: 50000,
        imageUrl: "uploads/new-image-123.jpg",
      };

      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body.data = JSON.stringify({
        name: "Popcorn",
        price: 50000,
      });
      mockReq.file = {
        filename: "new-image-123.jpg",
      };

      mockFood.findByIdAndUpdate.mockResolvedValue(updatedFood);

      await handler(mockReq, mockRes);

      expect(mockFood.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        expect.objectContaining({
          imageUrl: expect.stringContaining("new-image-123.jpg"),
        }),
        { new: true }
      );
    });

    it("should update with empty data object", async () => {
      const unchangedFood = {
        _id: "507f1f77bcf86cd799439011",
        name: "Popcorn",
        price: 50000,
      };

      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body.data = JSON.stringify({});

      mockFood.findByIdAndUpdate.mockResolvedValue(unchangedFood);

      await handler(mockReq, mockRes);

      expect(mockFood.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        {},
        { new: true }
      );
      expect(mockRes.json).toHaveBeenCalledWith(unchangedFood);
    });

    it("should update isAvailable status", async () => {
      const updatedFood = {
        _id: "507f1f77bcf86cd799439011",
        name: "Popcorn",
        price: 50000,
        isAvailable: false,
      };

      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body.data = JSON.stringify({
        isAvailable: false,
      });

      mockFood.findByIdAndUpdate.mockResolvedValue(updatedFood);

      await handler(mockReq, mockRes);

      expect(mockFood.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        { isAvailable: false },
        { new: true }
      );
    });

    it("should update multiple fields at once", async () => {
      const updatedFood = {
        _id: "507f1f77bcf86cd799439011",
        name: "Premium Popcorn",
        price: 75000,
        description: "Extra butter",
        category: "snacks",
        isAvailable: true,
      };

      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body.data = JSON.stringify({
        name: "Premium Popcorn",
        price: 75000,
        description: "Extra butter",
        category: "snacks",
        isAvailable: true,
      });

      mockFood.findByIdAndUpdate.mockResolvedValue(updatedFood);

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(updatedFood);
    });
  });

  describe("Validation cases", () => {
    it("should return 400 for invalid ObjectId", async () => {
      mockReq.params.id = "invalid-id";
      mockReq.body.data = JSON.stringify({ name: "Test" });

      await handler(mockReq, mockRes);

      expect(mockFood.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "ID không hợp lệ" });
    });

    it("should return 400 for empty ID", async () => {
      mockReq.params.id = "";
      mockReq.body.data = JSON.stringify({ name: "Test" });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 for null ID", async () => {
      mockReq.params.id = null;
      mockReq.body.data = JSON.stringify({ name: "Test" });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 for undefined ID", async () => {
      mockReq.params.id = undefined;
      mockReq.body.data = JSON.stringify({ name: "Test" });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should handle missing data field gracefully", async () => {
      const updatedFood = {
        _id: "507f1f77bcf86cd799439011",
        name: "Popcorn",
      };

      mockReq.params.id = "507f1f77bcf86cd799439011";
      // No mockReq.body.data

      mockFood.findByIdAndUpdate.mockResolvedValue(updatedFood);

      await handler(mockReq, mockRes);

      // Should parse as empty object
      expect(mockFood.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        {},
        { new: true }
      );
    });

    it("should handle invalid JSON in data field", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body.data = "invalid json";

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi máy chủ",
        details: expect.any(String),
      });
    });
  });

  describe("Not found cases", () => {
    it("should return 404 when food is not found", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body.data = JSON.stringify({ name: "Updated Name" });

      mockFood.findByIdAndUpdate.mockResolvedValue(null);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Món ăn không tồn tại",
      });
    });

    it("should return 404 when updating deleted food", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body.data = JSON.stringify({ price: 60000 });

      mockFood.findByIdAndUpdate.mockResolvedValue(null);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe("Error cases", () => {
    it("should return 500 when database update fails", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body.data = JSON.stringify({ name: "Test" });

      mockFood.findByIdAndUpdate.mockRejectedValue(
        new Error("Database error")
      );

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi máy chủ",
        details: "Database error",
      });
    });

    it("should return 500 for connection timeout", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body.data = JSON.stringify({ name: "Test" });

      mockFood.findByIdAndUpdate.mockRejectedValue(
        new Error("Connection timeout")
      );

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi máy chủ",
        details: "Connection timeout",
      });
    });

    it("should handle validation errors", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body.data = JSON.stringify({ price: -1000 });

      const validationError = new Error("Validation failed");
      validationError.name = "ValidationError";

      mockFood.findByIdAndUpdate.mockRejectedValue(validationError);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi máy chủ",
        details: "Validation failed",
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle updating with image only (no other data)", async () => {
      const updatedFood = {
        _id: "507f1f77bcf86cd799439011",
        name: "Popcorn",
        price: 50000,
        imageUrl: "uploads/only-image.jpg",
      };

      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body.data = JSON.stringify({});
      mockReq.file = {
        filename: "only-image.jpg",
      };

      mockFood.findByIdAndUpdate.mockResolvedValue(updatedFood);

      await handler(mockReq, mockRes);

      expect(mockFood.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        expect.objectContaining({
          imageUrl: expect.stringContaining("only-image.jpg"),
        }),
        { new: true }
      );
    });

    it("should handle price update to 0", async () => {
      const updatedFood = {
        _id: "507f1f77bcf86cd799439011",
        name: "Free Item",
        price: 0,
      };

      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body.data = JSON.stringify({ price: 0 });

      mockFood.findByIdAndUpdate.mockResolvedValue(updatedFood);

      await handler(mockReq, mockRes);

      expect(mockFood.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        { price: 0 },
        { new: true }
      );
    });

    it("should handle updating with null values", async () => {
      const updatedFood = {
        _id: "507f1f77bcf86cd799439011",
        name: "Popcorn",
        price: 50000,
        description: null,
      };

      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body.data = JSON.stringify({
        description: null,
      });

      mockFood.findByIdAndUpdate.mockResolvedValue(updatedFood);

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(updatedFood);
    });

    it("should handle very large update data", async () => {
      const largeDescription = "A".repeat(10000);
      const updatedFood = {
        _id: "507f1f77bcf86cd799439011",
        description: largeDescription,
      };

      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body.data = JSON.stringify({
        description: largeDescription,
      });

      mockFood.findByIdAndUpdate.mockResolvedValue(updatedFood);

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(updatedFood);
    });

    it("should handle special characters in update data", async () => {
      const updatedFood = {
        _id: "507f1f77bcf86cd799439011",
        name: 'Popcorn "Special" & <Deluxe>',
        description: "Contains: salt, butter\nCalories: 500",
      };

      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body.data = JSON.stringify({
        name: 'Popcorn "Special" & <Deluxe>',
        description: "Contains: salt, butter\nCalories: 500",
      });

      mockFood.findByIdAndUpdate.mockResolvedValue(updatedFood);

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(updatedFood);
    });
  });
});
