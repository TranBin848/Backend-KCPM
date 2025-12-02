const mongoose = require("mongoose");
const getFoodById = require("../../controllers/foodController/getFoodById");

describe("getFoodById", () => {
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
      findById: jest.fn(),
    };

    // Create handler
    handler = getFoodById({ Food: mockFood });

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
    it("should return food when valid ID is provided", async () => {
      const mockFoodItem = {
        _id: "507f1f77bcf86cd799439011",
        name: "Popcorn",
        price: 50000,
        isAvailable: true,
      };

      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockFood.findById.mockResolvedValue(mockFoodItem);

      await handler(mockReq, mockRes);

      expect(mockFood.findById).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
      expect(mockRes.json).toHaveBeenCalledWith(mockFoodItem);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should handle food with all fields populated", async () => {
      const mockFoodItem = {
        _id: "507f1f77bcf86cd799439011",
        name: "Combo Set",
        price: 150000,
        description: "Popcorn + 2 Cokes",
        category: "combo",
        imageUrl: "uploads/image.jpg",
        isAvailable: true,
      };

      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockFood.findById.mockResolvedValue(mockFoodItem);

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockFoodItem);
    });
  });

  describe("Validation cases", () => {
    it("should return 400 for invalid ObjectId format", async () => {
      mockReq.params.id = "invalid-id";

      await handler(mockReq, mockRes);

      expect(mockFood.findById).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "ID không hợp lệ" });
    });

    it("should return 400 for empty ID", async () => {
      mockReq.params.id = "";

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "ID không hợp lệ" });
    });

    it("should return 400 for null ID", async () => {
      mockReq.params.id = null;

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "ID không hợp lệ" });
    });

    it("should return 400 for undefined ID", async () => {
      mockReq.params.id = undefined;

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "ID không hợp lệ" });
    });

    it("should return 400 for ID with special characters", async () => {
      mockReq.params.id = "123@#$%";

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "ID không hợp lệ" });
    });

    it("should return 400 for ID that is too short", async () => {
      mockReq.params.id = "123";

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "ID không hợp lệ" });
    });

    it("should return 400 for ID that is too long", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011abc";

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "ID không hợp lệ" });
    });
  });

  describe("Not found cases", () => {
    it("should return 404 when food is not found", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockFood.findById.mockResolvedValue(null);

      await handler(mockReq, mockRes);

      expect(mockFood.findById).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Không tìm thấy món ăn",
      });
    });

    it("should return 404 when food has been deleted", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockFood.findById.mockResolvedValue(null);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe("Error cases", () => {
    it("should return 500 when database query fails", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockFood.findById.mockRejectedValue(new Error("Database error"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi lấy món ăn",
      });
    });

    it("should handle database connection timeout", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockFood.findById.mockRejectedValue(new Error("Connection timeout"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi lấy món ăn",
      });
    });

    it("should handle database unavailable error", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockFood.findById.mockRejectedValue(new Error("Database unavailable"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe("Edge cases", () => {
    it("should handle valid ObjectId but with leading/trailing spaces", async () => {
      mockReq.params.id = " 507f1f77bcf86cd799439011 ";

      await handler(mockReq, mockRes);

      // Mongoose ObjectId validator will reject this
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should handle ObjectId in uppercase", async () => {
      const validId = "507F1F77BCF86CD799439011";
      mockReq.params.id = validId;
      mockFood.findById.mockResolvedValue({
        _id: validId,
        name: "Test Food",
      });

      await handler(mockReq, mockRes);

      // MongoDB ObjectIds are case-insensitive for hex strings
      expect(mockFood.findById).toHaveBeenCalledWith(validId);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });
});
