const sendOTP = require("../../controllers/userController/sendOTP");

describe("sendOTP", () => {
  let mockPool;
  let mockOtpStore;
  let mockSendEmail;
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

    mockOtpStore = new Map();
    mockOtpStore.set = jest.fn();
    mockOtpStore.get = jest.fn();
    mockOtpStore.delete = jest.fn();

    mockSendEmail = jest.fn();

    handler = sendOTP({
      pool: mockPool,
      otpStore: mockOtpStore,
      sendEmail: mockSendEmail,
    });

    mockReq = {
      body: {},
    };

    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    jest.spyOn(Date, "now").mockReturnValue(1700000000000);
    jest.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.clearAllMocks();
    Date.now.mockRestore();
    Math.random.mockRestore();
  });

  describe("Success cases", () => {
    it("should send OTP successfully", async () => {
      mockReq.body = { email: "user@example.com" };
      mockPool.query.mockResolvedValue({
        rows: [{ id: 1 }],
      });
      mockSendEmail.mockResolvedValue(true);

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT id FROM users WHERE email = $1",
        ["user@example.com"]
      );
      expect(mockOtpStore.set).toHaveBeenCalledWith("user@example.com", {
        otp: expect.any(String),
        expiresAt: expect.any(Number),
      });
      expect(mockSendEmail).toHaveBeenCalledWith(
        "user@example.com",
        "Mã OTP đặt lại mật khẩu của bạn",
        expect.stringContaining("Mã OTP của bạn là:")
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "OTP đã được gửi đến email.",
      });
    });

    it("should generate 6-digit OTP", async () => {
      mockReq.body = { email: "test@example.com" };
      mockPool.query.mockResolvedValue({ rows: [{ id: 1 }] });
      mockSendEmail.mockResolvedValue(true);

      await handler(mockReq, mockRes);

      const otpCall = mockOtpStore.set.mock.calls[0][1];
      expect(otpCall.otp).toMatch(/^\d{6}$/);
      expect(parseInt(otpCall.otp)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(otpCall.otp)).toBeLessThanOrEqual(999999);
    });

    it("should set OTP with 5 minute expiry", async () => {
      mockReq.body = { email: "test@example.com" };
      mockPool.query.mockResolvedValue({ rows: [{ id: 1 }] });
      mockSendEmail.mockResolvedValue(true);

      const now = Date.now();
      await handler(mockReq, mockRes);

      const otpCall = mockOtpStore.set.mock.calls[0][1];
      expect(otpCall.expiresAt).toBe(now + 5 * 60 * 1000);
    });

    it("should send email with correct subject and OTP in text", async () => {
      mockReq.body = { email: "user@example.com" };
      mockPool.query.mockResolvedValue({ rows: [{ id: 1 }] });
      mockSendEmail.mockResolvedValue(true);

      await handler(mockReq, mockRes);

      expect(mockSendEmail).toHaveBeenCalledWith(
        "user@example.com",
        "Mã OTP đặt lại mật khẩu của bạn",
        expect.stringContaining("Mã có hiệu lực trong 5 phút")
      );
    });

    it("should handle email with uppercase letters", async () => {
      mockReq.body = { email: "USER@EXAMPLE.COM" };
      mockPool.query.mockResolvedValue({ rows: [{ id: 1 }] });
      mockSendEmail.mockResolvedValue(true);

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "OTP đã được gửi đến email.",
      });
    });
  });

  describe("Validation cases", () => {
    it("should return 400 when email is missing", async () => {
      mockReq.body = {};

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Email là bắt buộc.",
      });
    });

    it("should return 400 when email is null", async () => {
      mockReq.body = { email: null };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when email is empty string", async () => {
      mockReq.body = { email: "" };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 when email does not exist", async () => {
      mockReq.body = { email: "nonexistent@example.com" };
      mockPool.query.mockResolvedValue({ rows: [] });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Email không tồn tại.",
      });
    });
  });

  describe("Error cases", () => {
    it("should return 500 on database error", async () => {
      mockReq.body = { email: "user@example.com" };
      mockPool.query.mockRejectedValue(new Error("Database error"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server khi gửi OTP: Database error",
      });
    });

    it("should return 500 when email sending fails", async () => {
      mockReq.body = { email: "user@example.com" };
      mockPool.query.mockResolvedValue({ rows: [{ id: 1 }] });
      mockSendEmail.mockRejectedValue(new Error("Email service unavailable"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server khi gửi OTP: Email service unavailable",
      });
    });

    it("should return 500 on connection timeout", async () => {
      mockReq.body = { email: "user@example.com" };
      mockPool.query.mockRejectedValue(new Error("Connection timeout"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe("Edge cases", () => {
    it("should replace existing OTP if called multiple times", async () => {
      mockReq.body = { email: "user@example.com" };
      mockPool.query.mockResolvedValue({ rows: [{ id: 1 }] });
      mockSendEmail.mockResolvedValue(true);

      await handler(mockReq, mockRes);
      await handler(mockReq, mockRes);

      expect(mockOtpStore.set).toHaveBeenCalledTimes(2);
    });

    it("should handle email with special characters", async () => {
      mockReq.body = { email: "user+test@example.com" };
      mockPool.query.mockResolvedValue({ rows: [{ id: 1 }] });
      mockSendEmail.mockResolvedValue(true);

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "OTP đã được gửi đến email.",
      });
    });

    it("should handle very long email addresses", async () => {
      const longEmail = "a".repeat(50) + "@example.com";
      mockReq.body = { email: longEmail };
      mockPool.query.mockResolvedValue({ rows: [{ id: 1 }] });
      mockSendEmail.mockResolvedValue(true);

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "OTP đã được gửi đến email.",
      });
    });
  });
});
