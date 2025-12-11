const resetPassword = require("../../controllers/userController/resetPassword");

describe("resetPassword", () => {
  let mockPool;
  let mockBcrypt;
  let mockOtpStore;
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

    mockBcrypt = {
      hash: jest.fn(),
    };

    mockOtpStore = new Map();
    mockOtpStore.set = jest.fn((key, value) =>
      Map.prototype.set.call(mockOtpStore, key, value)
    );
    mockOtpStore.get = jest.fn((key) =>
      Map.prototype.get.call(mockOtpStore, key)
    );
    mockOtpStore.delete = jest.fn((key) =>
      Map.prototype.delete.call(mockOtpStore, key)
    );

    handler = resetPassword({
      pool: mockPool,
      bcrypt: mockBcrypt,
      otpStore: mockOtpStore,
    });

    mockReq = {
      body: {},
    };

    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    jest.spyOn(Date, "now").mockReturnValue(1700000000000);
  });

  afterEach(() => {
    jest.clearAllMocks();
    Date.now.mockRestore();
  });

  describe("Success cases", () => {
    it("should reset password successfully", async () => {
      mockReq.body = {
        email: "user@example.com",
        otp: "123456",
        newPassword: "newPassword123",
      };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 1 }],
      });
      mockBcrypt.hash.mockResolvedValue("hashedNewPassword");
      mockPool.query.mockResolvedValueOnce({});

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT id FROM users WHERE email = $1",
        ["user@example.com"]
      );
      expect(mockBcrypt.hash).toHaveBeenCalledWith("newPassword123", 10);
      expect(mockPool.query).toHaveBeenCalledWith(
        "UPDATE users SET password = $1 WHERE email = $2",
        ["hashedNewPassword", "user@example.com"]
      );
      expect(mockOtpStore.delete).toHaveBeenCalledWith("user@example.com");
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Đặt lại mật khẩu thành công.",
      });
    });

    it("should delete OTP from store after successful reset", async () => {
      mockReq.body = {
        email: "user@example.com",
        otp: "123456",
        newPassword: "newpass",
      };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      mockBcrypt.hash.mockResolvedValue("hashed");
      mockPool.query.mockResolvedValueOnce({});

      await handler(mockReq, mockRes);

      expect(mockOtpStore.delete).toHaveBeenCalledWith("user@example.com");
    });

    it("should hash password with salt rounds 10", async () => {
      mockReq.body = {
        email: "user@example.com",
        otp: "123456",
        newPassword: "securePassword",
      };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      mockBcrypt.hash.mockResolvedValue("hashed");
      mockPool.query.mockResolvedValueOnce({});

      await handler(mockReq, mockRes);

      expect(mockBcrypt.hash).toHaveBeenCalledWith("securePassword", 10);
    });
  });

  describe("Validation cases", () => {
    it("should return 400 when email is missing", async () => {
      mockReq.body = { otp: "123456", newPassword: "newpass" };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Email, OTP và mật khẩu mới là bắt buộc.",
      });
    });

    it("should return 400 when OTP is missing", async () => {
      mockReq.body = { email: "user@example.com", newPassword: "newpass" };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when newPassword is missing", async () => {
      mockReq.body = { email: "user@example.com", otp: "123456" };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when all fields are missing", async () => {
      mockReq.body = {};

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when email is empty string", async () => {
      mockReq.body = { email: "", otp: "123456", newPassword: "newpass" };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when OTP is empty string", async () => {
      mockReq.body = {
        email: "user@example.com",
        otp: "",
        newPassword: "newpass",
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when newPassword is empty string", async () => {
      mockReq.body = {
        email: "user@example.com",
        otp: "123456",
        newPassword: "",
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("OTP validation cases", () => {
    it("should return 400 when OTP record does not exist", async () => {
      mockReq.body = {
        email: "user@example.com",
        otp: "123456",
        newPassword: "newpass",
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "OTP không hợp lệ hoặc đã hết hạn.",
      });
    });

    it("should return 400 when OTP has expired", async () => {
      mockReq.body = {
        email: "user@example.com",
        otp: "123456",
        newPassword: "newpass",
      };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "123456",
        expiresAt: Date.now() - 1000,
      });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "OTP đã hết hạn.",
      });
    });

    it("should delete expired OTP from store", async () => {
      mockReq.body = {
        email: "user@example.com",
        otp: "123456",
        newPassword: "newpass",
      };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "123456",
        expiresAt: Date.now() - 1000,
      });

      await handler(mockReq, mockRes);

      expect(mockOtpStore.delete).toHaveBeenCalledWith("user@example.com");
    });

    it("should return 400 when OTP is incorrect", async () => {
      mockReq.body = {
        email: "user@example.com",
        otp: "654321",
        newPassword: "newpass",
      };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "OTP không chính xác.",
      });
    });

    it("should not delete OTP when incorrect", async () => {
      mockReq.body = {
        email: "user@example.com",
        otp: "wrong",
        newPassword: "newpass",
      };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      await handler(mockReq, mockRes);

      expect(mockOtpStore.delete).not.toHaveBeenCalled();
    });
  });

  describe("User validation cases", () => {
    it("should return 404 when email does not exist in database", async () => {
      mockReq.body = {
        email: "nonexistent@example.com",
        otp: "123456",
        newPassword: "newpass",
      };
      Map.prototype.set.call(mockOtpStore, "nonexistent@example.com", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
      mockPool.query.mockResolvedValue({ rows: [] });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Email không tồn tại.",
      });
    });

    it("should not delete OTP when user not found", async () => {
      mockReq.body = {
        email: "user@example.com",
        otp: "123456",
        newPassword: "newpass",
      };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
      mockPool.query.mockResolvedValue({ rows: [] });

      await handler(mockReq, mockRes);

      expect(mockOtpStore.delete).not.toHaveBeenCalled();
    });
  });

  describe("Error cases", () => {
    it("should return 500 on database error during SELECT", async () => {
      mockReq.body = {
        email: "user@example.com",
        otp: "123456",
        newPassword: "newpass",
      };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
      mockPool.query.mockRejectedValue(new Error("Database error"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server khi cập nhật mật khẩu: Database error",
      });
    });

    it("should return 500 on bcrypt hash error", async () => {
      mockReq.body = {
        email: "user@example.com",
        otp: "123456",
        newPassword: "newpass",
      };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
      mockPool.query.mockResolvedValue({ rows: [{ id: 1 }] });
      mockBcrypt.hash.mockRejectedValue(new Error("Hash error"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it("should return 500 on database error during UPDATE", async () => {
      mockReq.body = {
        email: "user@example.com",
        otp: "123456",
        newPassword: "newpass",
      };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockRejectedValueOnce(new Error("Update failed"));
      mockBcrypt.hash.mockResolvedValue("hashed");

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it("should not delete OTP on database error", async () => {
      mockReq.body = {
        email: "user@example.com",
        otp: "123456",
        newPassword: "newpass",
      };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
      mockPool.query.mockRejectedValue(new Error("Database error"));

      await handler(mockReq, mockRes);

      expect(mockOtpStore.delete).not.toHaveBeenCalled();
    });
  });

  describe("Edge cases", () => {
    it("should handle very long passwords", async () => {
      const longPassword = "a".repeat(200);
      mockReq.body = {
        email: "user@example.com",
        otp: "123456",
        newPassword: longPassword,
      };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      mockBcrypt.hash.mockResolvedValue("hashed");
      mockPool.query.mockResolvedValueOnce({});

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Đặt lại mật khẩu thành công.",
      });
    });

    it("should handle passwords with special characters", async () => {
      mockReq.body = {
        email: "user@example.com",
        otp: "123456",
        newPassword: "p@ss!w0rd#123$%^",
      };
      Map.prototype.set.call(mockOtpStore, "user@example.com", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      mockBcrypt.hash.mockResolvedValue("hashed");
      mockPool.query.mockResolvedValueOnce({});

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Đặt lại mật khẩu thành công.",
      });
    });

    it("should handle email with uppercase letters", async () => {
      mockReq.body = {
        email: "USER@EXAMPLE.COM",
        otp: "123456",
        newPassword: "newpass",
      };
      Map.prototype.set.call(mockOtpStore, "USER@EXAMPLE.COM", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      mockBcrypt.hash.mockResolvedValue("hashed");
      mockPool.query.mockResolvedValueOnce({});

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Đặt lại mật khẩu thành công.",
      });
    });
  });
});
