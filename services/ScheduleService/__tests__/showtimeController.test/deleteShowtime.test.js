const deleteShowtime = require("../../controllers/showtimeController/deleteShowtime");

describe("deleteShowtime", () => {
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
      findByIdAndDelete: jest.fn(),
    };

    handler = deleteShowtime({ Showtime: mockShowtime });

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
    it("should delete showtime successfully", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      const deletedShowtime = {
        _id: "507f1f77bcf86cd799439011",
        movie: { title: "Deleted Movie" },
      };

      mockShowtime.findByIdAndDelete.mockResolvedValue(deletedShowtime);

      await handler(mockReq, mockRes);

      expect(mockShowtime.findByIdAndDelete).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Xoá suất chiếu thành công",
      });
    });
  });

  describe("Not found errors", () => {
    it("should return 404 when showtime not found", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockShowtime.findByIdAndDelete.mockResolvedValue(null);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Không tìm thấy suất chiếu để xoá",
      });
    });
  });

  describe("Error handling", () => {
    it("should return 500 on database error", async () => {
      mockReq.params.id = "507f1f77bcf86cd799439011";
      mockShowtime.findByIdAndDelete.mockRejectedValue(
        new Error("Database error")
      );

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server khi xoá suất chiếu",
      });
    });

    it("should return 500 on mongoose error", async () => {
      mockReq.params.id = "invalid-id";
      mockShowtime.findByIdAndDelete.mockRejectedValue(
        new Error("Cast to ObjectId failed")
      );

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server khi xoá suất chiếu",
      });
    });
  });
});

