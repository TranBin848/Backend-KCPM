const getAllFoods = require("../../controllers/foodController/getAllFoods");

describe("getAllFoods", () => {
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
      find: jest.fn(),
    };

    // Create handler
    handler = getAllFoods({ Food: mockFood });

    // Mock request and response
    mockReq = {
      query: {},
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
    it("should return all foods when no filter is provided", async () => {
      const mockFoods = [
        { _id: "1", name: "Popcorn", price: 50000, isAvailable: true },
        { _id: "2", name: "Coke", price: 30000, isAvailable: false },
      ];

      mockFood.find.mockResolvedValue(mockFoods);

      await handler(mockReq, mockRes);

      expect(mockFood.find).toHaveBeenCalledWith({});
      expect(mockRes.json).toHaveBeenCalledWith(mockFoods);
    });

    it("should filter foods by isAvailable=true", async () => {
      const mockFoods = [
        { _id: "1", name: "Popcorn", price: 50000, isAvailable: true },
      ];

      mockReq.query.isAvailable = "true";
      mockFood.find.mockResolvedValue(mockFoods);

      await handler(mockReq, mockRes);

      expect(mockFood.find).toHaveBeenCalledWith({ isAvailable: true });
      expect(mockRes.json).toHaveBeenCalledWith(mockFoods);
    });

    it("should filter foods by isAvailable=false", async () => {
      const mockFoods = [
        { _id: "2", name: "Coke", price: 30000, isAvailable: false },
      ];

      mockReq.query.isAvailable = "false";
      mockFood.find.mockResolvedValue(mockFoods);

      await handler(mockReq, mockRes);

      expect(mockFood.find).toHaveBeenCalledWith({ isAvailable: false });
      expect(mockRes.json).toHaveBeenCalledWith(mockFoods);
    });

    it("should return empty array when no foods exist", async () => {
      mockFood.find.mockResolvedValue([]);

      await handler(mockReq, mockRes);

      expect(mockFood.find).toHaveBeenCalledWith({});
      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it("should handle string 'true' correctly", async () => {
      mockReq.query.isAvailable = "true";
      mockFood.find.mockResolvedValue([]);

      await handler(mockReq, mockRes);

      expect(mockFood.find).toHaveBeenCalledWith({ isAvailable: true });
    });

    it("should handle string 'false' correctly", async () => {
      mockReq.query.isAvailable = "false";
      mockFood.find.mockResolvedValue([]);

      await handler(mockReq, mockRes);

      expect(mockFood.find).toHaveBeenCalledWith({ isAvailable: false });
    });
  });

  describe("Error cases", () => {
    it("should return 500 error when database query fails", async () => {
      mockFood.find.mockRejectedValue(new Error("Database error"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi lấy danh sách món ăn",
      });
    });

    it("should handle database connection timeout", async () => {
      mockFood.find.mockRejectedValue(new Error("Connection timeout"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi lấy danh sách món ăn",
      });
    });

    it("should handle invalid query parameters gracefully", async () => {
      mockReq.query.isAvailable = "invalid";
      mockFood.find.mockResolvedValue([]);

      await handler(mockReq, mockRes);

      // Should not filter when value is not "true" or "false"
      expect(mockFood.find).toHaveBeenCalledWith({});
    });
  });

  describe("Edge cases", () => {
    it("should handle undefined isAvailable query", async () => {
      mockReq.query.isAvailable = undefined;
      mockFood.find.mockResolvedValue([]);

      await handler(mockReq, mockRes);

      expect(mockFood.find).toHaveBeenCalledWith({});
    });

    it("should handle null isAvailable query", async () => {
      mockReq.query.isAvailable = null;
      mockFood.find.mockResolvedValue([]);

      await handler(mockReq, mockRes);

      expect(mockFood.find).toHaveBeenCalledWith({});
    });

    it("should handle empty string isAvailable query", async () => {
      mockReq.query.isAvailable = "";
      mockFood.find.mockResolvedValue([]);

      await handler(mockReq, mockRes);

      expect(mockFood.find).toHaveBeenCalledWith({});
    });
  });
});
