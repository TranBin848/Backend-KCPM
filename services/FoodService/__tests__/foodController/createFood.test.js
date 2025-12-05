const createFood = require("../../controllers/foodController/createFood");

describe("createFood", () => {
  let mockFood;
  let handler;
  let mockReq;
  let mockRes;

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  beforeEach(() => {
    // Mock Food model
    mockFood = jest.fn().mockImplementation((data) => {
      return {
        ...data,
        save: jest.fn().mockResolvedValue({ _id: "newId", ...data }),
      };
    });

    // Create handler
    handler = createFood({ Food: mockFood });

    // Mock request and response
    mockReq = {
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

  describe("Success cases - JSON input", () => {
    it("should create food with JSON body (application/json)", async () => {
      mockReq.body = {
        name: "Popcorn",
        price: 50000,
        description: "Large popcorn",
        isAvailable: true,
      };

      await handler(mockReq, mockRes);

      expect(mockFood).toHaveBeenCalledWith({
        name: "Popcorn",
        price: 50000,
        description: "Large popcorn",
        isAvailable: true,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Thêm món ăn thành công",
        food: expect.objectContaining({
          name: "Popcorn",
          price: 50000,
        }),
      });
    });

    it("should create food with minimum required fields", async () => {
      mockReq.body = {
        name: "Coke",
        price: 30000,
      };

      await handler(mockReq, mockRes);

      expect(mockFood).toHaveBeenCalledWith({
        name: "Coke",
        price: 30000,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should create food with all optional fields", async () => {
      mockReq.body = {
        name: "Combo Set",
        price: 150000,
        description: "Popcorn + 2 Cokes",
        category: "combo",
        isAvailable: true,
      };

      await handler(mockReq, mockRes);

      expect(mockFood).toHaveBeenCalledWith({
        name: "Combo Set",
        price: 150000,
        description: "Popcorn + 2 Cokes",
        category: "combo",
        isAvailable: true,
      });
    });
  });

  describe("Success cases - Form-data input", () => {
    it("should create food with form-data (multipart/form-data)", async () => {
      mockReq.body = {
        data: JSON.stringify({
          name: "Nachos",
          price: 60000,
          isAvailable: true,
        }),
      };

      await handler(mockReq, mockRes);

      expect(mockFood).toHaveBeenCalledWith({
        name: "Nachos",
        price: 60000,
        isAvailable: true,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should create food with image upload", async () => {
      mockReq.body = {
        data: JSON.stringify({
          name: "Hotdog",
          price: 45000,
        }),
      };
      mockReq.file = {
        filename: "hotdog-123.jpg",
        path: "uploads/hotdog-123.jpg",
      };

      await handler(mockReq, mockRes);

      expect(mockFood).toHaveBeenCalledWith({
        name: "Hotdog",
        price: 45000,
        imageUrl: expect.stringContaining("hotdog-123.jpg"),
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle form-data with complex nested data", async () => {
      mockReq.body = {
        data: JSON.stringify({
          name: "Premium Combo",
          price: 200000,
          description: "Large popcorn + 2 large drinks + nachos",
          category: "combo",
          isAvailable: true,
        }),
      };
      mockReq.file = {
        filename: "combo-456.jpg",
      };

      await handler(mockReq, mockRes);

      expect(mockFood).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Premium Combo",
          price: 200000,
          imageUrl: expect.stringContaining("combo-456.jpg"),
        })
      );
    });
  });

  describe("Validation cases", () => {
    it("should return 400 when name is missing", async () => {
      mockReq.body = {
        price: 50000,
      };

      await handler(mockReq, mockRes);

      expect(mockFood).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Thiếu trường bắt buộc: name hoặc price",
      });
    });

    it("should return 400 when price is missing", async () => {
      mockReq.body = {
        name: "Popcorn",
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Thiếu trường bắt buộc: name hoặc price",
      });
    });

    it("should return 400 when both name and price are missing", async () => {
      mockReq.body = {
        description: "Some description",
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 for invalid JSON in data field", async () => {
      mockReq.body = {
        data: "invalid json string",
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Dữ liệu JSON trong 'data' không hợp lệ",
      });
    });

    it("should return 400 for malformed JSON", async () => {
      mockReq.body = {
        data: '{"name": "Test", invalid}',
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when name is empty string", async () => {
      mockReq.body = {
        name: "",
        price: 50000,
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when price is 0", async () => {
      mockReq.body = {
        name: "Free item",
        price: 0,
      };

      await handler(mockReq, mockRes);

      // Price 0 is falsy, should fail validation
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when price is negative", async () => {
      mockReq.body = {
        name: "Test",
        price: -1000,
      };

      await handler(mockReq, mockRes);

      // Negative price should fail
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Error cases", () => {
    it("should return 400 when save fails", async () => {
      mockReq.body = {
        name: "Test Food",
        price: 50000,
      };

      mockFood.mockImplementationOnce((data) => ({
        ...data,
        save: jest.fn().mockRejectedValue(new Error("Database error")),
      }));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi thêm món ăn",
        details: "Database error",
      });
    });

    it("should return 400 for duplicate key error", async () => {
      mockReq.body = {
        name: "Duplicate Food",
        price: 50000,
      };

      const duplicateError = new Error("Duplicate key");
      duplicateError.code = 11000;

      mockFood.mockImplementationOnce((data) => ({
        ...data,
        save: jest.fn().mockRejectedValue(duplicateError),
      }));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi thêm món ăn",
        details: "Duplicate key",
      });
    });

    it("should return 400 for validation error", async () => {
      mockReq.body = {
        name: "Test",
        price: 50000,
      };

      const validationError = new Error("Validation failed");
      validationError.name = "ValidationError";

      mockFood.mockImplementationOnce((data) => ({
        ...data,
        save: jest.fn().mockRejectedValue(validationError),
      }));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi thêm món ăn",
        details: "Validation failed",
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle price as string number", async () => {
      mockReq.body = {
        name: "Test",
        price: "50000", // String instead of number
      };

      await handler(mockReq, mockRes);

      // Truthy string should pass validation
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle boolean isAvailable", async () => {
      mockReq.body = {
        name: "Test",
        price: 50000,
        isAvailable: false,
      };

      await handler(mockReq, mockRes);

      expect(mockFood).toHaveBeenCalledWith(
        expect.objectContaining({
          isAvailable: false,
        })
      );
    });

    it("should handle file upload without data field", async () => {
      mockReq.body = {
        name: "Image Only",
        price: 50000,
      };
      mockReq.file = {
        filename: "image.jpg",
      };

      await handler(mockReq, mockRes);

      expect(mockFood).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: expect.stringContaining("image.jpg"),
        })
      );
    });

    it("should handle extra unexpected fields", async () => {
      mockReq.body = {
        name: "Test",
        price: 50000,
        unexpectedField: "unexpected value",
        anotherField: 123,
      };

      await handler(mockReq, mockRes);

      // Should pass through to model (let Mongoose handle it)
      expect(mockFood).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test",
          price: 50000,
        })
      );
    });
  });
});
