const updateShowtimePrices = require("../../controllers/showtimeController/updateShowtimePrices");

describe("updateShowtimePrices", () => {
  let mockShowtime;
  let handler;
  let mockReq;
  let mockRes;
  let consoleErrorSpy;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    mockShowtime = {
      updateMany: jest.fn(),
    };

    handler = updateShowtimePrices({ Showtime: mockShowtime });

    mockReq = {
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
    it("should update prices successfully", async () => {
      mockReq.body = {
        showtimeIds: ["id1", "id2"],
        priceRegular: 60000,
        priceVIP: 90000,
      };

      mockShowtime.updateMany.mockResolvedValue({
        modifiedCount: 2,
      });

      await handler(mockReq, mockRes);

      expect(mockShowtime.updateMany).toHaveBeenCalledWith(
        { _id: { $in: ["id1", "id2"] } },
        { $set: { priceRegular: 60000, priceVIP: 90000 } }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Cập nhật giá thành công",
        modifiedCount: 2,
      });
    });

    it("should update only priceRegular", async () => {
      mockReq.body = {
        showtimeIds: ["id1"],
        priceRegular: 60000,
      };

      mockShowtime.updateMany.mockResolvedValue({
        modifiedCount: 1,
      });

      await handler(mockReq, mockRes);

      expect(mockShowtime.updateMany).toHaveBeenCalledWith(
        { _id: { $in: ["id1"] } },
        { $set: { priceRegular: 60000 } }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should update only priceVIP", async () => {
      mockReq.body = {
        showtimeIds: ["id1"],
        priceVIP: 90000,
      };

      mockShowtime.updateMany.mockResolvedValue({
        modifiedCount: 1,
      });

      await handler(mockReq, mockRes);

      expect(mockShowtime.updateMany).toHaveBeenCalledWith(
        { _id: { $in: ["id1"] } },
        { $set: { priceVIP: 90000 } }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should return 0 modifiedCount when no showtimes match", async () => {
      mockReq.body = {
        showtimeIds: ["id1", "id2"],
        priceRegular: 60000,
        priceVIP: 90000,
      };

      mockShowtime.updateMany.mockResolvedValue({
        modifiedCount: 0,
      });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Cập nhật giá thành công",
        modifiedCount: 0,
      });
    });
  });

  describe("Validation errors", () => {
    it("should return 400 when showtimeIds is empty array", async () => {
      mockReq.body = {
        showtimeIds: [],
        priceRegular: 60000,
      };

      await handler(mockReq, mockRes);

      expect(mockShowtime.updateMany).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Danh sách suất chiếu không hợp lệ",
      });
    });

    it("should return 400 when showtimeIds is not an array", async () => {
      mockReq.body = {
        showtimeIds: "not-an-array",
        priceRegular: 60000,
      };

      await handler(mockReq, mockRes);

      expect(mockShowtime.updateMany).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Danh sách suất chiếu không hợp lệ",
      });
    });

    it("should return 400 when no prices provided", async () => {
      mockReq.body = {
        showtimeIds: ["id1"],
      };

      await handler(mockReq, mockRes);

      expect(mockShowtime.updateMany).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Cần cung cấp ít nhất một loại giá để cập nhật",
      });
    });

    it("should return 400 when both prices are null", async () => {
      mockReq.body = {
        showtimeIds: ["id1"],
        priceRegular: null,
        priceVIP: null,
      };

      await handler(mockReq, mockRes);

      expect(mockShowtime.updateMany).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Cần cung cấp ít nhất một loại giá để cập nhật",
      });
    });
  });

  describe("Error handling", () => {
    it("should return 500 on database error", async () => {
      mockReq.body = {
        showtimeIds: ["id1"],
        priceRegular: 60000,
      };

      mockShowtime.updateMany.mockRejectedValue(new Error("Database error"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server khi cập nhật giá",
      });
    });
  });
});

