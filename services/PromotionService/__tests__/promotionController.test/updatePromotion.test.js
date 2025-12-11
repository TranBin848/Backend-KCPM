const updatePromotion = require("../../controllers/promotionController/updatePromotion");
const mongoose = require("mongoose");
const path = require("path");

describe("updatePromotion", () => {
  let mockPromotion;
  let handler;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Setup mock Promotion model
    mockPromotion = {
      findByIdAndUpdate: jest.fn(),
    };

    // Create handler with mocked dependencies
    handler = updatePromotion({ Promotion: mockPromotion });

    // Setup mock request and response
    mockReq = {
      params: {},
      body: {},
      file: null,
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
    it("should update promotion successfully with form-data", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body = {
        data: JSON.stringify({
          title: "Ưu đãi cập nhật",
          description: "Mô tả mới",
        }),
      };

      const updatedPromotion = {
        _id: "507f1f77bcf86cd799439011",
        title: "Ưu đãi cập nhật",
        description: "Mô tả mới",
      };

      mockPromotion.findByIdAndUpdate.mockResolvedValue(updatedPromotion);

      await handler(mockReq, mockRes);

      expect(mockPromotion.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        { title: "Ưu đãi cập nhật", description: "Mô tả mới" },
        { new: true }
      );
      expect(mockRes.json).toHaveBeenCalledWith(updatedPromotion);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should update promotion without form-data", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body = {
        title: "Direct update",
        description: "No form-data",
      };

      const updatedPromotion = {
        _id: "507f1f77bcf86cd799439011",
        title: "Direct update",
        description: "No form-data",
      };

      mockPromotion.findByIdAndUpdate.mockResolvedValue(updatedPromotion);

      await handler(mockReq, mockRes);

      expect(mockPromotion.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        mockReq.body,
        { new: true }
      );
      expect(mockRes.json).toHaveBeenCalledWith(updatedPromotion);
    });

    it("should update promotion with image", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body = {
        data: JSON.stringify({ title: "Updated promo" }),
      };
      mockReq.file = {
        filename: "new-image.jpg",
      };

      const updatedPromotion = {
        _id: "507f1f77bcf86cd799439011",
        title: "Updated promo",
        image: path.join("uploads", "new-image.jpg"),
      };

      mockPromotion.findByIdAndUpdate.mockResolvedValue(updatedPromotion);

      await handler(mockReq, mockRes);

      expect(mockPromotion.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        expect.objectContaining({
          title: "Updated promo",
          image: expect.stringContaining("new-image.jpg"),
        }),
        { new: true }
      );
      expect(mockRes.json).toHaveBeenCalledWith(updatedPromotion);
    });

    it("should update promotion with partial data", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body = {
        title: "Only title updated",
      };

      const updatedPromotion = {
        _id: "507f1f77bcf86cd799439011",
        title: "Only title updated",
        description: "Old description",
      };

      mockPromotion.findByIdAndUpdate.mockResolvedValue(updatedPromotion);

      await handler(mockReq, mockRes);

      expect(mockPromotion.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        { title: "Only title updated" },
        { new: true }
      );
      expect(mockRes.json).toHaveBeenCalledWith(updatedPromotion);
    });
  });

  describe("Validation errors", () => {
    it("should return 400 for invalid ID", async () => {
      mockReq.params.id = "invalid-id";
      mockReq.body = { data: "{}" };

      await handler(mockReq, mockRes);

      expect(mockPromotion.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "ID không hợp lệ" });
    });

    it("should return 400 for empty ID", async () => {
      mockReq.params.id = "";
      mockReq.body = {};

      await handler(mockReq, mockRes);

      expect(mockPromotion.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "ID không hợp lệ" });
    });

    it("should return 400 for invalid JSON in data field", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body = { data: "invalid-json{" };

      await handler(mockReq, mockRes);

      expect(mockPromotion.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Dữ liệu JSON trong 'data' không hợp lệ",
      });
    });
  });

  describe("Not found errors", () => {
    it("should return 404 when promotion not found", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body = { data: '{"title": "Test"}' };
      mockPromotion.findByIdAndUpdate.mockResolvedValue(null);

      await handler(mockReq, mockRes);

      expect(mockPromotion.findByIdAndUpdate).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Không tìm thấy ưu đãi để cập nhật",
      });
    });
  });

  describe("Error handling", () => {
    it("should return 500 error when update fails", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body = { data: "{}" };
      const dbError = new Error("Database error");
      mockPromotion.findByIdAndUpdate.mockRejectedValue(dbError);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi máy chủ",
        details: "Database error",
      });
    });

    it("should return 500 error when mongoose throws error", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body = { title: "Test" };
      const mongooseError = new Error("Mongoose error");
      mockPromotion.findByIdAndUpdate.mockRejectedValue(mongooseError);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi máy chủ",
        details: "Mongoose error",
      });
    });
  });
});

