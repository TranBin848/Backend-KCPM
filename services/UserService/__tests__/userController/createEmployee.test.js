const createEmployee = require("../../controllers/userController/createEmployee");

describe("createEmployee", () => {
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

    handler = createEmployee({ pool: mockPool, bcrypt: mockBcrypt });

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
    it("should create employee successfully", async () => {
      mockReq.body = {
        name: "John Doe",
        email: "john@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "password123",
        role: "employee",
        identity_card: "123456789",
        workplace: "Branch A",
      };
      mockBcrypt.hash.mockResolvedValue("hashedPassword");
      mockPool.query.mockResolvedValue({
        rows: [
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
        ],
      });

      await handler(mockReq, mockRes);

      expect(mockBcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO users"),
        [
          "John Doe",
          "john@example.com",
          "0123456789",
          "male",
          "1990-01-01",
          "hashedPassword",
          "employee",
          "123456789",
          "Branch A",
        ]
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Tạo nhân viên thành công",
        employee: expect.objectContaining({
          name: "John Doe",
          email: "john@example.com",
          role: "employee",
        }),
      });
    });

    it("should hash password with salt rounds 10", async () => {
      mockReq.body = {
        name: "Jane",
        email: "jane@example.com",
        phone: "0987654321",
        gender: "female",
        birthdate: "1992-05-15",
        password: "securePass",
        role: "employee",
        identity_card: "987654321",
        workplace: "Branch B",
      };
      mockBcrypt.hash.mockResolvedValue("hashed");
      mockPool.query.mockResolvedValue({
        rows: [{ id: 2, name: "Jane", role: "employee" }],
      });

      await handler(mockReq, mockRes);

      expect(mockBcrypt.hash).toHaveBeenCalledWith("securePass", 10);
    });

    it("should return employee data without password", async () => {
      mockReq.body = {
        name: "Test User",
        email: "test@example.com",
        phone: "0111222333",
        gender: "other",
        birthdate: "1995-03-20",
        password: "testpass",
        role: "employee",
        identity_card: "111222333",
        workplace: "HQ",
      };
      mockBcrypt.hash.mockResolvedValue("hashed");
      mockPool.query.mockResolvedValue({
        rows: [
          {
            id: 3,
            name: "Test User",
            email: "test@example.com",
            role: "employee",
          },
        ],
      });

      await handler(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.employee).not.toHaveProperty("password");
    });

    it("should create employee with all required fields", async () => {
      mockReq.body = {
        name: "Full Name",
        email: "full@example.com",
        phone: "0999888777",
        gender: "female",
        birthdate: "1988-12-31",
        password: "pass",
        role: "employee",
        identity_card: "999888777",
        workplace: "Office 1",
      };
      mockBcrypt.hash.mockResolvedValue("hashed");
      mockPool.query.mockResolvedValue({
        rows: [{ id: 4, role: "employee" }],
      });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe("Role validation cases", () => {
    it("should return 400 when role is not employee", async () => {
      mockReq.body = {
        name: "User",
        email: "user@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "pass",
        role: "user",
        identity_card: "123456789",
        workplace: "Branch",
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Chỉ được tạo tài khoản với role là employee",
      });
    });

    it("should return 400 when role is admin", async () => {
      mockReq.body = {
        name: "Admin",
        email: "admin@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "pass",
        role: "admin",
        identity_card: "123456789",
        workplace: "Branch",
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when role is empty string", async () => {
      mockReq.body = {
        name: "User",
        email: "user@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "pass",
        role: "",
        identity_card: "123456789",
        workplace: "Branch",
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when role is undefined", async () => {
      mockReq.body = {
        name: "User",
        email: "user@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "pass",
        identity_card: "123456789",
        workplace: "Branch",
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Duplicate constraint cases", () => {
    it("should return 400 when email is already used", async () => {
      mockReq.body = {
        name: "User",
        email: "existing@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "pass",
        role: "employee",
        identity_card: "123456789",
        workplace: "Branch",
      };
      mockBcrypt.hash.mockResolvedValue("hashed");
      const error = new Error("Duplicate key");
      error.code = "23505";
      error.detail = "Key (email)=(existing@example.com) already exists.";
      mockPool.query.mockRejectedValue(error);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Email đã được sử dụng.",
      });
    });

    it("should return 400 when phone is already used", async () => {
      mockReq.body = {
        name: "User",
        email: "user@example.com",
        phone: "0999999999",
        gender: "male",
        birthdate: "1990-01-01",
        password: "pass",
        role: "employee",
        identity_card: "123456789",
        workplace: "Branch",
      };
      mockBcrypt.hash.mockResolvedValue("hashed");
      const error = new Error("Duplicate key");
      error.code = "23505";
      error.detail = "Key (phone)=(0999999999) already exists.";
      mockPool.query.mockRejectedValue(error);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Số điện thoại đã được sử dụng.",
      });
    });
  });

  describe("Error cases", () => {
    it("should return 500 on bcrypt hash error", async () => {
      mockReq.body = {
        name: "User",
        email: "user@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "pass",
        role: "employee",
        identity_card: "123456789",
        workplace: "Branch",
      };
      mockBcrypt.hash.mockRejectedValue(new Error("Hash error"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server khi tạo nhân viên: Hash error",
      });
    });

    it("should return 500 on database error", async () => {
      mockReq.body = {
        name: "User",
        email: "user@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "pass",
        role: "employee",
        identity_card: "123456789",
        workplace: "Branch",
      };
      mockBcrypt.hash.mockResolvedValue("hashed");
      mockPool.query.mockRejectedValue(new Error("Database connection lost"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server khi tạo nhân viên: Database connection lost",
      });
    });

    it("should return 500 on unknown constraint violation", async () => {
      mockReq.body = {
        name: "User",
        email: "user@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "pass",
        role: "employee",
        identity_card: "123456789",
        workplace: "Branch",
      };
      mockBcrypt.hash.mockResolvedValue("hashed");
      const error = new Error("Constraint violation");
      error.code = "23505";
      error.detail = "Key (unknown_field)=(value) already exists.";
      mockPool.query.mockRejectedValue(error);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe("Edge cases", () => {
    it("should handle long names", async () => {
      const longName = "A".repeat(100);
      mockReq.body = {
        name: longName,
        email: "long@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "pass",
        role: "employee",
        identity_card: "123456789",
        workplace: "Branch",
      };
      mockBcrypt.hash.mockResolvedValue("hashed");
      mockPool.query.mockResolvedValue({
        rows: [{ id: 1, name: longName, role: "employee" }],
      });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle special characters in name", async () => {
      mockReq.body = {
        name: "Nguyễn Văn Ä",
        email: "special@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "pass",
        role: "employee",
        identity_card: "123456789",
        workplace: "Branch",
      };
      mockBcrypt.hash.mockResolvedValue("hashed");
      mockPool.query.mockResolvedValue({
        rows: [{ id: 1, name: "Nguyễn Văn Ä", role: "employee" }],
      });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle email with special characters", async () => {
      mockReq.body = {
        name: "User",
        email: "user+test@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        password: "pass",
        role: "employee",
        identity_card: "123456789",
        workplace: "Branch",
      };
      mockBcrypt.hash.mockResolvedValue("hashed");
      mockPool.query.mockResolvedValue({
        rows: [{ id: 1, email: "user+test@example.com", role: "employee" }],
      });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle all gender options", async () => {
      const genders = ["male", "female", "other"];
      for (const gender of genders) {
        mockReq.body = {
          name: `User ${gender}`,
          email: `${gender}@example.com`,
          phone: `012345${Math.random().toString().substring(2, 6)}`,
          gender: gender,
          birthdate: "1990-01-01",
          password: "pass",
          role: "employee",
          identity_card: "123456789",
          workplace: "Branch",
        };
        mockBcrypt.hash.mockResolvedValue("hashed");
        mockPool.query.mockResolvedValue({
          rows: [{ id: 1, gender: gender, role: "employee" }],
        });

        await handler(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(201);
        jest.clearAllMocks();
      }
    });

    it("should handle different date formats", async () => {
      mockReq.body = {
        name: "User",
        email: "date@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "2000-12-31",
        password: "pass",
        role: "employee",
        identity_card: "123456789",
        workplace: "Branch",
      };
      mockBcrypt.hash.mockResolvedValue("hashed");
      mockPool.query.mockResolvedValue({
        rows: [{ id: 1, birthdate: "2000-12-31", role: "employee" }],
      });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });
});
