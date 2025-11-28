const createFoodController = require("../controllers/foodController");
const mongoose = require("mongoose");

describe("FoodController", () => {
  let mockFood;
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
    // Setup mock Food model
    mockFood = {
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    // Mock constructor for creating new Food
    mockFood.mockImplementation = jest.fn((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({ _id: "mockId", ...data }),
    }));

    // Create controller with mocked dependencies
    controller = createFoodController({ Food: mockFood });

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

  describe("getAllFoods", () => {
    it("should return all foods without filter", async () => {
      const mockFoods = [
        { _id: "1", name: "Bắp rang", price: 50000 },
        { _id: "2", name: "Coca Cola", price: 30000 },
      ];
      mockFood.find.mockResolvedValue(mockFoods);

      await controller.getAllFoods(mockReq, mockRes);

      expect(mockFood.find).toHaveBeenCalledWith({});
      expect(mockRes.json).toHaveBeenCalledWith(mockFoods);
    });

    it("should return foods filtered by isAvailable=true", async () => {
      mockReq.query.isAvailable = "true";
      const mockFoods = [{ _id: "1", name: "Bắp rang", price: 50000, isAvailable: true }];
      mockFood.find.mockResolvedValue(mockFoods);

      await controller.getAllFoods(mockReq, mockRes);

      expect(mockFood.find).toHaveBeenCalledWith({ isAvailable: true });
      expect(mockRes.json).toHaveBeenCalledWith(mockFoods);
    });

    it("should return foods filtered by isAvailable=false", async () => {
      mockReq.query.isAvailable = "false";
      const mockFoods = [];
      mockFood.find.mockResolvedValue(mockFoods);

      await controller.getAllFoods(mockReq, mockRes);

      expect(mockFood.find).toHaveBeenCalledWith({ isAvailable: false });
      expect(mockRes.json).toHaveBeenCalledWith(mockFoods);
    });

    it("should return 500 error when database fails", async () => {
      mockFood.find.mockRejectedValue(new Error("Database error"));

      await controller.getAllFoods(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi lấy danh sách món ăn",
      });
    });
  });

  describe("getFoodById", () => {
    it("should return food by valid ID", async () => {
      const mockFoodItem = { _id: "507f1f77bcf86cd799439011", name: "Bắp rang", price: 50000 };
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockFood.findById.mockResolvedValue(mockFoodItem);

      await controller.getFoodById(mockReq, mockRes);

      expect(mockFood.findById).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
      expect(mockRes.json).toHaveBeenCalledWith(mockFoodItem);
    });

    it("should return 400 for invalid ID format", async () => {
      mockReq.params.id = "invalid-id";

      await controller.getFoodById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "ID không hợp lệ" });
    });

    it("should return 404 when food not found", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockFood.findById.mockResolvedValue(null);

      await controller.getFoodById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Không tìm thấy món ăn",
      });
    });

    it("should return 500 error when database fails", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockFood.findById.mockRejectedValue(new Error("Database error"));

      await controller.getFoodById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi lấy món ăn",
      });
    });
  });

  describe("createFood", () => {
    it("should create food with JSON body", async () => {
      mockReq.body = {
        name: "Bắp rang bơ",
        price: 55000,
        type: "bắp",
        description: "Bắp rang với bơ thơm ngon",
      };

      const mockSave = jest.fn().mockResolvedValue({
        _id: "mockId",
        ...mockReq.body,
      });

      // Mock the Food constructor
      const MockFoodConstructor = jest.fn().mockImplementation((data) => ({
        ...data,
        save: mockSave,
      }));

      controller = createFoodController({ Food: MockFoodConstructor });

      await controller.createFood(mockReq, mockRes);

      expect(MockFoodConstructor).toHaveBeenCalledWith(mockReq.body);
      expect(mockSave).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Thêm món ăn thành công",
        food: expect.objectContaining({
          name: "Bắp rang bơ",
          price: 55000,
        }),
      });
    });

    it("should create food with form-data", async () => {
      mockReq.body = {
        data: JSON.stringify({
          name: "Coca Cola",
          price: 30000,
          type: "nước",
        }),
      };

      const mockSave = jest.fn().mockResolvedValue({
        _id: "mockId",
        name: "Coca Cola",
        price: 30000,
        type: "nước",
      });

      const MockFoodConstructor = jest.fn().mockImplementation((data) => ({
        ...data,
        save: mockSave,
      }));

      controller = createFoodController({ Food: MockFoodConstructor });

      await controller.createFood(mockReq, mockRes);

      expect(mockSave).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should create food with image upload", async () => {
      mockReq.body = {
        name: "Combo 1",
        price: 100000,
        type: "combo",
      };
      mockReq.file = {
        filename: "test-image.jpg",
      };

      const mockSave = jest.fn().mockResolvedValue({
        _id: "mockId",
        ...mockReq.body,
        imageUrl: "uploads\\test-image.jpg",
      });

      const MockFoodConstructor = jest.fn().mockImplementation((data) => ({
        ...data,
        save: mockSave,
      }));

      controller = createFoodController({ Food: MockFoodConstructor });

      await controller.createFood(mockReq, mockRes);

      expect(MockFoodConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: expect.stringContaining("test-image.jpg"),
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should return 400 for invalid JSON in data field", async () => {
      mockReq.body = {
        data: "invalid-json{",
      };

      await controller.createFood(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Dữ liệu JSON trong 'data' không hợp lệ",
      });
    });

    it("should return 400 when missing required fields", async () => {
      mockReq.body = {
        description: "Only description",
      };

      await controller.createFood(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Thiếu trường bắt buộc: name hoặc price",
      });
    });

    it("should return 400 error when save fails", async () => {
      mockReq.body = {
        name: "Test Food",
        price: 50000,
      };

      const mockSave = jest
        .fn()
        .mockRejectedValue(new Error("Validation error"));

      const MockFoodConstructor = jest.fn().mockImplementation((data) => ({
        ...data,
        save: mockSave,
      }));

      controller = createFoodController({ Food: MockFoodConstructor });

      await controller.createFood(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi thêm món ăn",
        details: "Validation error",
      });
    });
  });

  describe("updateFood", () => {
    it("should update food successfully", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body = {
        data: JSON.stringify({
          name: "Bắp rang updated",
          price: 60000,
        }),
      };

      const updatedFood = {
        _id: "507f1f77bcf86cd799439011",
        name: "Bắp rang updated",
        price: 60000,
      };

      mockFood.findByIdAndUpdate.mockResolvedValue(updatedFood);

      await controller.updateFood(mockReq, mockRes);

      expect(mockFood.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        { name: "Bắp rang updated", price: 60000 },
        { new: true }
      );
      expect(mockRes.json).toHaveBeenCalledWith(updatedFood);
    });

    it("should return 400 for invalid ID", async () => {
      mockReq.params.id = "invalid-id";
      mockReq.body = { data: "{}" };

      await controller.updateFood(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "ID không hợp lệ" });
    });

    it("should update food with image", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body = {
        data: JSON.stringify({ name: "Updated food" }),
      };
      mockReq.file = {
        filename: "new-image.jpg",
      };

      const updatedFood = {
        _id: "507f1f77bcf86cd799439011",
        name: "Updated food",
        imageUrl: "uploads\\new-image.jpg",
      };

      mockFood.findByIdAndUpdate.mockResolvedValue(updatedFood);

      await controller.updateFood(mockReq, mockRes);

      expect(mockFood.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        expect.objectContaining({
          name: "Updated food",
          imageUrl: expect.stringContaining("new-image.jpg"),
        }),
        { new: true }
      );
      expect(mockRes.json).toHaveBeenCalledWith(updatedFood);
    });

    it("should return 404 when food not found", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body = { data: '{"name": "Test"}' };
      mockFood.findByIdAndUpdate.mockResolvedValue(null);

      await controller.updateFood(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Món ăn không tồn tại",
      });
    });

    it("should return 500 error when update fails", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockReq.body = { data: "{}" };
      mockFood.findByIdAndUpdate.mockRejectedValue(new Error("Database error"));

      await controller.updateFood(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi máy chủ",
        details: "Database error",
      });
    });
  });

  describe("deleteFood", () => {
    it("should delete food successfully", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      const deletedFood = { _id: "507f1f77bcf86cd799439011", name: "Deleted food" };
      mockFood.findByIdAndDelete.mockResolvedValue(deletedFood);

      await controller.deleteFood(mockReq, mockRes);

      expect(mockFood.findByIdAndDelete).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Xóa món ăn thành công",
      });
    });

    it("should return 404 when food not found", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockFood.findByIdAndDelete.mockResolvedValue(null);

      await controller.deleteFood(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Không tìm thấy món ăn để xóa",
      });
    });

    it("should return 400 error when delete fails", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockFood.findByIdAndDelete.mockRejectedValue(
        new Error("Database error")
      );

      await controller.deleteFood(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi xóa món ăn",
        details: "Database error",
      });
    });
  });
});
