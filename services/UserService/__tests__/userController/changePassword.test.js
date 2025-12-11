const changePassword = require("../../controllers/userController/changePassword");

describe("changePassword", () => {
  let mockPool;
  let mockBcrypt;
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
      compare: jest.fn(),
      hash: jest.fn(),
    };

    handler = changePassword({ pool: mockPool, bcrypt: mockBcrypt });

    mockReq = {
      params: { id: "1" },
      user: { userId: 1 },
      body: {},
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
    it("should change password successfully", async () => {
      mockReq.body = {
        oldPassword: "oldpass123",
        newPassword: "newpass456",
      };
      mockPool.query.mockResolvedValueOnce({
        rows: [{ password: "hashedOldPassword" }],
      });
      mockBcrypt.compare.mockResolvedValue(true);
      mockBcrypt.hash.mockResolvedValue("hashedNewPassword");
      mockPool.query.mockResolvedValueOnce({});

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT password FROM users WHERE id = $1",
        [1]
      );
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        "oldpass123",
        "hashedOldPassword"
      );
      expect(mockBcrypt.hash).toHaveBeenCalledWith("newpass456", 10);
      expect(mockPool.query).toHaveBeenCalledWith(
        "UPDATE users SET password = $1 WHERE id = $2",
        ["hashedNewPassword", 1]
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Đổi mật khẩu thành công.",
      });
    });

    it("should hash password with salt rounds 10", async () => {
      mockReq.body = {
        oldPassword: "oldpass",
        newPassword: "newpass",
      };
      mockPool.query.mockResolvedValueOnce({
        rows: [{ password: "hashedOld" }],
      });
      mockBcrypt.compare.mockResolvedValue(true);
      mockBcrypt.hash.mockResolvedValue("hashedNew");
      mockPool.query.mockResolvedValueOnce({});

      await handler(mockReq, mockRes);

      expect(mockBcrypt.hash).toHaveBeenCalledWith("newpass", 10);
    });

    it("should allow changing password with same old and new password", async () => {
      mockReq.body = {
        oldPassword: "password123",
        newPassword: "password123",
      };
      mockPool.query.mockResolvedValueOnce({
        rows: [{ password: "hashedPassword" }],
      });
      mockBcrypt.compare.mockResolvedValue(true);
      mockBcrypt.hash.mockResolvedValue("newHashedPassword");
      mockPool.query.mockResolvedValueOnce({});

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Đổi mật khẩu thành công.",
      });
    });
  });

  describe("Authorization cases", () => {
    it("should return 403 when user tries to change another user's password", async () => {
      mockReq.params.id = "2";
      mockReq.user.userId = 1;
      mockReq.body = {
        oldPassword: "oldpass",
        newPassword: "newpass",
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Bạn không có quyền thay đổi mật khẩu này.",
      });
    });

    it("should allow changing own password when userId matches", async () => {
      mockReq.params.id = "5";
      mockReq.user.userId = 5;
      mockReq.body = {
        oldPassword: "oldpass",
        newPassword: "newpass",
      };
      mockPool.query.mockResolvedValueOnce({
        rows: [{ password: "hashed" }],
      });
      mockBcrypt.compare.mockResolvedValue(true);
      mockBcrypt.hash.mockResolvedValue("hashedNew");
      mockPool.query.mockResolvedValueOnce({});

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Đổi mật khẩu thành công.",
      });
    });

    it("should handle string userId in params", async () => {
      mockReq.params.id = "10";
      mockReq.user.userId = 10;
      mockReq.body = {
        oldPassword: "oldpass",
        newPassword: "newpass",
      };
      mockPool.query.mockResolvedValueOnce({
        rows: [{ password: "hashed" }],
      });
      mockBcrypt.compare.mockResolvedValue(true);
      mockBcrypt.hash.mockResolvedValue("hashedNew");
      mockPool.query.mockResolvedValueOnce({});

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Đổi mật khẩu thành công.",
      });
    });
  });

  describe("Validation cases", () => {
    it("should return 404 when user does not exist", async () => {
      mockReq.body = {
        oldPassword: "oldpass",
        newPassword: "newpass",
      };
      mockPool.query.mockResolvedValue({ rows: [] });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Người dùng không tồn tại.",
      });
    });

    it("should return 400 when old password is incorrect", async () => {
      mockReq.body = {
        oldPassword: "wrongPassword",
        newPassword: "newpass",
      };
      mockPool.query.mockResolvedValue({
        rows: [{ password: "hashedCorrectPassword" }],
      });
      mockBcrypt.compare.mockResolvedValue(false);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Mật khẩu cũ không đúng.",
      });
    });

    it("should not update password when old password is wrong", async () => {
      mockReq.body = {
        oldPassword: "wrongPassword",
        newPassword: "newpass",
      };
      mockPool.query.mockResolvedValue({
        rows: [{ password: "hashedPassword" }],
      });
      mockBcrypt.compare.mockResolvedValue(false);

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledTimes(1);
      expect(mockBcrypt.hash).not.toHaveBeenCalled();
    });
  });

  describe("Error cases", () => {
    it("should return 500 on database error during SELECT", async () => {
      mockReq.body = {
        oldPassword: "oldpass",
        newPassword: "newpass",
      };
      mockPool.query.mockRejectedValue(new Error("Database connection failed"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server: Database connection failed",
      });
    });

    it("should return 500 on bcrypt compare error", async () => {
      mockReq.body = {
        oldPassword: "oldpass",
        newPassword: "newpass",
      };
      mockPool.query.mockResolvedValue({
        rows: [{ password: "hashed" }],
      });
      mockBcrypt.compare.mockRejectedValue(new Error("Bcrypt error"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server: Bcrypt error",
      });
    });

    it("should return 500 on bcrypt hash error", async () => {
      mockReq.body = {
        oldPassword: "oldpass",
        newPassword: "newpass",
      };
      mockPool.query.mockResolvedValue({
        rows: [{ password: "hashed" }],
      });
      mockBcrypt.compare.mockResolvedValue(true);
      mockBcrypt.hash.mockRejectedValue(new Error("Hash error"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it("should return 500 on database error during UPDATE", async () => {
      mockReq.body = {
        oldPassword: "oldpass",
        newPassword: "newpass",
      };
      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ password: "hashed" }],
        })
        .mockRejectedValueOnce(new Error("Update failed"));
      mockBcrypt.compare.mockResolvedValue(true);
      mockBcrypt.hash.mockResolvedValue("hashedNew");

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe("Edge cases", () => {
    it("should handle very long passwords", async () => {
      const longPassword = "a".repeat(200);
      mockReq.body = {
        oldPassword: longPassword,
        newPassword: longPassword + "new",
      };
      mockPool.query.mockResolvedValueOnce({
        rows: [{ password: "hashed" }],
      });
      mockBcrypt.compare.mockResolvedValue(true);
      mockBcrypt.hash.mockResolvedValue("hashedNew");
      mockPool.query.mockResolvedValueOnce({});

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Đổi mật khẩu thành công.",
      });
    });

    it("should handle passwords with special characters", async () => {
      mockReq.body = {
        oldPassword: "p@ss!w0rd#123",
        newPassword: "n3w$P@ssw0rd%456",
      };
      mockPool.query.mockResolvedValueOnce({
        rows: [{ password: "hashed" }],
      });
      mockBcrypt.compare.mockResolvedValue(true);
      mockBcrypt.hash.mockResolvedValue("hashedNew");
      mockPool.query.mockResolvedValueOnce({});

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Đổi mật khẩu thành công.",
      });
    });

    it("should handle passwords with unicode characters", async () => {
      mockReq.body = {
        oldPassword: "mật_khẩu_cũ",
        newPassword: "mật_khẩu_mới_123",
      };
      mockPool.query.mockResolvedValueOnce({
        rows: [{ password: "hashed" }],
      });
      mockBcrypt.compare.mockResolvedValue(true);
      mockBcrypt.hash.mockResolvedValue("hashedNew");
      mockPool.query.mockResolvedValueOnce({});

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Đổi mật khẩu thành công.",
      });
    });

    it("should handle userId as large number", async () => {
      mockReq.params.id = "999999";
      mockReq.user.userId = 999999;
      mockReq.body = {
        oldPassword: "oldpass",
        newPassword: "newpass",
      };
      mockPool.query.mockResolvedValueOnce({
        rows: [{ password: "hashed" }],
      });
      mockBcrypt.compare.mockResolvedValue(true);
      mockBcrypt.hash.mockResolvedValue("hashedNew");
      mockPool.query.mockResolvedValueOnce({});

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Đổi mật khẩu thành công.",
      });
    });
  });
});
