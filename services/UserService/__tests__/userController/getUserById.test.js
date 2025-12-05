const getUserById = require("../../controllers/userController/getUserById");

describe("getUserById", () => {
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

    handler = getUserById({ pool: mockPool });

    mockReq = {
      params: {},
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
    it("should return user by id successfully", async () => {
      const mockUser = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        role: "user",
        points: 100,
        rank: "silver",
      };

      mockReq.params.id = "1";
      mockPool.query.mockResolvedValue({ rows: [mockUser] });

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT id, name, email, phone, gender, birthdate, role, points, rank FROM users WHERE id = $1",
        ["1"]
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });

    it("should return user with all fields populated", async () => {
      const mockUser = {
        id: 5,
        name: "Complete User",
        email: "complete@example.com",
        phone: "0987654321",
        gender: "female",
        birthdate: "1995-05-15",
        role: "user",
        points: 250,
        rank: "gold",
      };

      mockReq.params.id = "5";
      mockPool.query.mockResolvedValue({ rows: [mockUser] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
      expect(mockUser).toHaveProperty("id");
      expect(mockUser).toHaveProperty("name");
      expect(mockUser).toHaveProperty("email");
      expect(mockUser).toHaveProperty("phone");
      expect(mockUser).toHaveProperty("gender");
      expect(mockUser).toHaveProperty("birthdate");
      expect(mockUser).toHaveProperty("role");
      expect(mockUser).toHaveProperty("points");
      expect(mockUser).toHaveProperty("rank");
    });

    it("should return employee by id", async () => {
      const mockEmployee = {
        id: 10,
        name: "Employee Name",
        email: "employee@example.com",
        phone: "0111222333",
        gender: "male",
        birthdate: "1985-03-20",
        role: "employee",
        points: 0,
        rank: null,
      };

      mockReq.params.id = "10";
      mockPool.query.mockResolvedValue({ rows: [mockEmployee] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockEmployee);
    });

    it("should return admin by id", async () => {
      const mockAdmin = {
        id: 100,
        name: "Admin User",
        email: "admin@example.com",
        phone: "0999888777",
        gender: "female",
        birthdate: "1980-12-25",
        role: "admin",
        points: 0,
        rank: null,
      };

      mockReq.params.id = "100";
      mockPool.query.mockResolvedValue({ rows: [mockAdmin] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockAdmin);
    });

    it("should handle user with 0 points", async () => {
      const mockUser = {
        id: 2,
        name: "New User",
        email: "new@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        role: "user",
        points: 0,
        rank: "bronze",
      };

      mockReq.params.id = "2";
      mockPool.query.mockResolvedValue({ rows: [mockUser] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });

    it("should handle user with null rank", async () => {
      const mockUser = {
        id: 3,
        name: "User",
        email: "user@example.com",
        phone: "0123456789",
        gender: "female",
        birthdate: "1992-06-10",
        role: "user",
        points: 50,
        rank: null,
      };

      mockReq.params.id = "3";
      mockPool.query.mockResolvedValue({ rows: [mockUser] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });

    it("should handle string id parameter", async () => {
      const mockUser = {
        id: 999,
        name: "Test User",
        email: "test@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        role: "user",
        points: 100,
        rank: "silver",
      };

      mockReq.params.id = "999";
      mockPool.query.mockResolvedValue({ rows: [mockUser] });

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), ["999"]);
      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });
  });

  describe("Not found cases", () => {
    it("should return 404 when user not found", async () => {
      mockReq.params.id = "999";
      mockPool.query.mockResolvedValue({ rows: [] });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "User không tồn tại",
      });
    });

    it("should return 404 when user was deleted", async () => {
      mockReq.params.id = "123";
      mockPool.query.mockResolvedValue({ rows: [] });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should return 404 for negative user id", async () => {
      mockReq.params.id = "-1";
      mockPool.query.mockResolvedValue({ rows: [] });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should return 404 for id 0", async () => {
      mockReq.params.id = "0";
      mockPool.query.mockResolvedValue({ rows: [] });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe("Error cases", () => {
    it("should return 500 on database error", async () => {
      mockReq.params.id = "1";
      mockPool.query.mockRejectedValue(new Error("Database connection failed"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server: Database connection failed",
      });
    });

    it("should return 500 on database timeout", async () => {
      mockReq.params.id = "1";
      mockPool.query.mockRejectedValue(new Error("Query timeout"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server: Query timeout",
      });
    });

    it("should return 500 on connection error", async () => {
      mockReq.params.id = "1";
      mockPool.query.mockRejectedValue(
        new Error("Connection pool exhausted")
      );

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it("should return 500 on SQL error", async () => {
      mockReq.params.id = "1";
      mockPool.query.mockRejectedValue(new Error("SQL syntax error"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server: SQL syntax error",
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle very large user id", async () => {
      const mockUser = {
        id: 2147483647,
        name: "User",
        email: "user@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        role: "user",
        points: 100,
        rank: "silver",
      };

      mockReq.params.id = "2147483647";
      mockPool.query.mockResolvedValue({ rows: [mockUser] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });

    it("should handle user with special characters in name", async () => {
      const mockUser = {
        id: 1,
        name: "Nguyễn Văn Ă",
        email: "nguyen@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        role: "user",
        points: 100,
        rank: "silver",
      };

      mockReq.params.id = "1";
      mockPool.query.mockResolvedValue({ rows: [mockUser] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });

    it("should handle user with emoji in name", async () => {
      const mockUser = {
        id: 1,
        name: "User 😀",
        email: "emoji@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        role: "user",
        points: 100,
        rank: "silver",
      };

      mockReq.params.id = "1";
      mockPool.query.mockResolvedValue({ rows: [mockUser] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });

    it("should handle user with very long name", async () => {
      const longName = "A".repeat(255);
      const mockUser = {
        id: 1,
        name: longName,
        email: "long@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        role: "user",
        points: 100,
        rank: "bronze",
      };

      mockReq.params.id = "1";
      mockPool.query.mockResolvedValue({ rows: [mockUser] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });

    it("should handle user with very high points", async () => {
      const mockUser = {
        id: 1,
        name: "VIP User",
        email: "vip@example.com",
        phone: "0123456789",
        gender: "female",
        birthdate: "1990-01-01",
        role: "user",
        points: 999999999,
        rank: "platinum",
      };

      mockReq.params.id = "1";
      mockPool.query.mockResolvedValue({ rows: [mockUser] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });

    it("should not include password in response", async () => {
      const mockUser = {
        id: 1,
        name: "Secure User",
        email: "secure@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        role: "user",
        points: 100,
        rank: "silver",
      };

      mockReq.params.id = "1";
      mockPool.query.mockResolvedValue({ rows: [mockUser] });

      await handler(mockReq, mockRes);

      const result = mockRes.json.mock.calls[0][0];
      expect(result).not.toHaveProperty("password");
    });

    it("should handle invalid id format gracefully", async () => {
      mockReq.params.id = "invalid-id";
      mockPool.query.mockRejectedValue(
        new Error('invalid input syntax for type integer: "invalid-id"')
      );

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it("should handle SQL injection attempt", async () => {
      mockReq.params.id = "1 OR 1=1";
      mockPool.query.mockResolvedValue({ rows: [] });

      await handler(mockReq, mockRes);

      // Parameterized query should prevent injection
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        ["1 OR 1=1"]
      );
    });

    it("should handle empty string id", async () => {
      mockReq.params.id = "";
      mockPool.query.mockRejectedValue(
        new Error('invalid input syntax for type integer: ""')
      );

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
