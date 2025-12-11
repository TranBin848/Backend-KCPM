const getAllEmployees = require("../../controllers/userController/getAllEmployees");

describe("getAllEmployees", () => {
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

    handler = getAllEmployees({ pool: mockPool });

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
    it("should return all employees successfully", async () => {
      const mockEmployees = [
        {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          phone: "0123456789",
          gender: "male",
          birthdate: "1990-01-01",
          role: "employee",
          identity_card: "123456789",
          workplace: "Branch A",
        },
        {
          id: 2,
          name: "Jane Smith",
          email: "jane@example.com",
          phone: "0987654321",
          gender: "female",
          birthdate: "1992-05-15",
          role: "employee",
          identity_card: "987654321",
          workplace: "Branch B",
        },
      ];
      mockPool.query.mockResolvedValue({ rows: mockEmployees });

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE role = 'employee'")
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        employees: mockEmployees,
      });
    });

    it("should filter by role='employee'", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("role = 'employee'")
      );
    });

    it("should order results by id", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY id")
      );
    });

    it("should not include password in results", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.not.stringContaining("password")
      );
    });

    it("should include all required fields", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await handler(mockReq, mockRes);

      const query = mockPool.query.mock.calls[0][0];
      expect(query).toContain("id");
      expect(query).toContain("name");
      expect(query).toContain("email");
      expect(query).toContain("phone");
      expect(query).toContain("gender");
      expect(query).toContain("birthdate");
      expect(query).toContain("role");
      expect(query).toContain("identity_card");
      expect(query).toContain("workplace");
    });
  });

  describe("Empty results cases", () => {
    it("should return empty array when no employees exist", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        employees: [],
      });
    });

    it("should handle database with no employees", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        employees: [],
      });
    });
  });

  describe("Multiple employees cases", () => {
    it("should return multiple employees", async () => {
      const mockEmployees = [
        { id: 1, name: "Employee 1", role: "employee" },
        { id: 2, name: "Employee 2", role: "employee" },
        { id: 3, name: "Employee 3", role: "employee" },
      ];
      mockPool.query.mockResolvedValue({ rows: mockEmployees });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        employees: mockEmployees,
      });
    });

    it("should handle large number of employees", async () => {
      const mockEmployees = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Employee ${i + 1}`,
        role: "employee",
      }));
      mockPool.query.mockResolvedValue({ rows: mockEmployees });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        employees: mockEmployees,
      });
      expect(mockEmployees).toHaveLength(100);
    });
  });

  describe("Ordering cases", () => {
    it("should return employees ordered by id ascending", async () => {
      const mockEmployees = [
        { id: 1, name: "First", role: "employee" },
        { id: 5, name: "Second", role: "employee" },
        { id: 10, name: "Third", role: "employee" },
      ];
      mockPool.query.mockResolvedValue({ rows: mockEmployees });

      await handler(mockReq, mockRes);

      const result = mockRes.json.mock.calls[0][0].employees;
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(5);
      expect(result[2].id).toBe(10);
    });

    it("should maintain order from database", async () => {
      const mockEmployees = [
        { id: 2, name: "B", role: "employee" },
        { id: 1, name: "A", role: "employee" },
        { id: 3, name: "C", role: "employee" },
      ];
      mockPool.query.mockResolvedValue({ rows: mockEmployees });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        employees: mockEmployees,
      });
    });
  });

  describe("Error cases", () => {
    it("should return 500 on database error", async () => {
      mockPool.query.mockRejectedValue(new Error("Database connection lost"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error:
          "Lỗi server khi lấy danh sách nhân viên: Database connection lost",
      });
    });

    it("should return 500 on connection timeout", async () => {
      mockPool.query.mockRejectedValue(new Error("Connection timeout"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server khi lấy danh sách nhân viên: Connection timeout",
      });
    });

    it("should return 500 on query error", async () => {
      mockPool.query.mockRejectedValue(new Error("Query syntax error"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it("should handle network errors", async () => {
      mockPool.query.mockRejectedValue(new Error("ECONNREFUSED"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe("Data integrity cases", () => {
    it("should return employees with all fields populated", async () => {
      const mockEmployees = [
        {
          id: 1,
          name: "Complete Employee",
          email: "complete@example.com",
          phone: "0123456789",
          gender: "male",
          birthdate: "1990-01-01",
          role: "employee",
          identity_card: "123456789",
          workplace: "HQ",
        },
      ];
      mockPool.query.mockResolvedValue({ rows: mockEmployees });

      await handler(mockReq, mockRes);

      const result = mockRes.json.mock.calls[0][0].employees[0];
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("email");
      expect(result).toHaveProperty("phone");
      expect(result).toHaveProperty("gender");
      expect(result).toHaveProperty("birthdate");
      expect(result).toHaveProperty("role");
      expect(result).toHaveProperty("identity_card");
      expect(result).toHaveProperty("workplace");
    });

    it("should handle employees with special characters", async () => {
      const mockEmployees = [
        {
          id: 1,
          name: "Nguyễn Văn Ä",
          email: "special@example.com",
          phone: "0123456789",
          gender: "male",
          birthdate: "1990-01-01",
          role: "employee",
          identity_card: "123456789",
          workplace: "Branch Ñ",
        },
      ];
      mockPool.query.mockResolvedValue({ rows: mockEmployees });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        employees: mockEmployees,
      });
    });

    it("should handle employees with different genders", async () => {
      const mockEmployees = [
        { id: 1, name: "Male", gender: "male", role: "employee" },
        { id: 2, name: "Female", gender: "female", role: "employee" },
        { id: 3, name: "Other", gender: "other", role: "employee" },
      ];
      mockPool.query.mockResolvedValue({ rows: mockEmployees });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        employees: mockEmployees,
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle single employee", async () => {
      const mockEmployees = [
        {
          id: 1,
          name: "Only Employee",
          role: "employee",
        },
      ];
      mockPool.query.mockResolvedValue({ rows: mockEmployees });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        employees: mockEmployees,
      });
    });

    it("should not require request body", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        employees: [],
      });
    });

    it("should not require query parameters", async () => {
      mockReq.query = {};
      mockPool.query.mockResolvedValue({ rows: [] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        employees: [],
      });
    });
  });
});
