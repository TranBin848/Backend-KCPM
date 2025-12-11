const deleteEmployee = require("../../controllers/userController/deleteEmployee");

describe("deleteEmployee", () => {
  let mockPool;
  let handler;
  let mockReq;
  let mockRes;

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
    };

    handler = deleteEmployee({ pool: mockPool });

    mockReq = {
      params: { id: "1" },
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
    it("should delete employee successfully", async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        "DELETE FROM users WHERE id = $1 AND role = 'employee'",
        [1]
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Xóa nhân viên thành công",
      });
    });

    it("should include WHERE role='employee' in query", async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("role = 'employee'"),
        expect.any(Array)
      );
    });

    it("should parse id from params as integer", async () => {
      mockReq.params.id = "123";
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), [123]);
    });

    it("should delete employee with large id", async () => {
      mockReq.params.id = "999999";
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Xóa nhân viên thành công",
      });
    });
  });

  describe("Not found cases", () => {
    it("should return 404 when employee does not exist", async () => {
      mockReq.params.id = "999";
      mockPool.query.mockResolvedValue({ rowCount: 0 });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Nhân viên không tồn tại hoặc không phải nhân viên",
      });
    });

    it("should return 404 when user exists but is not employee", async () => {
      mockReq.params.id = "5";
      mockPool.query.mockResolvedValue({ rowCount: 0 });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Nhân viên không tồn tại hoặc không phải nhân viên",
      });
    });

    it("should return 404 for non-existent id", async () => {
      mockReq.params.id = "0";
      mockPool.query.mockResolvedValue({ rowCount: 0 });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe("Error cases", () => {
    it("should return 500 on database error", async () => {
      mockPool.query.mockRejectedValue(new Error("Database connection lost"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server khi xóa nhân viên: Database connection lost",
      });
    });

    it("should return 500 on connection timeout", async () => {
      mockPool.query.mockRejectedValue(new Error("Connection timeout"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server khi xóa nhân viên: Connection timeout",
      });
    });

    it("should return 500 on query error", async () => {
      mockPool.query.mockRejectedValue(new Error("Query failed"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it("should handle foreign key constraint errors", async () => {
      const error = new Error("Foreign key violation");
      error.code = "23503";
      mockPool.query.mockRejectedValue(error);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe("Edge cases", () => {
    it("should handle id as string", async () => {
      mockReq.params.id = "10";
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), [10]);
    });

    it("should handle negative id", async () => {
      mockReq.params.id = "-1";
      mockPool.query.mockResolvedValue({ rowCount: 0 });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should handle id = 1", async () => {
      mockReq.params.id = "1";
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Xóa nhân viên thành công",
      });
    });

    it("should not delete users with role other than employee", async () => {
      mockReq.params.id = "5";
      mockPool.query.mockResolvedValue({ rowCount: 0 });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should handle multiple delete attempts for same id", async () => {
      mockReq.params.id = "1";
      mockPool.query
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({ rowCount: 0 });

      await handler(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Xóa nhân viên thành công",
      });

      jest.clearAllMocks();
      await handler(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});
