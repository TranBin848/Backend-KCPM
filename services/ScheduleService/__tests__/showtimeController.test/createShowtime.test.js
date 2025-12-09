const createShowtime = require("../../controllers/showtimeController/createShowtime");

describe("createShowtime", () => {
  let mockShowtime;
  let mockFetchMovieById;
  let mockFetchRoomsByTheater;
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
      findOne: jest.fn(),
    };

    mockFetchMovieById = jest.fn();
    mockFetchRoomsByTheater = jest.fn();

    handler = createShowtime({
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

  describe("Success cases", () => {
    it("should create showtime successfully", async () => {
      mockReq.body = {
        theaterId: 1,
        roomId: 101,
        movieId: "507f1f77bcf86cd799439011",
        date: "2024-12-31",
        startTime: "19:00",
        priceRegular: 50000,
        priceVIP: 80000,
        showtimeType: "2D",
      };

      const mockMovie = {
        title: "Test Movie",
        duration: 120,
      };

      const mockRooms = [
        {
          id: 101,
          name: "Theater 1",
          room_name: "Room A",
          room_type: "2D",
        },
      ];

      mockFetchMovieById.mockResolvedValue(mockMovie);
      mockFetchRoomsByTheater.mockResolvedValue(mockRooms);
      mockShowtime.findOne.mockResolvedValue(null);

      const mockSave = jest.fn().mockResolvedValue({
        _id: "mockId",
        ...mockReq.body,
      });

      const MockShowtimeConstructor = jest.fn().mockImplementation((data) => ({
        ...data,
        save: mockSave,
      }));

      handler = createShowtime({
        Showtime: MockShowtimeConstructor,
        fetchMovieById: mockFetchMovieById,
        fetchRoomsByTheater: mockFetchRoomsByTheater,
      });

      MockShowtimeConstructor.findOne = mockShowtime.findOne;

      await handler(mockReq, mockRes);

      expect(mockFetchMovieById).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
      expect(mockFetchRoomsByTheater).toHaveBeenCalledWith(1);
      expect(mockSave).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Tạo suất chiếu thành công",
        showtime: expect.any(Object),
      });
    });
  });

  describe("Validation errors", () => {
    it("should return 400 when missing required fields", async () => {
      mockReq.body = {
        theaterId: 1,
        roomId: 101,
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.stringContaining("Thiếu thông tin bắt buộc"),
      });
    });

    it("should return 400 when priceRegular is null", async () => {
      mockReq.body = {
        theaterId: 1,
        roomId: 101,
        movieId: "507f1f77bcf86cd799439011",
        date: "2024-12-31",
        startTime: "19:00",
        priceRegular: null,
        priceVIP: 80000,
        showtimeType: "2D",
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when priceVIP is null", async () => {
      mockReq.body = {
        theaterId: 1,
        roomId: 101,
        movieId: "507f1f77bcf86cd799439011",
        date: "2024-12-31",
        startTime: "19:00",
        priceRegular: 50000,
        priceVIP: null,
        showtimeType: "2D",
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Not found errors", () => {
    it("should return 400 when movie not found", async () => {
      mockReq.body = {
        theaterId: 1,
        roomId: 101,
        movieId: "507f1f77bcf86cd799439011",
        date: "2024-12-31",
        startTime: "19:00",
        priceRegular: 50000,
        priceVIP: 80000,
        showtimeType: "2D",
      };

      mockFetchMovieById.mockResolvedValue(null);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Không tìm thấy thông tin phim",
      });
    });

    it("should return 400 when room not found in theater", async () => {
      mockReq.body = {
        theaterId: 1,
        roomId: 999,
        movieId: "507f1f77bcf86cd799439011",
        date: "2024-12-31",
        startTime: "19:00",
        priceRegular: 50000,
        priceVIP: 80000,
        showtimeType: "2D",
      };

      const mockMovie = { title: "Test Movie", duration: 120 };
      const mockRooms = [{ id: 101, name: "Theater 1", room_name: "Room A" }];

      mockFetchMovieById.mockResolvedValue(mockMovie);
      mockFetchRoomsByTheater.mockResolvedValue(mockRooms);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Phòng không thuộc rạp này hoặc không tồn tại",
      });
    });
  });

  describe("Conflict errors", () => {
    it("should return 409 when showtime conflicts", async () => {
      mockReq.body = {
        theaterId: 1,
        roomId: 101,
        movieId: "507f1f77bcf86cd799439011",
        date: "2024-12-31",
        startTime: "19:00",
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
      mockShowtime.findOne.mockResolvedValue({ _id: "existingShowtime" });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.stringContaining("Trùng lịch chiếu"),
      });
    });
  });

  describe("Error handling", () => {
    it("should return 500 on database error", async () => {
      mockReq.body = {
        theaterId: 1,
        roomId: 101,
        movieId: "507f1f77bcf86cd799439011",
        date: "2024-12-31",
        startTime: "19:00",
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

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi tạo suất chiếu",
      });
    });
  });
});

