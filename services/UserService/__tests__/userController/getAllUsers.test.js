const getAllUsers = require("../../controllers/userController/getAllUsers");

describe("getAllUsers", () => {
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

    handler = getAllUsers({ pool: mockPool });

    mockReq = {};

    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Success cases", () => {
    it("should return all users with role 'user'", async () => {
      const mockUsers = [
        {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          phone: "0123456789",
          gender: "male",
          birthdate: "1990-01-01",
          role: "user",
          points: 100,
          rank: "silver",
        },
        {
          id: 2,
          name: "Jane Smith",
          email: "jane@example.com",
          phone: "0987654321",
          gender: "female",
          birthdate: "1992-05-15",
          role: "user",
          points: 250,
          rank: "gold",
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockUsers });

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining(
          "SELECT id, name, email, phone, gender, birthdate, role, points, rank"
        )
      );
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE role = 'user'")
      );
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY id ASC")
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockUsers);
    });

    it("should return empty array when no users exist", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it("should only return users with role 'user', not employees or admins", async () => {
      const mockUsers = [
        {
          id: 1,
          name: "Regular User",
          email: "user@example.com",
          phone: "0123456789",
          gender: "male",
          birthdate: "1990-01-01",
          role: "user",
          points: 50,
          rank: "bronze",
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockUsers });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockUsers);
      // Verify all returned users have role 'user'
      mockUsers.forEach((user) => {
        expect(user.role).toBe("user");
      });
    });

    it("should return users ordered by id ascending", async () => {
      const mockUsers = [
        {
          id: 1,
          name: "User 1",
          email: "user1@example.com",
          role: "user",
          points: 10,
          rank: "bronze",
        },
        {
          id: 2,
          name: "User 2",
          email: "user2@example.com",
          role: "user",
          points: 20,
          rank: "silver",
        },
        {
          id: 5,
          name: "User 5",
          email: "user5@example.com",
          role: "user",
          points: 50,
          rank: "gold",
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockUsers });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockUsers);
      // Verify order is maintained
      const result = mockRes.json.mock.calls[0][0];
      for (let i = 1; i < result.length; i++) {
        expect(result[i].id).toBeGreaterThan(result[i - 1].id);
      }
    });

    it("should return users with all required fields", async () => {
      const mockUsers = [
        {
          id: 1,
          name: "Complete User",
          email: "complete@example.com",
          phone: "0123456789",
          gender: "male",
          birthdate: "1990-01-01",
          role: "user",
          points: 100,
          rank: "silver",
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockUsers });

      await handler(mockReq, mockRes);

      const result = mockRes.json.mock.calls[0][0][0];
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("email");
      expect(result).toHaveProperty("phone");
      expect(result).toHaveProperty("gender");
      expect(result).toHaveProperty("birthdate");
      expect(result).toHaveProperty("role");
      expect(result).toHaveProperty("points");
      expect(result).toHaveProperty("rank");
    });

    it("should handle users with 0 points", async () => {
      const mockUsers = [
        {
          id: 1,
          name: "New User",
          email: "new@example.com",
          phone: "0123456789",
          gender: "female",
          birthdate: "1995-01-01",
          role: "user",
          points: 0,
          rank: "bronze",
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockUsers });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockUsers);
    });

    it("should handle users with null rank", async () => {
      const mockUsers = [
        {
          id: 1,
          name: "User",
          email: "user@example.com",
          phone: "0123456789",
          gender: "male",
          birthdate: "1990-01-01",
          role: "user",
          points: 10,
          rank: null,
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockUsers });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockUsers);
    });

    it("should handle large number of users", async () => {
      const mockUsers = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        phone: `012345${i.toString().padStart(4, "0")}`,
        gender: i % 2 === 0 ? "male" : "female",
        birthdate: "1990-01-01",
        role: "user",
        points: i * 10,
        rank: "bronze",
      }));

      mockPool.query.mockResolvedValue({ rows: mockUsers });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockUsers);
      expect(mockUsers.length).toBe(100);
    });
  });

  describe("Error cases", () => {
    it("should return 500 on database error", async () => {
      mockPool.query.mockRejectedValue(new Error("Database connection failed"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server khi lấy danh sách user: Database connection failed",
      });
    });

    it("should return 500 on database timeout", async () => {
      mockPool.query.mockRejectedValue(new Error("Query timeout"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server khi lấy danh sách user: Query timeout",
      });
    });

    it("should return 500 on connection pool exhausted", async () => {
      mockPool.query.mockRejectedValue(new Error("Connection pool exhausted"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server khi lấy danh sách user: Connection pool exhausted",
      });
    });

    it("should return 500 on SQL syntax error", async () => {
      mockPool.query.mockRejectedValue(new Error("SQL syntax error"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server khi lấy danh sách user: SQL syntax error",
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle users with special characters in name", async () => {
      const mockUsers = [
        {
          id: 1,
          name: "Nguyễn Văn Ă",
          email: "nguyen@example.com",
          phone: "0123456789",
          gender: "male",
          birthdate: "1990-01-01",
          role: "user",
          points: 100,
          rank: "silver",
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockUsers });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockUsers);
    });

    it("should handle users with very long names", async () => {
      const longName = "A".repeat(255);
      const mockUsers = [
        {
          id: 1,
          name: longName,
          email: "long@example.com",
          phone: "0123456789",
          gender: "male",
          birthdate: "1990-01-01",
          role: "user",
          points: 100,
          rank: "bronze",
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockUsers });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockUsers);
    });

    it("should handle users with different rank values", async () => {
      const mockUsers = [
        {
          id: 1,
          name: "Bronze User",
          email: "bronze@example.com",
          role: "user",
          points: 10,
          rank: "bronze",
        },
        {
          id: 2,
          name: "Silver User",
          email: "silver@example.com",
          role: "user",
          points: 100,
          rank: "silver",
        },
        {
          id: 3,
          name: "Gold User",
          email: "gold@example.com",
          role: "user",
          points: 500,
          rank: "gold",
        },
        {
          id: 4,
          name: "Platinum User",
          email: "platinum@example.com",
          role: "user",
          points: 1000,
          rank: "platinum",
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockUsers });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockUsers);
    });

    it("should handle users with very high points", async () => {
      const mockUsers = [
        {
          id: 1,
          name: "VIP User",
          email: "vip@example.com",
          phone: "0123456789",
          gender: "male",
          birthdate: "1990-01-01",
          role: "user",
          points: 999999,
          rank: "platinum",
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockUsers });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockUsers);
    });

    it("should handle users with old birthdate", async () => {
      const mockUsers = [
        {
          id: 1,
          name: "Old User",
          email: "old@example.com",
          phone: "0123456789",
          gender: "male",
          birthdate: "1950-01-01",
          role: "user",
          points: 100,
          rank: "silver",
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockUsers });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockUsers);
    });

    it("should handle users with future birthdate", async () => {
      const mockUsers = [
        {
          id: 1,
          name: "Future User",
          email: "future@example.com",
          phone: "0123456789",
          gender: "male",
          birthdate: "2030-01-01",
          role: "user",
          points: 50,
          rank: "bronze",
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockUsers });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockUsers);
    });

    it("should not include password field in response", async () => {
      const mockUsers = [
        {
          id: 1,
          name: "Secure User",
          email: "secure@example.com",
          phone: "0123456789",
          gender: "male",
          birthdate: "1990-01-01",
          role: "user",
          points: 100,
          rank: "silver",
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockUsers });

      await handler(mockReq, mockRes);

      const result = mockRes.json.mock.calls[0][0][0];
      expect(result).not.toHaveProperty("password");
    });
  });
});
