const verifyOTP = require("../../controllers/userController/verifyOTP");

describe("verifyOTP", () => {
  let mockOtpStore;
  let handler;
  let mockReq;
  let mockRes;

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  beforeEach(() => {
    mockOtpStore = new Map();
    mockOtpStore.set = jest.fn((key, value) => Map.prototype.set.call(mockOtpStore, key, value));
    mockOtpStore.get = jest.fn((key) => Map.prototype.get.call(mockOtpStore, key));
    mockOtpStore.delete = jest.fn((key) => Map.prototype.delete.call(mockOtpStore, key));

    handler = verifyOTP({ otpStore: mockOtpStore });

    mockReq = {
      body: {},
    };

    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
  });

  afterEach(() => {
    jest.clearAllMocks();
    Date.now.mockRestore();
  });

  describe("Success cases", () => {
    it("should verify OTP successfully", () => {
      mockReq.body = { email: "user@example.com", otp: "123456" };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Xác thực OTP thành công.",
      });
    });

    it("should verify OTP that expires in 1 second", () => {
      mockReq.body = { email: "user@example.com", otp: "123456" };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "123456",
        expiresAt: Date.now() + 1000,
      });

      handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Xác thực OTP thành công.",
      });
    });

    it("should handle email with uppercase letters", () => {
      mockReq.body = { email: "USER@EXAMPLE.COM", otp: "123456" };
      Map.prototype.set.call(mockOtpStore, "USER@EXAMPLE.COM", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Xác thực OTP thành công.",
      });
    });

    it("should handle OTP with leading zeros", () => {
      mockReq.body = { email: "user@example.com", otp: "000123" };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "000123",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Xác thực OTP thành công.",
      });
    });
  });

  describe("Validation cases", () => {
    it("should return 400 when email is missing", () => {
      mockReq.body = { otp: "123456" };

      handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Email và OTP là bắt buộc.",
      });
    });

    it("should return 400 when OTP is missing", () => {
      mockReq.body = { email: "user@example.com" };

      handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Email và OTP là bắt buộc.",
      });
    });

    it("should return 400 when both email and OTP are missing", () => {
      mockReq.body = {};

      handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when email is empty string", () => {
      mockReq.body = { email: "", otp: "123456" };

      handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when OTP is empty string", () => {
      mockReq.body = { email: "user@example.com", otp: "" };

      handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when email is null", () => {
      mockReq.body = { email: null, otp: "123456" };

      handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when OTP is null", () => {
      mockReq.body = { email: "user@example.com", otp: null };

      handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("OTP not found cases", () => {
    it("should return 400 when OTP record does not exist", () => {
      mockReq.body = { email: "nonexistent@example.com", otp: "123456" };

      handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "OTP không hợp lệ hoặc đã hết hạn.",
      });
    });

    it("should return 400 when OTP was never sent", () => {
      mockReq.body = { email: "user@example.com", otp: "123456" };

      handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("OTP expiration cases", () => {
    it("should return 400 when OTP has expired", () => {
      mockReq.body = { email: "user@example.com", otp: "123456" };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "123456",
        expiresAt: Date.now() - 1000,
      });

      handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "OTP đã hết hạn.",
      });
    });

    it("should delete OTP from store when expired", () => {
      mockReq.body = { email: "user@example.com", otp: "123456" };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "123456",
        expiresAt: Date.now() - 1000,
      });

      handler(mockReq, mockRes);

      expect(mockOtpStore.delete).toHaveBeenCalledWith("user@example.com");
    });

    it("should return 400 when OTP expires at exact current time", () => {
      mockReq.body = { email: "user@example.com", otp: "123456" };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "123456",
        expiresAt: Date.now(),
      });

      handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "OTP đã hết hạn.",
      });
    });

    it("should return 400 when OTP expired 5 minutes ago", () => {
      mockReq.body = { email: "user@example.com", otp: "123456" };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "123456",
        expiresAt: Date.now() - 5 * 60 * 1000,
      });

      handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Incorrect OTP cases", () => {
    it("should return 400 when OTP is incorrect", () => {
      mockReq.body = { email: "user@example.com", otp: "654321" };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "OTP không chính xác.",
      });
    });

    it("should not delete OTP when incorrect", () => {
      mockReq.body = { email: "user@example.com", otp: "654321" };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      handler(mockReq, mockRes);

      expect(mockOtpStore.delete).not.toHaveBeenCalled();
    });

    it("should be case-sensitive for OTP", () => {
      mockReq.body = { email: "user@example.com", otp: "ABC123" };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "abc123",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "OTP không chính xác.",
      });
    });

    it("should reject OTP with extra spaces", () => {
      mockReq.body = { email: "user@example.com", otp: " 123456 " };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should reject partial OTP match", () => {
      mockReq.body = { email: "user@example.com", otp: "12345" };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Edge cases", () => {
    it("should handle multiple OTP records for different emails", () => {
      Map.prototype.set.call(mockOtpStore, "user1@example.com", {
        otp: "111111",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
      Map.prototype.set.call(mockOtpStore, "user2@example.com", {
        otp: "222222",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      mockReq.body = { email: "user1@example.com", otp: "111111" };
      handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Xác thực OTP thành công.",
      });
    });

    it("should not verify OTP for different email", () => {
      Map.prototype.set.call(mockOtpStore, "user1@example.com", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      mockReq.body = { email: "user2@example.com", otp: "123456" };
      handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "OTP không hợp lệ hoặc đã hết hạn.",
      });
    });

    it("should handle numeric OTP as string", () => {
      mockReq.body = { email: "user@example.com", otp: "123456" };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Xác thực OTP thành công.",
      });
    });
  });
});
