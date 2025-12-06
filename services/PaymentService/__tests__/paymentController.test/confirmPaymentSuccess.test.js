const confirmPaymentSuccess = require("../../controllers/paymentController/confirmPaymentSuccess");

describe("confirmPaymentSuccess", () => {
  let mockPoolUsers;
  let mockPoolBookings;
  let handler;
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
    // Setup mock PostgreSQL pools
    mockPoolUsers = {
      query: jest.fn(),
    };

    mockPoolBookings = {
      query: jest.fn(),
    };

    // Create handler with mocked dependencies
    handler = confirmPaymentSuccess({
      poolUsers: mockPoolUsers,
      poolBookings: mockPoolBookings,
    });

    // Setup mock request and response
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
    it("should confirm payment successfully without food booking", async () => {
      mockReq.body = {
        bookingId: 1,
        userId: 10,
        usedPoints: 0,
      };

      // Mock booking query
      mockPoolBookings.query
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ total_price: "100000" }],
        })
        // Mock update booking status
        .mockResolvedValueOnce({ rowCount: 1 });

      // Mock update user points
      mockPoolUsers.query.mockResolvedValueOnce({ rowCount: 1 });

      await handler(mockReq, mockRes);

      expect(mockPoolBookings.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT total_price FROM booking"),
        [1]
      );
      expect(mockPoolBookings.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE booking SET status = 'PAID'"),
        [1]
      );
      expect(mockPoolUsers.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE users SET points"),
        [5, 0, 10]
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Thanh toán và cập nhật điểm thành công",
        earnedPoints: 5,
        totalPaid: 100000,
      });
    });

    it("should confirm payment successfully with food booking", async () => {
      mockReq.body = {
        bookingId: 1,
        userId: 10,
        usedPoints: 10,
        foodBookingId: 5,
      };

      // Mock booking query
      mockPoolBookings.query
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ total_price: "100000" }],
        })
        // Mock food booking query
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ total_price: "50000" }],
        })
        // Mock update food booking status
        .mockResolvedValueOnce({ rowCount: 1 })
        // Mock update booking status
        .mockResolvedValueOnce({ rowCount: 1 });

      // Mock update user points
      mockPoolUsers.query.mockResolvedValueOnce({ rowCount: 1 });

      await handler(mockReq, mockRes);

      expect(mockPoolBookings.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT total_price FROM booking"),
        [1]
      );
      expect(mockPoolBookings.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT total_price FROM food_booking"),
        [5]
      );
      expect(mockPoolBookings.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE food_booking SET status = 'PAID'"),
        [5]
      );
      expect(mockPoolUsers.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE users SET points"),
        [8, 10, 10]
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Thanh toán và cập nhật điểm thành công",
        earnedPoints: 8,
        totalPaid: 150000,
      });
    });

    it("should calculate points correctly with usedPoints", async () => {
      mockReq.body = {
        bookingId: 1,
        userId: 10,
        usedPoints: 50,
      };

      // Mock booking with 200000 VND
      mockPoolBookings.query
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ total_price: "200000" }],
        })
        .mockResolvedValueOnce({ rowCount: 1 });

      mockPoolUsers.query.mockResolvedValueOnce({ rowCount: 1 });

      await handler(mockReq, mockRes);

      // Earned points = (200000 / 1000) * 0.05 = 10 points
      expect(mockPoolUsers.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE users SET points"),
        [10, 50, 10]
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Thanh toán và cập nhật điểm thành công",
        earnedPoints: 10,
        totalPaid: 200000,
      });
    });

    it("should handle default usedPoints value when not provided", async () => {
      mockReq.body = {
        bookingId: 1,
        userId: 10,
        // usedPoints not provided, should default to 0
      };

      mockPoolBookings.query
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ total_price: "100000" }],
        })
        .mockResolvedValueOnce({ rowCount: 1 });

      mockPoolUsers.query.mockResolvedValueOnce({ rowCount: 1 });

      await handler(mockReq, mockRes);

      expect(mockPoolUsers.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE users SET points"),
        [5, 0, 10] // usedPoints should be 0
      );
    });

    it("should handle zero total_price correctly", async () => {
      mockReq.body = {
        bookingId: 1,
        userId: 10,
        usedPoints: 0,
      };

      mockPoolBookings.query
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ total_price: "0" }],
        })
        .mockResolvedValueOnce({ rowCount: 1 });

      mockPoolUsers.query.mockResolvedValueOnce({ rowCount: 1 });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Thanh toán và cập nhật điểm thành công",
        earnedPoints: 0,
        totalPaid: 0,
      });
    });

    it("should handle null total_price correctly", async () => {
      mockReq.body = {
        bookingId: 1,
        userId: 10,
        usedPoints: 0,
      };

      mockPoolBookings.query
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ total_price: null }],
        })
        .mockResolvedValueOnce({ rowCount: 1 });

      mockPoolUsers.query.mockResolvedValueOnce({ rowCount: 1 });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Thanh toán và cập nhật điểm thành công",
        earnedPoints: 0,
        totalPaid: 0,
      });
    });
  });

  describe("Validation errors", () => {
    it("should return 400 when bookingId is missing", async () => {
      mockReq.body = {
        userId: 10,
      };

      await handler(mockReq, mockRes);

      expect(mockPoolBookings.query).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Thiếu thông tin xác nhận thanh toán",
      });
    });

    it("should return 400 when userId is missing", async () => {
      mockReq.body = {
        bookingId: 1,
      };

      await handler(mockReq, mockRes);

      expect(mockPoolBookings.query).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Thiếu thông tin xác nhận thanh toán",
      });
    });

    it("should return 400 when both bookingId and userId are missing", async () => {
      mockReq.body = {};

      await handler(mockReq, mockRes);

      expect(mockPoolBookings.query).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Thiếu thông tin xác nhận thanh toán",
      });
    });
  });

  describe("Not found errors", () => {
    it("should return 404 when booking not found", async () => {
      mockReq.body = {
        bookingId: 999,
        userId: 10,
      };

      mockPoolBookings.query.mockResolvedValueOnce({
        rowCount: 0,
        rows: [],
      });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Booking không tồn tại",
      });
      expect(mockPoolUsers.query).not.toHaveBeenCalled();
    });

    it("should return 404 when food booking not found", async () => {
      mockReq.body = {
        bookingId: 1,
        userId: 10,
        foodBookingId: 999,
      };

      // Mock booking query success
      mockPoolBookings.query
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ total_price: "100000" }],
        })
        // Mock food booking query fails
        .mockResolvedValueOnce({
          rowCount: 0,
          rows: [],
        });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Food booking không tồn tại",
      });
      expect(mockPoolUsers.query).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("should return 500 when database query fails", async () => {
      mockReq.body = {
        bookingId: 1,
        userId: 10,
      };

      const dbError = new Error("Database connection error");
      mockPoolBookings.query.mockRejectedValueOnce(dbError);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi máy chủ khi cập nhật thanh toán",
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Lỗi khi xác nhận thanh toán:",
        dbError
      );
    });

    it("should return 500 when update booking fails", async () => {
      mockReq.body = {
        bookingId: 1,
        userId: 10,
      };

      mockPoolBookings.query
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ total_price: "100000" }],
        })
        .mockRejectedValueOnce(new Error("Update failed"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi máy chủ khi cập nhật thanh toán",
      });
    });

    it("should return 500 when update user points fails", async () => {
      mockReq.body = {
        bookingId: 1,
        userId: 10,
      };

      mockPoolBookings.query
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ total_price: "100000" }],
        })
        .mockResolvedValueOnce({ rowCount: 1 });

      mockPoolUsers.query.mockRejectedValueOnce(new Error("User update failed"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi máy chủ khi cập nhật thanh toán",
      });
    });
  });

  describe("Points calculation", () => {
    it("should round points correctly", async () => {
      mockReq.body = {
        bookingId: 1,
        userId: 10,
        usedPoints: 0,
      };

      // 150000 VND = 7.5 points, should round to 8
      mockPoolBookings.query
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ total_price: "150000" }],
        })
        .mockResolvedValueOnce({ rowCount: 1 });

      mockPoolUsers.query.mockResolvedValueOnce({ rowCount: 1 });

      await handler(mockReq, mockRes);

      // (150000 / 1000) * 0.05 = 7.5, rounded = 8
      expect(mockPoolUsers.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE users SET points"),
        [8, 0, 10]
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          earnedPoints: 8,
        })
      );
    });

    it("should calculate points for large amounts", async () => {
      mockReq.body = {
        bookingId: 1,
        userId: 10,
        usedPoints: 0,
      };

      // 1000000 VND = 50 points
      mockPoolBookings.query
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ total_price: "1000000" }],
        })
        .mockResolvedValueOnce({ rowCount: 1 });

      mockPoolUsers.query.mockResolvedValueOnce({ rowCount: 1 });

      await handler(mockReq, mockRes);

      expect(mockPoolUsers.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE users SET points"),
        [50, 0, 10]
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          earnedPoints: 50,
        })
      );
    });
  });
});

