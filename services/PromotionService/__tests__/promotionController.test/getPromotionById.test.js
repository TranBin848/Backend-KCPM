const getPromotionById = require("../../controllers/promotionController/getPromotionById");
const mongoose = require("mongoose");

describe("getPromotionById", () => {
  let mockPromotion;
  let handler;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Setup mock Promotion model
    mockPromotion = {
      findById: jest.fn(),
    };

    // Create handler with mocked dependencies
    handler = getPromotionById({ Promotion: mockPromotion });

    // Setup mock request and response
    mockReq = {
      params: {},
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Success cases", () => {
    it("should return promotion by valid ID", async () => {
      const mockPromotionItem = {
        _id: "507f1f77bcf86cd799439011",
        title: "Giảm 50%",
        description: "Ưu đãi đặc biệt",
      };
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockPromotion.findById.mockResolvedValue(mockPromotionItem);

      await handler(mockReq, mockRes);

      expect(mockPromotion.findById).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockPromotionItem);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should return promotion with all fields", async () => {
      const mockPromotionItem = {
        _id: "507f1f77bcf86cd799439011",
        title: "Flash Sale",
        description: "Giảm giá trong 24h",
        image: "uploads/promo.jpg",
        applicableTime: "2024-12-31",
        discount: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockPromotion.findById.mockResolvedValue(mockPromotionItem);

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockPromotionItem);
    });
  });

  describe("Validation errors", () => {
    it("should return 400 for invalid ID format", async () => {
      mockReq.params.id = "invalid-id";

      await handler(mockReq, mockRes);

      expect(mockPromotion.findById).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "ID không hợp lệ" });
    });

    it("should return 400 for empty ID", async () => {
      mockReq.params.id = "";

      await handler(mockReq, mockRes);

      expect(mockPromotion.findById).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "ID không hợp lệ" });
    });

    it("should return 400 for null ID", async () => {
      mockReq.params.id = null;

      await handler(mockReq, mockRes);

      expect(mockPromotion.findById).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "ID không hợp lệ" });
    });

    it("should return 400 for undefined ID", async () => {
      mockReq.params.id = undefined;

      await handler(mockReq, mockRes);

      expect(mockPromotion.findById).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "ID không hợp lệ" });
    });
  });

  describe("Not found errors", () => {
    it("should return 404 when promotion not found", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockPromotion.findById.mockResolvedValue(null);

      await handler(mockReq, mockRes);

      expect(mockPromotion.findById).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Không tìm thấy ưu đãi",
      });
    });
  });

  describe("Error handling", () => {
    it("should return 500 error when database fails", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      const dbError = new Error("Database connection error");
      mockPromotion.findById.mockRejectedValue(dbError);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi lấy ưu đãi",
      });
    });

    it("should return 500 error when mongoose throws error", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      const mongooseError = new Error("Mongoose error");
      mockPromotion.findById.mockRejectedValue(mongooseError);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi lấy ưu đãi",
      });
    });
  });
});

