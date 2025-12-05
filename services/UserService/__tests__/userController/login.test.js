const login = require("../../controllers/userController/login");

describe("login", () => {
  let mockPool;
  let mockBcrypt;
  let mockJwt;
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
    };

    mockJwt = {
      sign: jest.fn(),
    };

    handler = login({ pool: mockPool, bcrypt: mockBcrypt, jwt: mockJwt });

    mockReq = {
      body: {},
    };

    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    process.env.JWT_SECRET = "test-secret";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Success cases", () => {
    it("should login successfully with valid credentials", async () => {
      const mockUser = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "hashedPassword",
        role: "user",
        points: 100,
        workplace: null,
      };

      mockReq.body = {
        email: "john@example.com",
        password: "password123",
      };

      mockPool.query.mockResolvedValue({ rows: [mockUser] });
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue("mock-jwt-token");

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE email = $1",
        ["john@example.com"]
      );
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashedPassword"
      );
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: 1, role: "user" },
        "test-secret",
        { expiresIn: "24h" }
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Login successfully",
        token: "mock-jwt-token",
        user: {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          phone: "0123456789",
          gender: "male",
          birthdate: "1990-01-01",
          role: "user",
          points: 100,
          workplace: "",
        },
      });
    });

    it("should login employee successfully", async () => {
      const mockEmployee = {
        id: 2,
        name: "Employee Name",
        email: "employee@example.com",
        phone: "0987654321",
        gender: "female",
        birthdate: "1985-05-05",
        password: "hashedPassword",
        role: "employee",
        points: 0,
        workplace: "Cinema A",
      };

      mockReq.body = {
        email: "employee@example.com",
        password: "empPass123",
      };

      mockPool.query.mockResolvedValue({ rows: [mockEmployee] });
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue("employee-token");

      await handler(mockReq, mockRes);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: 2, role: "employee" },
        "test-secret",
        { expiresIn: "24h" }
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            role: "employee",
            workplace: "Cinema A",
          }),
        })
      );
    });

    it("should login admin successfully", async () => {
      const mockAdmin = {
        id: 3,
        name: "Admin User",
        email: "admin@example.com",
        phone: "0111222333",
        gender: "male",
        birthdate: "1980-01-01",
        password: "hashedPassword",
        role: "admin",
        points: 0,
        workplace: "Head Office",
      };

      mockReq.body = {
        email: "admin@example.com",
        password: "adminPass",
      };

      mockPool.query.mockResolvedValue({ rows: [mockAdmin] });
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue("admin-token");

      await handler(mockReq, mockRes);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: 3, role: "admin" },
        "test-secret",
        { expiresIn: "24h" }
      );
    });

    it("should handle null workplace as empty string", async () => {
      const mockUser = {
        id: 4,
        name: "User",
        email: "user@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "hashedPassword",
        role: "user",
        points: 50,
        workplace: null,
      };

      mockReq.body = {
        email: "user@example.com",
        password: "password",
      };

      mockPool.query.mockResolvedValue({ rows: [mockUser] });
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue("token");

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            workplace: "",
          }),
        })
      );
    });
  });

  describe("Authentication failure cases", () => {
    it("should return 401 when email does not exist", async () => {
      mockReq.body = {
        email: "nonexistent@example.com",
        password: "password",
      };

      mockPool.query.mockResolvedValue({ rows: [] });

      await handler(mockReq, mockRes);

      expect(mockBcrypt.compare).not.toHaveBeenCalled();
      expect(mockJwt.sign).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Email không tồn tại!",
      });
    });

    it("should return 401 when password is incorrect", async () => {
      const mockUser = {
        id: 1,
        email: "john@example.com",
        password: "hashedPassword",
        role: "user",
      };

      mockReq.body = {
        email: "john@example.com",
        password: "wrongPassword",
      };

      mockPool.query.mockResolvedValue({ rows: [mockUser] });
      mockBcrypt.compare.mockResolvedValue(false);

      await handler(mockReq, mockRes);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        "wrongPassword",
        "hashedPassword"
      );
      expect(mockJwt.sign).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Sai mật khẩu!",
      });
    });
  });

  describe("Error cases", () => {
    it("should return 500 on database error", async () => {
      mockReq.body = {
        email: "test@example.com",
        password: "password",
      };

      mockPool.query.mockRejectedValue(new Error("Database connection failed"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Error: Database connection failed",
      });
    });

    it("should return 500 on bcrypt error", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        password: "hashedPassword",
      };

      mockReq.body = {
        email: "test@example.com",
        password: "password",
      };

      mockPool.query.mockResolvedValue({ rows: [mockUser] });
      mockBcrypt.compare.mockRejectedValue(new Error("Bcrypt error"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Error: Bcrypt error",
      });
    });

    it("should return 500 on JWT signing error", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        password: "hashedPassword",
        role: "user",
      };

      mockReq.body = {
        email: "test@example.com",
        password: "password",
      };

      mockPool.query.mockResolvedValue({ rows: [mockUser] });
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockImplementation(() => {
        throw new Error("JWT signing failed");
      });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Error: JWT signing failed",
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle email with uppercase letters", async () => {
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "TEST@EXAMPLE.COM",
        password: "hashedPassword",
        role: "user",
        points: 0,
      };

      mockReq.body = {
        email: "TEST@EXAMPLE.COM",
        password: "password",
      };

      mockPool.query.mockResolvedValue({ rows: [mockUser] });
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue("token");

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Login successfully",
        })
      );
    });

    it("should use default JWT_SECRET when not set", async () => {
      delete process.env.JWT_SECRET;

      const mockUser = {
        id: 1,
        email: "test@example.com",
        password: "hashedPassword",
        role: "user",
        points: 0,
      };

      mockReq.body = {
        email: "test@example.com",
        password: "password",
      };

      mockPool.query.mockResolvedValue({ rows: [mockUser] });
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue("token");

      await handler(mockReq, mockRes);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        "secret",
        expect.any(Object)
      );
    });

    it("should handle user with 0 points", async () => {
      const mockUser = {
        id: 1,
        name: "New User",
        email: "new@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "hashedPassword",
        role: "user",
        points: 0,
        workplace: null,
      };

      mockReq.body = {
        email: "new@example.com",
        password: "password",
      };

      mockPool.query.mockResolvedValue({ rows: [mockUser] });
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue("token");

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            points: 0,
          }),
        })
      );
    });
  });
});
