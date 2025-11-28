const createShowtimeController = require("../controllers/showtimeController");

describe("ShowtimeController", () => {
  let mockShowtime;
  let mockFetchMovieById;
  let mockFetchRoomsByTheater;
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
    // Setup mock Showtime model
    mockShowtime = {
      findOne: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      updateMany: jest.fn(),
      findByIdAndDelete: jest.fn(),
      startSession: jest.fn(),
    };

    // Setup mock API functions
    mockFetchMovieById = jest.fn();
    mockFetchRoomsByTheater = jest.fn();

    // Create controller with mocked dependencies
    controller = createShowtimeController({
      Showtime: mockShowtime,
      fetchMovieById: mockFetchMovieById,
      fetchRoomsByTheater: mockFetchRoomsByTheater,
    });

    // Setup mock request and response
    mockReq = {
      params: {},
      query: {},
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

  describe("createShowtime", () => {
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

      controller = createShowtimeController({
        Showtime: MockShowtimeConstructor,
        fetchMovieById: mockFetchMovieById,
        fetchRoomsByTheater: mockFetchRoomsByTheater,
      });

      MockShowtimeConstructor.findOne = mockShowtime.findOne;

      await controller.createShowtime(mockReq, mockRes);

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

    it("should return 400 when missing required fields", async () => {
      mockReq.body = {
        theaterId: 1,
        roomId: 101,
      };

      await controller.createShowtime(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.stringContaining("Thiếu thông tin bắt buộc"),
      });
    });

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

      await controller.createShowtime(mockReq, mockRes);

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

      await controller.createShowtime(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Phòng không thuộc rạp này hoặc không tồn tại",
      });
    });

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

      await controller.createShowtime(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.stringContaining("Trùng lịch chiếu"),
      });
    });
  });

  describe("getShowtimes", () => {
    it("should return all showtimes without filters", async () => {
      const mockShowtimes = [
        { _id: "1", movie: { title: "Movie 1" } },
        { _id: "2", movie: { title: "Movie 2" } },
      ];

      mockShowtime.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockShowtimes),
      });

      await controller.getShowtimes(mockReq, mockRes);

      expect(mockShowtime.find).toHaveBeenCalledWith({});
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ showtimes: mockShowtimes });
    });

    it("should filter showtimes by theaterId", async () => {
      mockReq.query = { theaterId: "1" };

      const mockShowtimes = [{ _id: "1", theater: { theaterId: 1 } }];

      mockShowtime.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockShowtimes),
      });

      await controller.getShowtimes(mockReq, mockRes);

      expect(mockShowtime.find).toHaveBeenCalledWith({
        "theater.theaterId": "1",
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 when no showtimes found", async () => {
      mockShowtime.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      await controller.getShowtimes(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Không có suất chiếu nào phù hợp",
      });
    });

    it("should return 500 on database error", async () => {
      mockShowtime.find.mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error("Database error")),
      });

      await controller.getShowtimes(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi lấy thông tin suất chiếu",
      });
    });
  });

  describe("getShowtimeById", () => {
    it("should return showtime by ID", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      const mockShowtime_item = {
        _id: "507f1f77bcf86cd799439011",
        movie: { title: "Test Movie" },
      };

      mockShowtime.findById.mockResolvedValue(mockShowtime_item);

      await controller.getShowtimeById(mockReq, mockRes);

      expect(mockShowtime.findById).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        showtime: mockShowtime_item,
      });
    });

    it("should return 404 when showtime not found", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockShowtime.findById.mockResolvedValue(null);

      await controller.getShowtimeById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Không tìm thấy suất chiếu",
      });
    });

    it("should return 500 on database error", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockShowtime.findById.mockRejectedValue(new Error("Database error"));

      await controller.getShowtimeById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi lấy thông tin suất chiếu",
      });
    });
  });

  describe("updateShowtimePrices", () => {
    it("should update prices successfully", async () => {
      mockReq.body = {
        showtimeIds: ["id1", "id2"],
        priceRegular: 60000,
        priceVIP: 90000,
      };

      mockShowtime.updateMany.mockResolvedValue({
        modifiedCount: 2,
      });

      await controller.updateShowtimePrices(mockReq, mockRes);

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

    it("should return 400 when showtimeIds is invalid", async () => {
      mockReq.body = {
        showtimeIds: [],
        priceRegular: 60000,
      };

      await controller.updateShowtimePrices(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Danh sách suất chiếu không hợp lệ",
      });
    });

    it("should return 400 when no prices provided", async () => {
      mockReq.body = {
        showtimeIds: ["id1"],
      };

      await controller.updateShowtimePrices(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Cần cung cấp ít nhất một loại giá để cập nhật",
      });
    });

    it("should return 500 on database error", async () => {
      mockReq.body = {
        showtimeIds: ["id1"],
        priceRegular: 60000,
      };

      mockShowtime.updateMany.mockRejectedValue(new Error("Database error"));

      await controller.updateShowtimePrices(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server khi cập nhật giá",
      });
    });
  });

  describe("deleteShowtime", () => {
    it("should delete showtime successfully", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      const deletedShowtime = {
        _id: "507f1f77bcf86cd799439011",
        movie: { title: "Deleted Movie" },
      };

      mockShowtime.findByIdAndDelete.mockResolvedValue(deletedShowtime);

      await controller.deleteShowtime(mockReq, mockRes);

      expect(mockShowtime.findByIdAndDelete).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Xoá suất chiếu thành công",
      });
    });

    it("should return 404 when showtime not found", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockShowtime.findByIdAndDelete.mockResolvedValue(null);

      await controller.deleteShowtime(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Không tìm thấy suất chiếu để xoá",
      });
    });

    it("should return 500 on database error", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockShowtime.findByIdAndDelete.mockRejectedValue(
        new Error("Database error")
      );

      await controller.deleteShowtime(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server khi xoá suất chiếu",
      });
    });
  });
});
