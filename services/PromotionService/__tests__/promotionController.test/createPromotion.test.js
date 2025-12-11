const createPromotion = require("../../controllers/promotionController/createPromotion");
const path = require("path");

describe("createPromotion", () => {
  let mockPromotion;
  let handler;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Setup mock Promotion model
    mockPromotion = jest.fn();

    // Create handler with mocked dependencies
    handler = createPromotion({ Promotion: mockPromotion });

    // Setup mock request and response
    mockReq = {
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

      mockPromotion.mockImplementation((data) => ({
        ...data,
        save: mockSave,
      }));

      await handler(mockReq, mockRes);

      expect(mockPromotion).toHaveBeenCalledWith(mockReq.body);
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

      mockPromotion.mockImplementation((data) => ({
        ...data,
        save: mockSave,
      }));

      await handler(mockReq, mockRes);

      expect(mockSave).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Thêm ưu đãi thành công",
        promotion: expect.objectContaining({
          title: "Flash Sale",
          description: "Giảm giá trong 24h",
        }),
      });
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
        image: path.join("uploads", "promo-image.jpg"),
      });

      mockPromotion.mockImplementation((data) => ({
        ...data,
        save: mockSave,
      }));

      await handler(mockReq, mockRes);

      expect(mockPromotion).toHaveBeenCalledWith(
        expect.objectContaining({
          image: expect.stringContaining("promo-image.jpg"),
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should create promotion with both form-data and image", async () => {
      mockReq.body = {
        data: JSON.stringify({
          title: "Combo Deal",
          description: "Ưu đãi combo",
        }),
      };
      mockReq.file = {
        filename: "combo.jpg",
      };

      const mockSave = jest.fn().mockResolvedValue({
        _id: "mockId",
        title: "Combo Deal",
        description: "Ưu đãi combo",
        image: path.join("uploads", "combo.jpg"),
      });

      mockPromotion.mockImplementation((data) => ({
        ...data,
        save: mockSave,
      }));

      await handler(mockReq, mockRes);

      expect(mockPromotion).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Combo Deal",
          image: expect.stringContaining("combo.jpg"),
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe("Validation errors", () => {
    it("should return 400 for invalid JSON in data field", async () => {
      mockReq.body = {
        data: "invalid-json{",
      };

      await handler(mockReq, mockRes);

      expect(mockPromotion).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Dữ liệu JSON trong 'data' không hợp lệ",
      });
    });

    it("should return 400 when missing title", async () => {
      mockReq.body = {
        description: "Mô tả",
      };

      await handler(mockReq, mockRes);

      expect(mockPromotion).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Thiếu trường bắt buộc: title hoặc description",
      });
    });

    it("should return 400 when missing description", async () => {
      mockReq.body = {
        title: "Tiêu đề",
      };

      await handler(mockReq, mockRes);

      expect(mockPromotion).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Thiếu trường bắt buộc: title hoặc description",
      });
    });

    it("should return 400 when both title and description are missing", async () => {
      mockReq.body = {
        applicableTime: "2024-12-31",
      };

      await handler(mockReq, mockRes);

      expect(mockPromotion).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Thiếu trường bắt buộc: title hoặc description",
      });
    });

    it("should return 400 when title is empty string", async () => {
      mockReq.body = {
        title: "",
        description: "Mô tả",
      };

      await handler(mockReq, mockRes);

      expect(mockPromotion).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when description is empty string", async () => {
      mockReq.body = {
        title: "Tiêu đề",
        description: "",
      };

      await handler(mockReq, mockRes);

      expect(mockPromotion).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Error handling", () => {
    it("should return 400 error when save fails", async () => {
      mockReq.body = {
        title: "Test Promotion",
        description: "Test description",
      };

      const mockSave = jest
        .fn()
        .mockRejectedValue(new Error("Validation error"));

      mockPromotion.mockImplementation((data) => ({
        ...data,
        save: mockSave,
      }));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi thêm ưu đãi",
        details: "Validation error",
      });
    });

    it("should return 400 error when mongoose validation fails", async () => {
      mockReq.body = {
        title: "Test",
        description: "Test",
      };

      const validationError = new Error("Mongoose validation failed");
      mockPromotion.mockImplementation(() => {
        throw validationError;
      });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi thêm ưu đãi",
        details: "Mongoose validation failed",
      });
    });
  });
});

