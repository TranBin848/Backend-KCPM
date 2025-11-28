const createPromotionController = require("../controllers/promotionController");
const mongoose = require("mongoose");

describe("PromotionController", () => {
  let mockPromotion;
  let controller;
  let mockReq;
  let mockRes;
  let consoleErrorSpy;

  beforeAll(() => {
    // Suppress console.error globally for all tests
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    // Setup mock Promotion model
    mockPromotion = {
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    // Create controller with mocked dependencies
    controller = createPromotionController({ Promotion: mockPromotion });

    // Setup mock request and response
    mockReq = {
      params: {},
      query: {},
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

  describe("getAllPromotions", () => {
    it("should return all promotions", async () => {
      const mockPromotions = [
        { _id: "1", title: "Giảm giá 20%", description: "Mô tả 1" },
        { _id: "2", title: "Mua 1 tặng 1", description: "Mô tả 2" },
      ];
      mockPromotion.find.mockResolvedValue(mockPromotions);

      await controller.getAllPromotions(mockReq, mockRes);

      expect(mockPromotion.find).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(mockPromotions);
    });

    it("should return 500 error when database fails", async () => {
      mockPromotion.find.mockRejectedValue(new Error("Database error"));

      await controller.getAllPromotions(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi lấy danh sách ưu đãi",
      });
    });
  });

  describe("getPromotionById", () => {
    it("should return promotion by valid ID", async () => {
      const mockPromotionItem = {
        _id: "507f1f77bcf86cd799439011",
        title: "Giảm 50%",
        description: "Ưu đãi đặc biệt",
      };
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockPromotion.findById.mockResolvedValue(mockPromotionItem);

      await controller.getPromotionById(mockReq, mockRes);

      expect(mockPromotion.findById).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockPromotionItem);
    });

    it("should return 400 for invalid ID format", async () => {
      mockReq.params.id = "invalid-id";

      await controller.getPromotionById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "ID không hợp lệ" });
    });

    it("should return 404 when promotion not found", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockPromotion.findById.mockResolvedValue(null);

      await controller.getPromotionById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Không tìm thấy ưu đãi",
      });
    });

    it("should return 500 error when database fails", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockPromotion.findById.mockRejectedValue(new Error("Database error"));

      await controller.getPromotionById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi lấy ưu đãi",
      });
    });
  });

  describe("createPromotion", () => {
    it("should create promotion with JSON body", async () => {
      mockReq.body = {
        title: "Khuyến mãi mới",
        description: "Mô tả khuyến mãi",
        applicableTime: "2024-12-31",
      };

      const mockSave = jest.fn().mockResolvedValue({
        _id: "mockId",
        ...mockReq.body,
      });

      const MockPromotionConstructor = jest
        .fn()
        .mockImplementation((data) => ({
          ...data,
          save: mockSave,
        }));

      controller = createPromotionController({
        Promotion: MockPromotionConstructor,
      });

      await controller.createPromotion(mockReq, mockRes);

      expect(MockPromotionConstructor).toHaveBeenCalledWith(mockReq.body);
      expect(mockSave).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Thêm ưu đãi thành công",
        promotion: expect.objectContaining({
          title: "Khuyến mãi mới",
          description: "Mô tả khuyến mãi",
        }),
      });
    });

    it("should create promotion with form-data", async () => {
      mockReq.body = {
        data: JSON.stringify({
          title: "Flash Sale",
          description: "Giảm giá trong 24h",
        }),
      };

      const mockSave = jest.fn().mockResolvedValue({
        _id: "mockId",
        title: "Flash Sale",
        description: "Giảm giá trong 24h",
      });

      const MockPromotionConstructor = jest
        .fn()
        .mockImplementation((data) => ({
          ...data,
          save: mockSave,
        }));

      controller = createPromotionController({
        Promotion: MockPromotionConstructor,
      });

      await controller.createPromotion(mockReq, mockRes);

      expect(mockSave).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should create promotion with image upload", async () => {
      mockReq.body = {
        title: "Ưu đãi đặc biệt",
        description: "Với hình ảnh",
      };
      mockReq.file = {
        filename: "promo-image.jpg",
      };

      const mockSave = jest.fn().mockResolvedValue({
        _id: "mockId",
        ...mockReq.body,
        image: "uploads\\promo-image.jpg",
      });

      const MockPromotionConstructor = jest
        .fn()
        .mockImplementation((data) => ({
          ...data,
          save: mockSave,
        }));

      controller = createPromotionController({
        Promotion: MockPromotionConstructor,
      });

      await controller.createPromotion(mockReq, mockRes);

      expect(MockPromotionConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          image: expect.stringContaining("promo-image.jpg"),
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should return 400 for invalid JSON in data field", async () => {
      mockReq.body = {
        data: "invalid-json{",
      };

      await controller.createPromotion(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Dữ liệu JSON trong 'data' không hợp lệ",
      });
    });

    it("should return 400 when missing required fields", async () => {
      mockReq.body = {
        applicableTime: "2024-12-31",
      };

      await controller.createPromotion(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Thiếu trường bắt buộc: title hoặc description",
      });
    });

    it("should return 400 error when save fails", async () => {
      mockReq.body = {
        title: "Test Promotion",
        description: "Test description",
      };

      const mockSave = jest
        .fn()
        .mockRejectedValue(new Error("Validation error"));

      const MockPromotionConstructor = jest
        .fn()
        .mockImplementation((data) => ({
          ...data,
          save: mockSave,
        }));

      controller = createPromotionController({
        Promotion: MockPromotionConstructor,
      });

      await controller.createPromotion(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi thêm ưu đãi",
        details: "Validation error",
      });
    });
  });

  describe("updatePromotion", () => {
    it("should update promotion successfully", async () => {
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

      await controller.updatePromotion(mockReq, mockRes);

      expect(mockPromotion.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        { title: "Ưu đãi cập nhật", description: "Mô tả mới" },
        { new: true }
      );
      expect(mockRes.json).toHaveBeenCalledWith(updatedPromotion);
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

      await controller.updatePromotion(mockReq, mockRes);

      expect(mockPromotion.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        mockReq.body,
        { new: true }
      );
      expect(mockRes.json).toHaveBeenCalledWith(updatedPromotion);
    });

    it("should return 400 for invalid ID", async () => {
      mockReq.params.id = "invalid-id";
      mockReq.body = { data: "{}" };

      await controller.updatePromotion(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "ID không hợp lệ" });
    });

    it("should return 400 for invalid JSON in data field", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body = { data: "invalid-json{" };

      await controller.updatePromotion(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Dữ liệu JSON trong 'data' không hợp lệ",
      });
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
        image: "uploads\\new-image.jpg",
      };

      mockPromotion.findByIdAndUpdate.mockResolvedValue(updatedPromotion);

      await controller.updatePromotion(mockReq, mockRes);

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

    it("should return 404 when promotion not found", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body = { data: '{"title": "Test"}' };
      mockPromotion.findByIdAndUpdate.mockResolvedValue(null);

      await controller.updatePromotion(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Không tìm thấy ưu đãi để cập nhật",
      });
    });

    it("should return 500 error when update fails", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body = { data: "{}" };
      mockPromotion.findByIdAndUpdate.mockRejectedValue(
        new Error("Database error")
      );

      await controller.updatePromotion(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi máy chủ",
        details: "Database error",
      });
    });
  });

  describe("deletePromotion", () => {
    it("should delete promotion successfully", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      const deletedPromotion = {
        _id: "507f1f77bcf86cd799439011",
        title: "Deleted promotion",
      };
      mockPromotion.findByIdAndDelete.mockResolvedValue(deletedPromotion);

      await controller.deletePromotion(mockReq, mockRes);

      expect(mockPromotion.findByIdAndDelete).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Xóa ưu đãi thành công",
      });
    });

    it("should return 404 when promotion not found", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockPromotion.findByIdAndDelete.mockResolvedValue(null);

      await controller.deletePromotion(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Không tìm thấy ưu đãi để xóa",
      });
    });

    it("should return 400 error when delete fails", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockPromotion.findByIdAndDelete.mockRejectedValue(
        new Error("Database error")
      );

      await controller.deletePromotion(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi xóa ưu đãi",
        details: "Database error",
      });
    });
  });
});
