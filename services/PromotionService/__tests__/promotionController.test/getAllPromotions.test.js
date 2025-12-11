const getAllPromotions = require("../../controllers/promotionController/getAllPromotions");

describe("getAllPromotions", () => {
  let mockPromotion;
  let handler;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Setup mock Promotion model
    mockPromotion = {
      find: jest.fn(),
    };

    // Create handler with mocked dependencies
    handler = getAllPromotions({ Promotion: mockPromotion });

    // Setup mock request and response
    mockReq = {
      params: {},
      query: {},
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
    it("should return all promotions successfully", async () => {
      const mockPromotions = [
        { _id: "1", title: "Giảm giá 20%", description: "Mô tả 1" },
        { _id: "2", title: "Mua 1 tặng 1", description: "Mô tả 2" },
      ];
      mockPromotion.find.mockResolvedValue(mockPromotions);

      await handler(mockReq, mockRes);

      expect(mockPromotion.find).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(mockPromotions);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should return empty array when no promotions exist", async () => {
      mockPromotion.find.mockResolvedValue([]);

      await handler(mockReq, mockRes);

      expect(mockPromotion.find).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it("should return promotions with all fields", async () => {
      const mockPromotions = [
        {
          _id: "507f1f77bcf86cd799439011",
          title: "Flash Sale",
          description: "Giảm giá trong 24h",
          image: "uploads/promo.jpg",
          applicableTime: "2024-12-31",
          discount: 50,
        },
      ];
      mockPromotion.find.mockResolvedValue(mockPromotions);

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockPromotions);
    });
  });

  describe("Error handling", () => {
    it("should return 500 error when database fails", async () => {
      const dbError = new Error("Database connection error");
      mockPromotion.find.mockRejectedValue(dbError);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi lấy danh sách ưu đãi",
      });
    });

    it("should return 500 error when find throws network error", async () => {
      const networkError = new Error("Network timeout");
      mockPromotion.find.mockRejectedValue(networkError);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi lấy danh sách ưu đãi",
      });
    });

    it("should handle mongoose validation errors", async () => {
      const validationError = new Error("Mongoose validation error");
      mockPromotion.find.mockRejectedValue(validationError);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi lấy danh sách ưu đãi",
      });
    });
  });
});

