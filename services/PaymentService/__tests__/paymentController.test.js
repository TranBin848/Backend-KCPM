const createPaymentController = require("../controllers/paymentController");

describe("PaymentController", () => {
  let mockPayOS;
  let mockPoolUsers;
  let mockPoolBookings;
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
    // Setup mock PayOS
    mockPayOS = {
      createPaymentLink: jest.fn(),
    };

    // Setup mock PostgreSQL pools
    mockPoolUsers = {
      query: jest.fn(),
    };

    mockPoolBookings = {
      query: jest.fn(),
    };

    // Create controller with mocked dependencies
    controller = createPaymentController({
      payOS: mockPayOS,
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

    // Mock environment variables
    process.env.RETURN_URL = "http://localhost:3000";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createPaymentLink", () => {
    it("should create payment link successfully", async () => {
      mockReq.body = {
        paymentCode: "PAY123",
        amount: 100000,
      };

      const mockPaymentLinkResponse = {
        checkoutUrl: "https://payos.vn/checkout/abc123",
      };

      mockPayOS.createPaymentLink.mockResolvedValue(mockPaymentLinkResponse);

      await controller.createPaymentLink(mockReq, mockRes);

      expect(mockPayOS.createPaymentLink).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 100000,
          description: "Thanh toán vé",
          returnUrl: "http://localhost:3000/payment-success",
          cancelUrl: "http://localhost:3000/",
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        checkoutUrl: "https://payos.vn/checkout/abc123",
      });
    });

    it("should return 400 when paymentCode is missing", async () => {
      mockReq.body = {
        amount: 100000,
      };

      await controller.createPaymentLink(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Thiếu thông tin yêu cầu",
      });
    });

    it("should return 400 when amount is missing", async () => {
      mockReq.body = {
        paymentCode: "PAY123",
      };

      await controller.createPaymentLink(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Thiếu thông tin yêu cầu",
      });
    });

    it("should return 500 when PayOS fails", async () => {
      mockReq.body = {
        paymentCode: "PAY123",
        amount: 100000,
      };

      mockPayOS.createPaymentLink.mockRejectedValue(
        new Error("PayOS API error")
      );

      await controller.createPaymentLink(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Không thể tạo link thanh toán",
      });
    });
  });

  describe("confirmPaymentSuccess", () => {
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

      await controller.confirmPaymentSuccess(mockReq, mockRes);

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

      await controller.confirmPaymentSuccess(mockReq, mockRes);

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

    it("should return 400 when bookingId is missing", async () => {
      mockReq.body = {
        userId: 10,
      };

      await controller.confirmPaymentSuccess(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Thiếu thông tin xác nhận thanh toán",
      });
    });

    it("should return 400 when userId is missing", async () => {
      mockReq.body = {
        bookingId: 1,
      };

      await controller.confirmPaymentSuccess(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Thiếu thông tin xác nhận thanh toán",
      });
    });

    it("should return 404 when booking not found", async () => {
      mockReq.body = {
        bookingId: 999,
        userId: 10,
      };

      mockPoolBookings.query.mockResolvedValueOnce({
        rowCount: 0,
        rows: [],
      });

      await controller.confirmPaymentSuccess(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Booking không tồn tại",
      });
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

      await controller.confirmPaymentSuccess(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Food booking không tồn tại",
      });
    });

    it("should return 500 when database operation fails", async () => {
      mockReq.body = {
        bookingId: 1,
        userId: 10,
      };

      mockPoolBookings.query.mockRejectedValueOnce(
        new Error("Database error")
      );

      await controller.confirmPaymentSuccess(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi máy chủ khi cập nhật thanh toán",
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

      await controller.confirmPaymentSuccess(mockReq, mockRes);

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
  });
});
