const updateUser = require("../../controllers/userController/updateUser");

describe("updateUser", () => {
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

    handler = updateUser({ pool: mockPool });

    mockReq = {
      params: {},
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
    it("should update user successfully with all fields", async () => {
      const updatedUser = {
        id: 1,
        name: "Updated Name",
        email: "updated@example.com",
        phone: "0999888777",
        gender: "male",
        birthdate: "1990-05-15",
        role: "user",
        points: 100,
        rank: "silver",
      };

      mockReq.params.id = "1";
      mockReq.body = {
        name: "Updated Name",
        email: "updated@example.com",
        phone: "0999888777",
        gender: "male",
        birthdate: "1990-05-15",
      };

      mockPool.query.mockResolvedValue({ rowCount: 1, rows: [updatedUser] });

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE users"),
        ["Updated Name", "updated@example.com", "0999888777", "male", "1990-05-15", 1]
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Cập nhật thông tin người dùng thành công.",
        user: updatedUser,
      });
    });

    it("should update only name", async () => {
      const updatedUser = {
        id: 2,
        name: "New Name Only",
        email: "old@example.com",
        phone: "0123456789",
        gender: "female",
        birthdate: "1992-01-01",
        role: "user",
        points: 50,
        rank: "bronze",
      };

      mockReq.params.id = "2";
      mockReq.body = {
        name: "New Name Only",
        email: "old@example.com",
        phone: "0123456789",
        gender: "female",
        birthdate: "1992-01-01",
      };

      mockPool.query.mockResolvedValue({ rowCount: 1, rows: [updatedUser] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Cập nhật thông tin người dùng thành công.",
        user: updatedUser,
      });
    });

    it("should update email only", async () => {
      const updatedUser = {
        id: 3,
        name: "Same Name",
        email: "newemail@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        role: "user",
        points: 100,
        rank: "silver",
      };

      mockReq.params.id = "3";
      mockReq.body = {
        name: "Same Name",
        email: "newemail@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
      };

      mockPool.query.mockResolvedValue({ rowCount: 1, rows: [updatedUser] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            email: "newemail@example.com",
          }),
        })
      );
    });

    it("should update phone number", async () => {
      const updatedUser = {
        id: 4,
        name: "User",
        email: "user@example.com",
        phone: "0111222333",
        gender: "female",
        birthdate: "1995-06-10",
        role: "user",
        points: 200,
        rank: "gold",
      };

      mockReq.params.id = "4";
      mockReq.body = {
        name: "User",
        email: "user@example.com",
        phone: "0111222333",
        gender: "female",
        birthdate: "1995-06-10",
      };

      mockPool.query.mockResolvedValue({ rowCount: 1, rows: [updatedUser] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            phone: "0111222333",
          }),
        })
      );
    });

    it("should update gender", async () => {
      const updatedUser = {
        id: 5,
        name: "User",
        email: "user@example.com",
        phone: "0123456789",
        gender: "other",
        birthdate: "1990-01-01",
        role: "user",
        points: 100,
        rank: "silver",
      };

      mockReq.params.id = "5";
      mockReq.body = {
        name: "User",
        email: "user@example.com",
        phone: "0123456789",
        gender: "other",
        birthdate: "1990-01-01",
      };

      mockPool.query.mockResolvedValue({ rowCount: 1, rows: [updatedUser] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            gender: "other",
          }),
        })
      );
    });

    it("should update birthdate", async () => {
      const updatedUser = {
        id: 6,
        name: "User",
        email: "user@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1985-12-25",
        role: "user",
        points: 100,
        rank: "silver",
      };

      mockReq.params.id = "6";
      mockReq.body = {
        name: "User",
        email: "user@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1985-12-25",
      };

      mockPool.query.mockResolvedValue({ rowCount: 1, rows: [updatedUser] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            birthdate: "1985-12-25",
          }),
        })
      );
    });

    it("should not modify role and points", async () => {
      const updatedUser = {
        id: 7,
        name: "Updated User",
        email: "updated@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        role: "user",
        points: 150,
        rank: "silver",
      };

      mockReq.params.id = "7";
      mockReq.body = {
        name: "Updated User",
        email: "updated@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
      };

      mockPool.query.mockResolvedValue({ rowCount: 1, rows: [updatedUser] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            role: "user",
            points: 150,
          }),
        })
      );
    });
  });

  describe("Not found cases", () => {
    it("should return 404 when user not found", async () => {
      mockReq.params.id = "999";
      mockReq.body = {
        name: "Test",
        email: "test@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
      };

      mockPool.query.mockResolvedValue({ rowCount: 0, rows: [] });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Người dùng không tồn tại.",
      });
    });

    it("should return 404 when user was deleted", async () => {
      mockReq.params.id = "123";
      mockReq.body = {
        name: "Test",
        email: "test@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
      };

      mockPool.query.mockResolvedValue({ rowCount: 0, rows: [] });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe("Duplicate entry cases", () => {
    it("should return 400 when email already exists", async () => {
      mockReq.params.id = "1";
      mockReq.body = {
        name: "User",
        email: "existing@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
      };

      const duplicateError = new Error("Duplicate key");
      duplicateError.code = "23505";
      duplicateError.detail = "Key (email)=(existing@example.com) already exists.";
      mockPool.query.mockRejectedValue(duplicateError);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Email đã được sử dụng.",
      });
    });

    it("should return 400 when phone already exists", async () => {
      mockReq.params.id = "1";
      mockReq.body = {
        name: "User",
        email: "user@example.com",
        phone: "0987654321",
        gender: "female",
        birthdate: "1992-02-02",
      };

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
      mockReq.params.id = "1";
      mockReq.body = {
        name: "User",
        email: "user@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
      };

      mockPool.query.mockRejectedValue(new Error("Database connection failed"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi cập nhật: Database connection failed",
      });
    });

    it("should return 500 on database timeout", async () => {
      mockReq.params.id = "1";
      mockReq.body = {
        name: "User",
        email: "user@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
      };

      mockPool.query.mockRejectedValue(new Error("Query timeout"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it("should return 500 on connection error", async () => {
      mockReq.params.id = "1";
      mockReq.body = {
        name: "User",
        email: "user@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
      };

      mockPool.query.mockRejectedValue(
        new Error("Connection pool exhausted")
      );

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi cập nhật: Connection pool exhausted",
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle name with special characters", async () => {
      const updatedUser = {
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
      mockReq.body = {
        name: "Nguyễn Văn Ă",
        email: "nguyen@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
      };

      mockPool.query.mockResolvedValue({ rowCount: 1, rows: [updatedUser] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            name: "Nguyễn Văn Ă",
          }),
        })
      );
    });

    it("should handle very long name", async () => {
      const longName = "A".repeat(255);
      const updatedUser = {
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
      mockReq.body = {
        name: longName,
        email: "long@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
      };

      mockPool.query.mockResolvedValue({ rowCount: 1, rows: [updatedUser] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Cập nhật thông tin người dùng thành công.",
        })
      );
    });

    it("should handle email with uppercase letters", async () => {
      const updatedUser = {
        id: 1,
        name: "User",
        email: "TEST@EXAMPLE.COM",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        role: "user",
        points: 100,
        rank: "silver",
      };

      mockReq.params.id = "1";
      mockReq.body = {
        name: "User",
        email: "TEST@EXAMPLE.COM",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
      };

      mockPool.query.mockResolvedValue({ rowCount: 1, rows: [updatedUser] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            email: "TEST@EXAMPLE.COM",
          }),
        })
      );
    });

    it("should handle phone with spaces", async () => {
      const updatedUser = {
        id: 1,
        name: "User",
        email: "user@example.com",
        phone: "012 345 6789",
        gender: "male",
        birthdate: "1990-01-01",
        role: "user",
        points: 100,
        rank: "silver",
      };

      mockReq.params.id = "1";
      mockReq.body = {
        name: "User",
        email: "user@example.com",
        phone: "012 345 6789",
        gender: "male",
        birthdate: "1990-01-01",
      };

      mockPool.query.mockResolvedValue({ rowCount: 1, rows: [updatedUser] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            phone: "012 345 6789",
          }),
        })
      );
    });

    it("should handle very old birthdate", async () => {
      const updatedUser = {
        id: 1,
        name: "Old User",
        email: "old@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1920-01-01",
        role: "user",
        points: 100,
        rank: "silver",
      };

      mockReq.params.id = "1";
      mockReq.body = {
        name: "Old User",
        email: "old@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1920-01-01",
      };

      mockPool.query.mockResolvedValue({ rowCount: 1, rows: [updatedUser] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            birthdate: "1920-01-01",
          }),
        })
      );
    });

    it("should handle future birthdate", async () => {
      const updatedUser = {
        id: 1,
        name: "Future User",
        email: "future@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "2030-01-01",
        role: "user",
        points: 50,
        rank: "bronze",
      };

      mockReq.params.id = "1";
      mockReq.body = {
        name: "Future User",
        email: "future@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "2030-01-01",
      };

      mockPool.query.mockResolvedValue({ rowCount: 1, rows: [updatedUser] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            birthdate: "2030-01-01",
          }),
        })
      );
    });

    it("should parse string id to integer", async () => {
      const updatedUser = {
        id: 123,
        name: "User",
        email: "user@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        role: "user",
        points: 100,
        rank: "silver",
      };

      mockReq.params.id = "123";
      mockReq.body = {
        name: "User",
        email: "user@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
      };

      mockPool.query.mockResolvedValue({ rowCount: 1, rows: [updatedUser] });

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([123])
      );
    });

    it("should handle updating to same values", async () => {
      const updatedUser = {
        id: 1,
        name: "Same Name",
        email: "same@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
        role: "user",
        points: 100,
        rank: "silver",
      };

      mockReq.params.id = "1";
      mockReq.body = {
        name: "Same Name",
        email: "same@example.com",
        phone: "0123456789",
        gender: "male",
        birthdate: "1990-01-01",
      };

      mockPool.query.mockResolvedValue({ rowCount: 1, rows: [updatedUser] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Cập nhật thông tin người dùng thành công.",
        user: updatedUser,
      });
    });
  });
});
