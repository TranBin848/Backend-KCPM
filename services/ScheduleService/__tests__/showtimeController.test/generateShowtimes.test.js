const generateShowtimes = require("../../controllers/showtimeController/generateShowtimes");

describe("generateShowtimes", () => {
  let mockShowtime;
  let mockFetchMovieById;
  let mockFetchRoomsByTheater;
  let handler;
  let mockReq;
  let mockRes;
  let mockSession;
  let consoleErrorSpy;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    mockSession = {
      startTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      endSession: jest.fn(),
    };

    mockShowtime = {
      findOne: jest.fn(),
      startSession: jest.fn().mockResolvedValue(mockSession),
    };

    mockFetchMovieById = jest.fn();
    mockFetchRoomsByTheater = jest.fn();

    handler = generateShowtimes({
      Showtime: mockShowtime,
      fetchMovieById: mockFetchMovieById,
      fetchRoomsByTheater: mockFetchRoomsByTheater,
    });

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

  describe("Validation errors", () => {
    it("should return 400 when missing required fields", async () => {
      mockReq.body = {
        theaterId: 1,
        movieId: "507f1f77bcf86cd799439011",
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Thiếu thông tin bắt buộc",
      });
    });

    it("should return 400 when showtimesPerDay is empty", async () => {
      mockReq.body = {
        theaterId: 1,
        movieId: "507f1f77bcf86cd799439011",
        startDate: "2024-12-31",
        endDate: "2025-01-01",
        showtimesPerDay: [],
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Thiếu thông tin bắt buộc",
      });
    });
  });

  describe("Not found errors", () => {
    it("should return 404 when movie not found", async () => {
      mockReq.body = {
        theaterId: 1,
        movieId: "507f1f77bcf86cd799439011",
        startDate: "2024-12-31",
        endDate: "2025-01-01",
        showtimesPerDay: ["19:00"],
        priceRegular: 50000,
        priceVIP: 80000,
        showtimeType: "2D",
      };

      mockFetchMovieById.mockResolvedValue(null);

      await handler(mockReq, mockRes);

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Không tìm thấy phim",
      });
    });

    it("should return 404 when rooms not found", async () => {
      mockReq.body = {
        theaterId: 1,
        movieId: "507f1f77bcf86cd799439011",
        startDate: "2024-12-31",
        endDate: "2025-01-01",
        showtimesPerDay: ["19:00"],
        priceRegular: 50000,
        priceVIP: 80000,
        showtimeType: "2D",
      };

      const mockMovie = { title: "Test Movie", duration: 120 };
      mockFetchMovieById.mockResolvedValue(mockMovie);
      mockFetchRoomsByTheater.mockResolvedValue([]);

      await handler(mockReq, mockRes);

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Không tìm thấy phòng",
      });
    });

    it("should return 400 when no rooms match showtimeType", async () => {
      mockReq.body = {
        theaterId: 1,
        movieId: "507f1f77bcf86cd799439011",
        startDate: "2024-12-31",
        endDate: "2025-01-01",
        showtimesPerDay: ["19:00"],
        priceRegular: 50000,
        priceVIP: 80000,
        showtimeType: "IMAX",
      };

      const mockMovie = { title: "Test Movie", duration: 120 };
      const mockRooms = [
        { id: 101, name: "Theater 1", room_name: "Room A", room_type: "2D" },
      ];

      mockFetchMovieById.mockResolvedValue(mockMovie);
      mockFetchRoomsByTheater.mockResolvedValue(mockRooms);

      await handler(mockReq, mockRes);

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.stringContaining("Không có phòng phù hợp"),
      });
    });
  });

  describe("Conflict errors", () => {
    it("should return 409 when duplicate showtime exists", async () => {
      mockReq.body = {
        theaterId: 1,
        movieId: "507f1f77bcf86cd799439011",
        startDate: "2024-12-31",
        endDate: "2024-12-31",
        showtimesPerDay: ["19:00"],
        priceRegular: 50000,
        priceVIP: 80000,
        showtimeType: "2D",
      };

      const mockMovie = { title: "Test Movie", duration: 120 };
      const mockRooms = [
        { id: 101, name: "Theater 1", room_name: "Room A", room_type: "2D" },
      ];

      mockFetchMovieById.mockResolvedValue(mockMovie);
      mockFetchRoomsByTheater.mockResolvedValue(mockRooms);
      mockShowtime.findOne.mockResolvedValueOnce({ _id: "duplicate" });

      await handler(mockReq, mockRes);

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.stringContaining("đã tồn tại"),
      });
    });

    it("should return 409 when no available rooms", async () => {
      mockReq.body = {
        theaterId: 1,
        movieId: "507f1f77bcf86cd799439011",
        startDate: "2024-12-31",
        endDate: "2024-12-31",
        showtimesPerDay: ["19:00"],
        priceRegular: 50000,
        priceVIP: 80000,
        showtimeType: "2D",
      };

      const mockMovie = { title: "Test Movie", duration: 120 };
      const mockRooms = [
        { id: 101, name: "Theater 1", room_name: "Room A", room_type: "2D" },
      ];

      mockFetchMovieById.mockResolvedValue(mockMovie);
      mockFetchRoomsByTheater.mockResolvedValue(mockRooms);
      // First call: duplicate check (no duplicate)
      // Second call: conflict check (has conflict)
      mockShowtime.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ _id: "conflict" });

      await handler(mockReq, mockRes);

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.stringContaining("Không còn phòng trống"),
      });
    });
  });

  describe("Error handling", () => {
    it("should return 500 on database error", async () => {
      mockReq.body = {
        theaterId: 1,
        movieId: "507f1f77bcf86cd799439011",
        startDate: "2024-12-31",
        endDate: "2024-12-31",
        showtimesPerDay: ["19:00"],
        priceRegular: 50000,
        priceVIP: 80000,
        showtimeType: "2D",
      };

      const mockMovie = { title: "Test Movie", duration: 120 };
      const mockRooms = [
        { id: 101, name: "Theater 1", room_name: "Room A", room_type: "2D" },
      ];

      mockFetchMovieById.mockResolvedValue(mockMovie);
      mockFetchRoomsByTheater.mockResolvedValue(mockRooms);
      mockShowtime.findOne.mockRejectedValue(new Error("Database error"));

      await handler(mockReq, mockRes);

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi hệ thống khi tạo suất chiếu",
      });
    });
  });
});

