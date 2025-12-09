const getShowtimeById = require("../../controllers/showtimeController/getShowtimeById");

describe("getShowtimeById", () => {
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
      findById: jest.fn(),
    };

    handler = getShowtimeById({ Showtime: mockShowtime });

    mockReq = {
      params: {},
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
    it("should return showtime by ID", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      const mockShowtime_item = {
        _id: "507f1f77bcf86cd799439011",
        movie: { title: "Test Movie" },
        theater: { theaterId: 1 },
        room: { roomId: 101 },
      };

      mockShowtime.findById.mockResolvedValue(mockShowtime_item);

      await handler(mockReq, mockRes);

      expect(mockShowtime.findById).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        showtime: mockShowtime_item,
      });
    });

    it("should return showtime with all fields", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      const mockShowtime_item = {
        _id: "507f1f77bcf86cd799439011",
        movie: {
          movieId: "507f1f77bcf86cd799439011",
          title: "Test Movie",
          duration: 120,
        },
        theater: {
          theaterId: 1,
          theaterName: "Theater 1",
        },
        room: {
          roomId: 101,
          roomName: "Room A",
        },
        startTime: new Date(),
        endTime: new Date(),
        date: new Date(),
        priceRegular: 50000,
        priceVIP: 80000,
        showtimeType: "2D",
      };

      mockShowtime.findById.mockResolvedValue(mockShowtime_item);

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        showtime: mockShowtime_item,
      });
    });
  });

  describe("Not found errors", () => {
    it("should return 404 when showtime not found", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockShowtime.findById.mockResolvedValue(null);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Không tìm thấy suất chiếu",
      });
    });
  });

  describe("Error handling", () => {
    it("should return 500 on database error", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockShowtime.findById.mockRejectedValue(new Error("Database error"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi lấy thông tin suất chiếu",
      });
    });

    it("should return 500 on mongoose error", async () => {
      mockReq.params.id = "invalid-id";
      mockShowtime.findById.mockRejectedValue(
        new Error("Cast to ObjectId failed")
      );

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi lấy thông tin suất chiếu",
      });
    });
  });
});

