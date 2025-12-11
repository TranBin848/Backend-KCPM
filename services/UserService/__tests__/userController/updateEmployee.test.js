const updateEmployee = require("../../controllers/userController/updateEmployee");

describe("updateEmployee", () => {
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

    handler = updateEmployee({ pool: mockPool });

    mockReq = {
      params: { id: "1" },
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
    it("should update employee successfully", async () => {
      mockReq.body = {
        name: "John Updated",
        email: "john.updated@example.com",
        phone: "0999888777",
        gender: "male",
        birthdate: "1990-01-01",
        identity_card: "987654321",
        workplace: "Branch B",
      };
      mockPool.query.mockResolvedValue({
        rowCount: 1,
        rows: [
          {
            id: 1,
            name: "John Updated",
            email: "john.updated@example.com",
            phone: "0999888777",
            gender: "male",
            birthdate: "1990-01-01",
            role: "employee",
            identity_card: "987654321",
            workplace: "Branch B",
          },
        ],
      });

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE users SET"),
        [
          "John Updated",
          "john.updated@example.com",
          "0999888777",
          "male",
          "1990-01-01",
          "987654321",
          "Branch B",
          1,
        ]
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Cập nhật nhân viên thành công",
        employee: expect.objectContaining({
          id: 1,
          name: "John Updated",
          role: "employee",
        }),
      });
    });

    it("should include WHERE role='employee' in query", async () => {
      mockReq.body = {
        name: "Test",
        email: "test@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        identity_card: "123456789",
        workplace: "Branch A",
      };
      mockPool.query.mockResolvedValue({
        rowCount: 1,
        rows: [{ id: 1, role: "employee" }],
      });

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("role='employee'"),
        expect.any(Array)
      );
    });

    it("should return updated employee without password", async () => {
      mockReq.body = {
        name: "Employee",
        email: "emp@example.com",
        phone: "0111222333",
        gender: "female",
        birthdate: "1992-05-15",
        identity_card: "111222333",
        workplace: "HQ",
      };
      mockPool.query.mockResolvedValue({
        rowCount: 1,
        rows: [
          {
            id: 1,
            name: "Employee",
            email: "emp@example.com",
            role: "employee",
          },
        ],
      });

      await handler(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.employee).not.toHaveProperty("password");
    });

    it("should update all fields at once", async () => {
      mockReq.body = {
        name: "Full Update",
        email: "full@example.com",
        phone: "0555666777",
        gender: "other",
        birthdate: "1985-12-31",
        identity_card: "555666777",
        workplace: "Office 1",
      };
      mockPool.query.mockResolvedValue({
        rowCount: 1,
        rows: [
          {
            id: 1,
            name: "Full Update",
            email: "full@example.com",
            phone: "0555666777",
            gender: "other",
            birthdate: "1985-12-31",
            role: "employee",
            identity_card: "555666777",
            workplace: "Office 1",
          },
        ],
      });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Cập nhật nhân viên thành công",
        employee: expect.objectContaining({
          name: "Full Update",
          email: "full@example.com",
          phone: "0555666777",
        }),
      });
    });
  });

  describe("Not found cases", () => {
    it("should return 404 when employee does not exist", async () => {
      mockReq.params.id = "999";
      mockReq.body = {
        name: "Test",
        email: "test@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        identity_card: "123456789",
        workplace: "Branch",
      };
      mockPool.query.mockResolvedValue({ rowCount: 0, rows: [] });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Nhân viên không tồn tại hoặc không phải nhân viên",
      });
    });

    it("should return 404 when user exists but is not employee", async () => {
      mockReq.params.id = "5";
      mockReq.body = {
        name: "Test",
        email: "test@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        identity_card: "123456789",
        workplace: "Branch",
      };
      mockPool.query.mockResolvedValue({ rowCount: 0, rows: [] });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe("Duplicate constraint cases", () => {
    it("should return 400 when email is already used", async () => {
      mockReq.body = {
        name: "Test",
        email: "existing@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        identity_card: "123456789",
        workplace: "Branch",
      };
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
        name: "Test",
        email: "test@example.com",
        phone: "0999999999",
        gender: "male",
        birthdate: "1990-01-01",
        identity_card: "123456789",
        workplace: "Branch",
      };
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
    it("should return 500 on database error", async () => {
      mockReq.body = {
        name: "Test",
        email: "test@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        identity_card: "123456789",
        workplace: "Branch",
      };
      mockPool.query.mockRejectedValue(new Error("Database connection lost"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi server khi cập nhật nhân viên: Database connection lost",
      });
    });

    it("should return 500 on unknown constraint violation", async () => {
      mockReq.body = {
        name: "Test",
        email: "test@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        identity_card: "123456789",
        workplace: "Branch",
      };
      const error = new Error("Constraint violation");
      error.code = "23505";
      error.detail = "Key (unknown_field)=(value) already exists.";
      mockPool.query.mockRejectedValue(error);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it("should return 500 on connection timeout", async () => {
      mockReq.body = {
        name: "Test",
        email: "test@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        identity_card: "123456789",
        workplace: "Branch",
      };
      mockPool.query.mockRejectedValue(new Error("Connection timeout"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe("Edge cases", () => {
    it("should handle string id in params", async () => {
      mockReq.params.id = "10";
      mockReq.body = {
        name: "Test",
        email: "test@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        identity_card: "123456789",
        workplace: "Branch",
      };
      mockPool.query.mockResolvedValue({
        rowCount: 1,
        rows: [{ id: 10, role: "employee" }],
      });

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([10])
      );
    });

    it("should handle large employee id", async () => {
      mockReq.params.id = "999999";
      mockReq.body = {
        name: "Test",
        email: "test@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        identity_card: "123456789",
        workplace: "Branch",
      };
      mockPool.query.mockResolvedValue({
        rowCount: 1,
        rows: [{ id: 999999, role: "employee" }],
      });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Cập nhật nhân viên thành công",
        employee: expect.any(Object),
      });
    });

    it("should handle long names", async () => {
      const longName = "A".repeat(200);
      mockReq.body = {
        name: longName,
        email: "long@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        identity_card: "123456789",
        workplace: "Branch",
      };
      mockPool.query.mockResolvedValue({
        rowCount: 1,
        rows: [{ id: 1, name: longName, role: "employee" }],
      });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Cập nhật nhân viên thành công",
        employee: expect.any(Object),
      });
    });

    it("should handle special characters in name", async () => {
      mockReq.body = {
        name: "Nguyễn Văn Ä",
        email: "special@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        identity_card: "123456789",
        workplace: "Branch",
      };
      mockPool.query.mockResolvedValue({
        rowCount: 1,
        rows: [{ id: 1, name: "Nguyễn Văn Ä", role: "employee" }],
      });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Cập nhật nhân viên thành công",
        employee: expect.any(Object),
      });
    });

    it("should handle email with special characters", async () => {
      mockReq.body = {
        name: "Test",
        email: "test+123@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        identity_card: "123456789",
        workplace: "Branch",
      };
      mockPool.query.mockResolvedValue({
        rowCount: 1,
        rows: [{ id: 1, email: "test+123@example.com", role: "employee" }],
      });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Cập nhật nhân viên thành công",
        employee: expect.any(Object),
      });
    });

    it("should handle different gender values", async () => {
      const genders = ["male", "female", "other"];
      for (const gender of genders) {
        mockReq.body = {
          name: "Test",
          email: `${gender}@example.com`,
          phone: "0123456789",
          gender: gender,
          birthdate: "1990-01-01",
          identity_card: "123456789",
          workplace: "Branch",
        };
        mockPool.query.mockResolvedValue({
          rowCount: 1,
          rows: [{ id: 1, gender: gender, role: "employee" }],
        });

        await handler(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith({
          message: "Cập nhật nhân viên thành công",
          employee: expect.any(Object),
        });
        jest.clearAllMocks();
      }
    });
  });
});
