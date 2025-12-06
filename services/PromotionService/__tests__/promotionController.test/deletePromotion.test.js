const deletePromotion = require("../../controllers/promotionController/deletePromotion");

describe("deletePromotion", () => {
  let mockPromotion;
  let handler;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Setup mock Promotion model
    mockPromotion = {
      findByIdAndDelete: jest.fn(),
    };

    // Create handler with mocked dependencies
    handler = deletePromotion({ Promotion: mockPromotion });

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
    it("should delete promotion successfully", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      const deletedPromotion = {
        _id: "507f1f77bcf86cd799439011",
        title: "Deleted promotion",
      };
      mockPromotion.findByIdAndDelete.mockResolvedValue(deletedPromotion);

      await handler(mockReq, mockRes);

      expect(mockPromotion.findByIdAndDelete).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Xóa ưu đãi thành công",
      });
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should delete promotion with valid ObjectId", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439012";
      const deletedPromotion = {
        _id: "507f1f77bcf86cd799439012",
        title: "Another promotion",
      };
      mockPromotion.findByIdAndDelete.mockResolvedValue(deletedPromotion);

      await handler(mockReq, mockRes);

      expect(mockPromotion.findByIdAndDelete).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439012"
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Xóa ưu đãi thành công",
      });
    });
  });

  describe("Not found errors", () => {
    it("should return 404 when promotion not found", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockPromotion.findByIdAndDelete.mockResolvedValue(null);

      await handler(mockReq, mockRes);

      expect(mockPromotion.findByIdAndDelete).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Không tìm thấy ưu đãi để xóa",
      });
    });

    it("should return 404 when promotion ID does not exist", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439999";
      mockPromotion.findByIdAndDelete.mockResolvedValue(null);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Không tìm thấy ưu đãi để xóa",
      });
    });
  });

  describe("Error handling", () => {
    it("should return 400 error when delete fails", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      const dbError = new Error("Database error");
      mockPromotion.findByIdAndDelete.mockRejectedValue(dbError);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi xóa ưu đãi",
        details: "Database error",
      });
    });

    it("should return 400 error when mongoose throws error", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      const mongooseError = new Error("Mongoose connection error");
      mockPromotion.findByIdAndDelete.mockRejectedValue(mongooseError);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi xóa ưu đãi",
        details: "Mongoose connection error",
      });
    });

    it("should return 400 error when network timeout", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      const timeoutError = new Error("Network timeout");
      mockPromotion.findByIdAndDelete.mockRejectedValue(timeoutError);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi xóa ưu đãi",
        details: "Network timeout",
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle invalid ID format (will be caught by mongoose)", async () => {
      mockReq.params.id = "invalid-id";
      // Mongoose will handle invalid ID, but if it passes through, it will return null or error
      mockPromotion.findByIdAndDelete.mockResolvedValue(null);

      await handler(mockReq, mockRes);

      // Should still call findByIdAndDelete, but return null
      expect(mockPromotion.findByIdAndDelete).toHaveBeenCalledWith("invalid-id");
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});

