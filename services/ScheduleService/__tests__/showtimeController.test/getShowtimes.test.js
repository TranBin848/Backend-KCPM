const getShowtimes = require("../../controllers/showtimeController/getShowtimes");

describe("getShowtimes", () => {
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
      find: jest.fn(),
    };

    handler = getShowtimes({ Showtime: mockShowtime });

    mockReq = {
      query: {},
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
    it("should return all showtimes without filters", async () => {
      const mockShowtimes = [
        { _id: "1", movie: { title: "Movie 1" } },
        { _id: "2", movie: { title: "Movie 2" } },
      ];

      mockShowtime.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockShowtimes),
      });

      await handler(mockReq, mockRes);

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

      await handler(mockReq, mockRes);

      expect(mockShowtime.find).toHaveBeenCalledWith({
        "theater.theaterId": "1",
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should filter showtimes by roomId", async () => {
      mockReq.query = { roomId: "101" };

      const mockShowtimes = [{ _id: "1", room: { roomId: 101 } }];

      mockShowtime.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockShowtimes),
      });

      await handler(mockReq, mockRes);

      expect(mockShowtime.find).toHaveBeenCalledWith({
        "room.roomId": "101",
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should filter showtimes by date", async () => {
      mockReq.query = { date: "2024-12-31" };

      const mockShowtimes = [{ _id: "1", date: new Date("2024-12-31") }];

      mockShowtime.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockShowtimes),
      });

      await handler(mockReq, mockRes);

      expect(mockShowtime.find).toHaveBeenCalledWith({
        date: new Date("2024-12-31"),
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should filter showtimes by movieId", async () => {
      mockReq.query = { movieId: "507f1f77bcf86cd799439011" };

      const mockShowtimes = [
        { _id: "1", movie: { movieId: "507f1f77bcf86cd799439011" } },
      ];

      mockShowtime.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockShowtimes),
      });

      await handler(mockReq, mockRes);

      expect(mockShowtime.find).toHaveBeenCalledWith({
        "movie.movieId": "507f1f77bcf86cd799439011",
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should filter showtimes by multiple filters", async () => {
      mockReq.query = {
        theaterId: "1",
        roomId: "101",
        date: "2024-12-31",
        movieId: "507f1f77bcf86cd799439011",
      };

      const mockShowtimes = [{ _id: "1" }];

      mockShowtime.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockShowtimes),
      });

      await handler(mockReq, mockRes);

      expect(mockShowtime.find).toHaveBeenCalledWith({
        "theater.theaterId": "1",
        "room.roomId": "101",
        date: new Date("2024-12-31"),
        "movie.movieId": "507f1f77bcf86cd799439011",
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe("Not found errors", () => {
    it("should return 404 when no showtimes found", async () => {
      mockShowtime.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Không có suất chiếu nào phù hợp",
      });
    });
  });

  describe("Error handling", () => {
    it("should return 500 on database error", async () => {
      mockShowtime.find.mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error("Database error")),
      });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi lấy thông tin suất chiếu",
      });
    });
  });
});

