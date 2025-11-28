const createSeatController = require("../controllers/seatController");

describe("seatController", () => {
  let mockPool;
  let seatController;

  beforeAll(() => {
    // Suppress console.error during tests
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  beforeEach(() => {
    // Create mock pool
    mockPool = {
      query: jest.fn(),
    };

    // Create controller instance
    seatController = createSeatController({ pool: mockPool });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("generateSeats", () => {
    it("should generate seats successfully", async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // Delete old seats
        .mockResolvedValue({ rows: [{ id: 1 }] }); // Insert seats

      const req = {
        body: {
          room_id: 1,
          rows: 2,
          columns: 3,
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await seatController.generateSeats(req, res);

      expect(mockPool.query).toHaveBeenCalledWith(
        "DELETE FROM seats WHERE room_id = $1",
        [1]
      );
      // Should insert 2 rows * 3 columns = 6 seats
      expect(mockPool.query).toHaveBeenCalledTimes(7); // 1 delete + 6 inserts
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Tạo ghế thành công cho phòng",
        room_id: 1,
      });
    });

    it("should return 400 if required fields are missing or invalid", async () => {
      const req = {
        body: {
          room_id: 1,
          rows: 0, // Invalid
          columns: 3,
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await seatController.generateSeats(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "room_id, rows, columns không hợp lệ",
      });
    });

    it("should handle errors when generating seats", async () => {
      mockPool.query.mockRejectedValue(new Error("Database error"));

      const req = {
        body: {
          room_id: 1,
          rows: 2,
          columns: 3,
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await seatController.generateSeats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Lỗi khi tạo ghế" });
    });
  });

  describe("getSeatById", () => {
    it("should get seat by id successfully", async () => {
      const mockSeat = {
        id: 1,
        room_id: 1,
        seat_number: "A1",
        type: "regular",
        status: "active",
      };

      mockPool.query.mockResolvedValue({ rows: [mockSeat] });

      const req = { params: { id: "1" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await seatController.getSeatById(req, res);

      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT * FROM seats WHERE id = $1",
        ["1"]
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockSeat);
    });

    it("should return 404 if seat not found", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const req = { params: { id: "999" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await seatController.getSeatById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Không tìm thấy ghế" });
    });

    it("should handle errors when getting seat by id", async () => {
      mockPool.query.mockRejectedValue(new Error("Database error"));

      const req = { params: { id: "1" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await seatController.getSeatById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Không thể lấy thông tin ghế",
      });
    });
  });

  describe("getSeatsByRoom", () => {
    it("should get all seats for a room successfully", async () => {
      const mockSeats = [
        { id: 1, seat_number: "A1", type: "regular" },
        { id: 2, seat_number: "A2", type: "vip" },
      ];

      mockPool.query.mockResolvedValue({ rows: mockSeats });

      const req = { params: { room_id: "1" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await seatController.getSeatsByRoom(req, res);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM seats WHERE room_id = $1"),
        ["1"]
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ seats: mockSeats });
    });

    it("should handle errors when getting seats by room", async () => {
      mockPool.query.mockRejectedValue(new Error("Database error"));

      const req = { params: { room_id: "1" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await seatController.getSeatsByRoom(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Không thể lấy danh sách ghế",
      });
    });
  });

  describe("updateSeatType", () => {
    it("should update seat type to vip successfully", async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Seat exists
        .mockResolvedValueOnce({ rows: [] }); // Update success

      const req = {
        params: { id: "1" },
        body: { type: "vip" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await seatController.updateSeatType(req, res);

      expect(mockPool.query).toHaveBeenCalledWith(
        "UPDATE seats SET type = $1 WHERE id = $2",
        ["vip", "1"]
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Đã chuyển ghế sang loại 'vip'",
      });
    });

    it("should update seat type to regular successfully", async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [] });

      const req = {
        params: { id: "1" },
        body: { type: "regular" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await seatController.updateSeatType(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Đã chuyển ghế sang loại 'regular'",
      });
    });

    it("should return 400 if type is invalid", async () => {
      const req = {
        params: { id: "1" },
        body: { type: "invalid" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await seatController.updateSeatType(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Loại ghế không hợp lệ. Chỉ chấp nhận 'vip' hoặc 'regular'",
      });
    });

    it("should return 404 if seat not found", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const req = {
        params: { id: "999" },
        body: { type: "vip" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await seatController.updateSeatType(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Không tìm thấy ghế" });
    });

    it("should handle errors when updating seat type", async () => {
      mockPool.query.mockRejectedValue(new Error("Database error"));

      const req = {
        params: { id: "1" },
        body: { type: "vip" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await seatController.updateSeatType(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Lỗi khi cập nhật loại ghế",
      });
    });
  });

  describe("updateSeatStatus", () => {
    it("should update seat status to inactive successfully", async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Seat exists
        .mockResolvedValueOnce({ rows: [] }); // Update success

      const req = {
        params: { id: "1" },
        body: { status: "inactive" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await seatController.updateSeatStatus(req, res);

      expect(mockPool.query).toHaveBeenCalledWith(
        "UPDATE seats SET status = $1 WHERE id = $2",
        ["inactive", "1"]
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Đã cập nhật trạng thái ghế thành 'inactive'",
      });
    });

    it("should update seat status to active successfully", async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [] });

      const req = {
        params: { id: "1" },
        body: { status: "active" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await seatController.updateSeatStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Đã cập nhật trạng thái ghế thành 'active'",
      });
    });

    it("should return 400 if status is invalid", async () => {
      const req = {
        params: { id: "1" },
        body: { status: "invalid" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await seatController.updateSeatStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error:
          "Trạng thái ghế không hợp lệ. Chỉ chấp nhận 'active' hoặc 'inactive'",
      });
    });

    it("should return 404 if seat not found", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const req = {
        params: { id: "999" },
        body: { status: "inactive" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await seatController.updateSeatStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Không tìm thấy ghế" });
    });

    it("should handle errors when updating seat status", async () => {
      mockPool.query.mockRejectedValue(new Error("Database error"));

      const req = {
        params: { id: "1" },
        body: { status: "inactive" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await seatController.updateSeatStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Lỗi khi cập nhật trạng thái ghế",
      });
    });
  });
});
