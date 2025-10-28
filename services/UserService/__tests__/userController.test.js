const createUserController = require("../controllers/userController");

describe("UserController", () => {
  let userController;
  let mockPool;
  let mockBcrypt;
  let mockJwt;
  let mockOtpStore;
  let mockSendEmail;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Mock pool
    mockPool = {
      query: jest.fn(),
    };

    // Mock bcrypt
    mockBcrypt = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    // Mock jwt
    mockJwt = {
      sign: jest.fn(),
    };

    // Mock OTP store
    mockOtpStore = new Map();

    // Mock sendEmail
    mockSendEmail = jest.fn();

    // Create controller with mocks
    userController = createUserController({
      pool: mockPool,
      bcrypt: mockBcrypt,
      jwt: mockJwt,
      otpStore: mockOtpStore,
      sendEmail: mockSendEmail,
    });

    // Mock request and response
    mockReq = {
      body: {},
      params: {},
      user: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("signup", () => {
    it("should create a new user successfully with default role", async () => {
      mockReq.body = {
        name: "Test User",
        email: "test@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "password123",
      };

      mockBcrypt.hash.mockResolvedValue("hashedPassword");
      mockPool.query.mockResolvedValue({
        rows: [{ id: 1 }],
      });

      await userController.signup(mockReq, mockRes);

      expect(mockBcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(mockPool.query).toHaveBeenCalledWith(
        "INSERT INTO users(name, email, phone, gender, birthdate, password, role) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id",
        [
          "Test User",
          "test@example.com",
          "0123456789",
          "male",
          "1990-01-01",
          "hashedPassword",
          "user",
        ]
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Signup successfully",
        userId: 1,
      });
    });

    it("should create a new user with specified role", async () => {
      mockReq.body = {
        name: "Admin User",
        email: "admin@example.com",
        phone: "0987654321",
        gender: "female",
        birthdate: "1985-05-15",
        password: "adminpass",
        role: "admin",
      };

      mockBcrypt.hash.mockResolvedValue("hashedPassword");
      mockPool.query.mockResolvedValue({
        rows: [{ id: 2 }],
      });

      await userController.signup(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(["admin"])
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should return error if email already exists", async () => {
      mockReq.body = {
        name: "Test User",
        email: "existing@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "password123",
      };

      mockBcrypt.hash.mockResolvedValue("hashedPassword");
      mockPool.query.mockRejectedValue({
        code: "23505",
        detail: "Key (email)=(existing@example.com) already exists.",
      });

      await userController.signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Email đã được sử dụng.",
      });
    });

    it("should return error if phone already exists", async () => {
      mockReq.body = {
        name: "Test User",
        email: "test@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "password123",
      };

      mockBcrypt.hash.mockResolvedValue("hashedPassword");
      mockPool.query.mockRejectedValue({
        code: "23505",
        detail: "Key (phone)=(0123456789) already exists.",
      });

      await userController.signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Số điện thoại đã được sử dụng.",
      });
    });

    it("should handle generic error", async () => {
      mockReq.body = {
        name: "Test User",
        email: "test@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "password123",
      };

      mockBcrypt.hash.mockResolvedValue("hashedPassword");
      mockPool.query.mockRejectedValue(new Error("Database error"));

      await userController.signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Đăng ký thất bại. Vui lòng thử lại.",
      });
    });
  });

  describe("login", () => {
    it("should login successfully and return token", async () => {
      mockReq.body = {
        email: "test@example.com",
        password: "password123",
      };

      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        password: "hashedPassword",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        role: "user",
        points: 100,
        workplace: "Office A",
      };

      mockPool.query.mockResolvedValue({
        rows: [mockUser],
      });
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue("mockToken");

      await userController.login(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE email = $1",
        ["test@example.com"]
      );
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashedPassword"
      );
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: 1, role: "user" },
        "secret",
        { expiresIn: "24h" }
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Login successfully",
        token: "mockToken",
        user: {
          id: 1,
          name: "Test User",
          email: "test@example.com",
          phone: "0123456789",
          gender: "male",
          birthdate: "1990-01-01",
          role: "user",
          points: 100,
          workplace: "Office A",
        },
      });
    });

    it("should return error if email not found", async () => {
      mockReq.body = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      mockPool.query.mockResolvedValue({
        rows: [],
      });

      await userController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Email không tồn tại!",
      });
    });

    it("should return error if password is incorrect", async () => {
      mockReq.body = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      mockPool.query.mockResolvedValue({
        rows: [
          {
            id: 1,
            email: "test@example.com",
            password: "hashedPassword",
          },
        ],
      });
      mockBcrypt.compare.mockResolvedValue(false);

      await userController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Sai mật khẩu!",
      });
    });

    it("should handle database error", async () => {
      mockReq.body = {
        email: "test@example.com",
        password: "password123",
      };

      mockPool.query.mockRejectedValue(new Error("Database error"));

      await userController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Error: Database error",
      });
    });
  });

  describe("getAllUsers", () => {
    it('should return all users with role "user"', async () => {
      const mockUsers = [
        {
          id: 1,
          name: "User 1",
          email: "user1@example.com",
          phone: "0123456789",
          gender: "male",
          birthdate: "1990-01-01",
          role: "user",
          points: 100,
          rank: "bronze",
        },
        {
          id: 2,
          name: "User 2",
          email: "user2@example.com",
          phone: "0987654321",
          gender: "female",
          birthdate: "1995-05-15",
          role: "user",
          points: 200,
          rank: "silver",
        },
      ];

      mockPool.query.mockResolvedValue({
        rows: mockUsers,
      });

      await userController.getAllUsers(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE role = 'user'")
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockUsers);
    });

    it("should handle database error", async () => {
      mockPool.query.mockRejectedValue(new Error("Database error"));

      await userController.getAllUsers(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server khi lấy danh sách user: Database error",
      });
    });
  });

  describe("getUserById", () => {
    it("should return user by id", async () => {
      mockReq.params.id = "1";

      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        role: "user",
        points: 100,
        rank: "bronze",
      };

      mockPool.query.mockResolvedValue({
        rows: [mockUser],
      });

      await userController.getUserById(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT id, name, email, phone, gender, birthdate, role, points, rank FROM users WHERE id = $1",
        ["1"]
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });

    it("should return 404 if user not found", async () => {
      mockReq.params.id = "999";

      mockPool.query.mockResolvedValue({
        rows: [],
      });

      await userController.getUserById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "User không tồn tại",
      });
    });

    it("should handle database error", async () => {
      mockReq.params.id = "1";

      mockPool.query.mockRejectedValue(new Error("Database error"));

      await userController.getUserById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server: Database error",
      });
    });
  });

  describe("updateUser", () => {
    it("should update user successfully", async () => {
      mockReq.params.id = "1";
      mockReq.body = {
        name: "Updated User",
        email: "updated@example.com",
        phone: "0111111111",
        gender: "female",
        birthdate: "1992-02-02",
      };

      const updatedUser = {
        id: 1,
        name: "Updated User",
        email: "updated@example.com",
        phone: "0111111111",
        gender: "female",
        birthdate: "1992-02-02",
        role: "user",
        points: 100,
        rank: "bronze",
      };

      mockPool.query.mockResolvedValue({
        rowCount: 1,
        rows: [updatedUser],
      });

      await userController.updateUser(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE users"),
        [
          "Updated User",
          "updated@example.com",
          "0111111111",
          "female",
          "1992-02-02",
          1,
        ]
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Cập nhật thông tin người dùng thành công.",
        user: updatedUser,
      });
    });

    it("should return 404 if user not found", async () => {
      mockReq.params.id = "999";
      mockReq.body = {
        name: "Updated User",
        email: "updated@example.com",
        phone: "0111111111",
        gender: "female",
        birthdate: "1992-02-02",
      };

      mockPool.query.mockResolvedValue({
        rowCount: 0,
        rows: [],
      });

      await userController.updateUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Người dùng không tồn tại.",
      });
    });

    it("should return error if email already exists", async () => {
      mockReq.params.id = "1";
      mockReq.body = {
        name: "Updated User",
        email: "existing@example.com",
        phone: "0111111111",
        gender: "female",
        birthdate: "1992-02-02",
      };

      mockPool.query.mockRejectedValue({
        code: "23505",
        detail: "Key (email)=(existing@example.com) already exists.",
      });

      await userController.updateUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Email đã được sử dụng.",
      });
    });

    it("should return error if phone already exists", async () => {
      mockReq.params.id = "1";
      mockReq.body = {
        name: "Updated User",
        email: "updated@example.com",
        phone: "0111111111",
        gender: "female",
        birthdate: "1992-02-02",
      };

      mockPool.query.mockRejectedValue({
        code: "23505",
        detail: "Key (phone)=(0111111111) already exists.",
      });

      await userController.updateUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Số điện thoại đã được sử dụng.",
      });
    });
  });

  describe("changePassword", () => {
    it("should change password successfully", async () => {
      mockReq.params.id = "1";
      mockReq.body = {
        oldPassword: "oldpass",
        newPassword: "newpass",
      };
      mockReq.user = { userId: 1 };

      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ password: "hashedOldPassword" }],
        })
        .mockResolvedValueOnce({ rowCount: 1 });

      mockBcrypt.compare.mockResolvedValue(true);
      mockBcrypt.hash.mockResolvedValue("hashedNewPassword");

      await userController.changePassword(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT password FROM users WHERE id = $1",
        [1]
      );
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        "oldpass",
        "hashedOldPassword"
      );
      expect(mockBcrypt.hash).toHaveBeenCalledWith("newpass", 10);
      expect(mockPool.query).toHaveBeenCalledWith(
        "UPDATE users SET password = $1 WHERE id = $2",
        ["hashedNewPassword", 1]
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Đổi mật khẩu thành công.",
      });
    });

    it("should return 403 if user tries to change another user password", async () => {
      mockReq.params.id = "2";
      mockReq.body = {
        oldPassword: "oldpass",
        newPassword: "newpass",
      };
      mockReq.user = { userId: 1 };

      await userController.changePassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Bạn không có quyền thay đổi mật khẩu này.",
      });
    });

    it("should return 404 if user not found", async () => {
      mockReq.params.id = "1";
      mockReq.body = {
        oldPassword: "oldpass",
        newPassword: "newpass",
      };
      mockReq.user = { userId: 1 };

      mockPool.query.mockResolvedValue({
        rows: [],
      });

      await userController.changePassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Người dùng không tồn tại.",
      });
    });

    it("should return error if old password is incorrect", async () => {
      mockReq.params.id = "1";
      mockReq.body = {
        oldPassword: "wrongpass",
        newPassword: "newpass",
      };
      mockReq.user = { userId: 1 };

      mockPool.query.mockResolvedValue({
        rows: [{ password: "hashedOldPassword" }],
      });
      mockBcrypt.compare.mockResolvedValue(false);

      await userController.changePassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Mật khẩu cũ không đúng.",
      });
    });
  });

  describe("sendOTP", () => {
    it("should send OTP successfully", async () => {
      mockReq.body = {
        email: "test@example.com",
      };

      mockPool.query.mockResolvedValue({
        rows: [{ id: 1 }],
      });
      mockSendEmail.mockResolvedValue(true);

      await userController.sendOTP(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT id FROM users WHERE email = $1",
        ["test@example.com"]
      );
      expect(mockSendEmail).toHaveBeenCalled();
      expect(mockOtpStore.has("test@example.com")).toBe(true);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "OTP đã được gửi đến email.",
      });
    });

    it("should return error if email is missing", async () => {
      mockReq.body = {};

      await userController.sendOTP(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Email là bắt buộc.",
      });
    });

    it("should return 404 if email not found", async () => {
      mockReq.body = {
        email: "nonexistent@example.com",
      };

      mockPool.query.mockResolvedValue({
        rows: [],
      });

      await userController.sendOTP(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Email không tồn tại.",
      });
    });

    it("should handle sendEmail error", async () => {
      mockReq.body = {
        email: "test@example.com",
      };

      mockPool.query.mockResolvedValue({
        rows: [{ id: 1 }],
      });
      mockSendEmail.mockRejectedValue(new Error("Email service error"));

      await userController.sendOTP(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server khi gửi OTP: Email service error",
      });
    });
  });

  describe("verifyOTP", () => {
    it("should verify OTP successfully", async () => {
      mockReq.body = {
        email: "test@example.com",
        otp: "123456",
      };

      mockOtpStore.set("test@example.com", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      await userController.verifyOTP(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Xác thực OTP thành công.",
      });
    });

    it("should return error if email or OTP is missing", async () => {
      mockReq.body = {
        email: "test@example.com",
      };

      await userController.verifyOTP(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Email và OTP là bắt buộc.",
      });
    });

    it("should return error if OTP not found", async () => {
      mockReq.body = {
        email: "test@example.com",
        otp: "123456",
      };

      await userController.verifyOTP(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "OTP không hợp lệ hoặc đã hết hạn.",
      });
    });

    it("should return error if OTP expired", async () => {
      mockReq.body = {
        email: "test@example.com",
        otp: "123456",
      };

      mockOtpStore.set("test@example.com", {
        otp: "123456",
        expiresAt: Date.now() - 1000, // Expired
      });

      await userController.verifyOTP(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "OTP đã hết hạn.",
      });
      expect(mockOtpStore.has("test@example.com")).toBe(false);
    });

    it("should return error if OTP is incorrect", async () => {
      mockReq.body = {
        email: "test@example.com",
        otp: "999999",
      };

      mockOtpStore.set("test@example.com", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      await userController.verifyOTP(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "OTP không chính xác.",
      });
    });
  });

  describe("resetPassword", () => {
    it("should reset password successfully", async () => {
      mockReq.body = {
        email: "test@example.com",
        otp: "123456",
        newPassword: "newpassword123",
      };

      mockOtpStore.set("test@example.com", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1 }],
        })
        .mockResolvedValueOnce({ rowCount: 1 });

      mockBcrypt.hash.mockResolvedValue("hashedNewPassword");

      await userController.resetPassword(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT id FROM users WHERE email = $1",
        ["test@example.com"]
      );
      expect(mockBcrypt.hash).toHaveBeenCalledWith("newpassword123", 10);
      expect(mockPool.query).toHaveBeenCalledWith(
        "UPDATE users SET password = $1 WHERE email = $2",
        ["hashedNewPassword", "test@example.com"]
      );
      expect(mockOtpStore.has("test@example.com")).toBe(false);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Đặt lại mật khẩu thành công.",
      });
    });

    it("should return error if required fields are missing", async () => {
      mockReq.body = {
        email: "test@example.com",
      };

      await userController.resetPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Email, OTP và mật khẩu mới là bắt buộc.",
      });
    });

    it("should return error if OTP not found", async () => {
      mockReq.body = {
        email: "test@example.com",
        otp: "123456",
        newPassword: "newpassword123",
      };

      await userController.resetPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "OTP không hợp lệ hoặc đã hết hạn.",
      });
    });

    it("should return error if OTP expired", async () => {
      mockReq.body = {
        email: "test@example.com",
        otp: "123456",
        newPassword: "newpassword123",
      };

      mockOtpStore.set("test@example.com", {
        otp: "123456",
        expiresAt: Date.now() - 1000,
      });

      await userController.resetPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "OTP đã hết hạn.",
      });
    });

    it("should return error if OTP is incorrect", async () => {
      mockReq.body = {
        email: "test@example.com",
        otp: "999999",
        newPassword: "newpassword123",
      };

      mockOtpStore.set("test@example.com", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      await userController.resetPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "OTP không chính xác.",
      });
    });

    it("should return 404 if user not found", async () => {
      mockReq.body = {
        email: "nonexistent@example.com",
        otp: "123456",
        newPassword: "newpassword123",
      };

      mockOtpStore.set("nonexistent@example.com", {
        otp: "123456",
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      mockPool.query.mockResolvedValue({
        rows: [],
      });

      await userController.resetPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Email không tồn tại.",
      });
    });
  });

  describe("createEmployee", () => {
    it("should create employee successfully", async () => {
      mockReq.body = {
        name: "Employee 1",
        email: "employee1@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "password123",
        role: "employee",
        identity_card: "123456789",
        workplace: "Office A",
      };

      mockBcrypt.hash.mockResolvedValue("hashedPassword");
      mockPool.query.mockResolvedValue({
        rows: [
          {
            id: 1,
            name: "Employee 1",
            email: "employee1@example.com",
            phone: "0123456789",
            gender: "male",
            birthdate: "1990-01-01",
            role: "employee",
            identity_card: "123456789",
            workplace: "Office A",
          },
        ],
      });

      await userController.createEmployee(mockReq, mockRes);

      expect(mockBcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO users"),
        expect.arrayContaining([
          "Employee 1",
          "employee1@example.com",
          "0123456789",
          "male",
          "1990-01-01",
          "hashedPassword",
          "employee",
          "123456789",
          "Office A",
        ])
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Tạo nhân viên thành công",
        employee: expect.any(Object),
      });
    });

    it("should return error if role is not employee", async () => {
      mockReq.body = {
        name: "User 1",
        email: "user1@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "password123",
        role: "user",
        identity_card: "123456789",
        workplace: "Office A",
      };

      await userController.createEmployee(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Chỉ được tạo tài khoản với role là employee",
      });
    });

    it("should return error if email already exists", async () => {
      mockReq.body = {
        name: "Employee 1",
        email: "existing@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "password123",
        role: "employee",
        identity_card: "123456789",
        workplace: "Office A",
      };

      mockBcrypt.hash.mockResolvedValue("hashedPassword");
      mockPool.query.mockRejectedValue({
        code: "23505",
        detail: "Key (email)=(existing@example.com) already exists.",
      });

      await userController.createEmployee(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Email đã được sử dụng.",
      });
    });
  });

  describe("updateEmployee", () => {
    it("should update employee successfully", async () => {
      mockReq.params.id = "1";
      mockReq.body = {
        name: "Updated Employee",
        email: "updated@example.com",
        phone: "0111111111",
        gender: "female",
        birthdate: "1992-02-02",
        identity_card: "987654321",
        workplace: "Office B",
      };

      mockPool.query.mockResolvedValue({
        rowCount: 1,
        rows: [
          {
            id: 1,
            name: "Updated Employee",
            email: "updated@example.com",
            phone: "0111111111",
            gender: "female",
            birthdate: "1992-02-02",
            role: "employee",
            identity_card: "987654321",
            workplace: "Office B",
          },
        ],
      });

      await userController.updateEmployee(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE users"),
        [
          "Updated Employee",
          "updated@example.com",
          "0111111111",
          "female",
          "1992-02-02",
          "987654321",
          "Office B",
          1,
        ]
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Cập nhật nhân viên thành công",
        employee: expect.any(Object),
      });
    });

    it("should return 404 if employee not found", async () => {
      mockReq.params.id = "999";
      mockReq.body = {
        name: "Updated Employee",
        email: "updated@example.com",
        phone: "0111111111",
        gender: "female",
        birthdate: "1992-02-02",
        identity_card: "987654321",
        workplace: "Office B",
      };

      mockPool.query.mockResolvedValue({
        rowCount: 0,
        rows: [],
      });

      await userController.updateEmployee(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Nhân viên không tồn tại hoặc không phải nhân viên",
      });
    });
  });

  describe("deleteEmployee", () => {
    it("should delete employee successfully", async () => {
      mockReq.params.id = "1";

      mockPool.query.mockResolvedValue({
        rowCount: 1,
      });

      await userController.deleteEmployee(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        "DELETE FROM users WHERE id = $1 AND role = 'employee'",
        [1]
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Xóa nhân viên thành công",
      });
    });

    it("should return 404 if employee not found", async () => {
      mockReq.params.id = "999";

      mockPool.query.mockResolvedValue({
        rowCount: 0,
      });

      await userController.deleteEmployee(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Nhân viên không tồn tại hoặc không phải nhân viên",
      });
    });

    it("should handle database error", async () => {
      mockReq.params.id = "1";

      mockPool.query.mockRejectedValue(new Error("Database error"));

      await userController.deleteEmployee(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server khi xóa nhân viên: Database error",
      });
    });
  });

  describe("getAllEmployees", () => {
    it("should return all employees", async () => {
      const mockEmployees = [
        {
          id: 1,
          name: "Employee 1",
          email: "emp1@example.com",
          phone: "0123456789",
          gender: "male",
          birthdate: "1990-01-01",
          role: "employee",
          identity_card: "123456789",
          workplace: "Office A",
        },
        {
          id: 2,
          name: "Employee 2",
          email: "emp2@example.com",
          phone: "0987654321",
          gender: "female",
          birthdate: "1992-05-15",
          role: "employee",
          identity_card: "987654321",
          workplace: "Office B",
        },
      ];

      mockPool.query.mockResolvedValue({
        rows: mockEmployees,
      });

      await userController.getAllEmployees(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE role = 'employee'")
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        employees: mockEmployees,
      });
    });

    it("should handle database error", async () => {
      mockPool.query.mockRejectedValue(new Error("Database error"));

      await userController.getAllEmployees(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server khi lấy danh sách nhân viên: Database error",
      });
    });
  });
});
