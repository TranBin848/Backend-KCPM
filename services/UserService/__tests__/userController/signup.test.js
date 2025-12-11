const signup = require("../../controllers/userController/signup");

describe("signup", () => {
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
      hash: jest.fn(),
    };

    handler = signup({ pool: mockPool, bcrypt: mockBcrypt });

    mockReq = {
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
    it("should create user successfully with all fields", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "password123",
        role: "user",
      };

      mockReq.body = userData;
      mockBcrypt.hash.mockResolvedValue("hashedPassword");
      mockPool.query.mockResolvedValue({ rows: [{ id: 1 }] });

      await handler(mockReq, mockRes);

      expect(mockBcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO users"),
        expect.arrayContaining([
          "John Doe",
          "john@example.com",
          "0123456789",
          "male",
          "1990-01-01",
          "hashedPassword",
          "user",
        ])
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Signup successfully",
        userId: 1,
      });
    });

    it("should default to 'user' role when role is not provided", async () => {
      mockReq.body = {
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "0987654321",
        gender: "female",
        birthdate: "1995-05-05",
        password: "password456",
      };

      mockBcrypt.hash.mockResolvedValue("hashedPassword");
      mockPool.query.mockResolvedValue({ rows: [{ id: 2 }] });

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(["user"])
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should accept 'employee' role", async () => {
      mockReq.body = {
        name: "Employee User",
        email: "employee@example.com",
        phone: "0111222333",
        gender: "male",
        birthdate: "1985-03-15",
        password: "empPass123",
        role: "employee",
      };

      mockBcrypt.hash.mockResolvedValue("hashedPassword");
      mockPool.query.mockResolvedValue({ rows: [{ id: 3 }] });

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(["employee"])
      );
    });

    it("should accept 'admin' role", async () => {
      mockReq.body = {
        name: "Admin User",
        email: "admin@example.com",
        phone: "0999888777",
        gender: "female",
        birthdate: "1980-12-25",
        password: "adminPass",
        role: "admin",
      };

      mockBcrypt.hash.mockResolvedValue("hashedPassword");
      mockPool.query.mockResolvedValue({ rows: [{ id: 4 }] });

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(["admin"])
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe("Duplicate entry cases", () => {
    it("should return 400 when email already exists", async () => {
      mockReq.body = {
        name: "Test User",
        email: "existing@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "password",
      };

      mockBcrypt.hash.mockResolvedValue("hashedPassword");
      const duplicateError = new Error("Duplicate key");
      duplicateError.code = "23505";
      duplicateError.detail =
        "Key (email)=(existing@example.com) already exists.";
      mockPool.query.mockRejectedValue(duplicateError);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Email đã được sử dụng.",
      });
    });

    it("should return 400 when phone already exists", async () => {
      mockReq.body = {
        name: "Test User",
        email: "test@example.com",
        phone: "0987654321",
        gender: "female",
        birthdate: "1992-02-02",
        password: "password",
      };

      mockBcrypt.hash.mockResolvedValue("hashedPassword");
      const duplicateError = new Error("Duplicate key");
      duplicateError.code = "23505";
      duplicateError.detail = "Key (phone)=(0987654321) already exists.";
      mockPool.query.mockRejectedValue(duplicateError);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Số điện thoại đã được sử dụng.",
      });
    });
  });

  describe("Error cases", () => {
    it("should return 500 on database error", async () => {
      mockReq.body = {
        name: "Test User",
        email: "test@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "password",
      };

      mockBcrypt.hash.mockResolvedValue("hashedPassword");
      mockPool.query.mockRejectedValue(new Error("Database connection failed"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Đăng ký thất bại. Vui lòng thử lại.",
      });
    });

    it("should return 500 on bcrypt error", async () => {
      mockReq.body = {
        name: "Test User",
        email: "test@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "password",
      };

      mockBcrypt.hash.mockRejectedValue(new Error("Hashing failed"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Đăng ký thất bại. Vui lòng thử lại.",
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle special characters in name", async () => {
      mockReq.body = {
        name: "Nguyễn Văn A",
        email: "test@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "password",
      };

      mockBcrypt.hash.mockResolvedValue("hashedPassword");
      mockPool.query.mockResolvedValue({ rows: [{ id: 5 }] });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle long passwords", async () => {
      mockReq.body = {
        name: "Test User",
        email: "test@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "a".repeat(100),
      };

      mockBcrypt.hash.mockResolvedValue("hashedLongPassword");
      mockPool.query.mockResolvedValue({ rows: [{ id: 6 }] });

      await handler(mockReq, mockRes);

      expect(mockBcrypt.hash).toHaveBeenCalledWith("a".repeat(100), 10);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle null role (defaults to user)", async () => {
      mockReq.body = {
        name: "Test User",
        email: "test@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "password",
        role: null,
      };

      mockBcrypt.hash.mockResolvedValue("hashedPassword");
      mockPool.query.mockResolvedValue({ rows: [{ id: 7 }] });

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(["user"])
      );
    });

    it("should handle undefined gender", async () => {
      mockReq.body = {
        name: "Test User",
        email: "test@example.com",
        phone: "0123456789",
        birthdate: "1990-01-01",
        password: "password",
      };

      mockBcrypt.hash.mockResolvedValue("hashedPassword");
      mockPool.query.mockResolvedValue({ rows: [{ id: 8 }] });

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([undefined])
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });
});
