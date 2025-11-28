const createRoomController = require("../controllers/roomController");

describe("roomController", () => {
  let mockPool;
  let roomController;

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
    roomController = createRoomController({ pool: mockPool });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createRoom", () => {
    it("should create room successfully", async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // No duplicate room
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Insert success

      const req = {
        body: {
          room_name: "Room 1",
          theater_id: 1,
          room_type: "2D",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await roomController.createRoom(req, res);

      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT 1 FROM rooms"),
        [1, "Room 1"]
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Tạo phòng chiếu thành công",
        roomId: 1,
      });
    });

    it("should return 400 if required fields are missing", async () => {
      const req = {
        body: {
          room_name: "Room 1",
          // missing theater_id and room_type
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await roomController.createRoom(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Thiếu room_name, theater_id hoặc room_type",
      });
    });

    it("should return 409 if room name already exists in theater", async () => {
      mockPool.query.mockResolvedValue({ rows: [{ id: 1 }] }); // Duplicate found

      const req = {
        body: {
          room_name: "Room 1",
          theater_id: 1,
          room_type: "2D",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await roomController.createRoom(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "Tên phòng đã tồn tại trong rạp này",
      });
    });

    it("should handle errors when creating room", async () => {
      mockPool.query.mockRejectedValue(new Error("Database error"));

      const req = {
        body: {
          room_name: "Room 1",
          theater_id: 1,
          room_type: "2D",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await roomController.createRoom(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Lỗi khi tạo phòng chiếu",
      });
    });
  });

  describe("updateRoom", () => {
    it("should update room successfully", async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Room exists
        .mockResolvedValueOnce({ rows: [] }); // Update success

      const req = {
        params: { roomId: "1" },
        body: {
          room_name: "Updated Room",
          room_type: "3D",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await roomController.updateRoom(req, res);

      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Cập nhật phòng thành công",
      });
    });

    it("should return 400 if required fields are missing", async () => {
      const req = {
        params: { roomId: "1" },
        body: {
          room_name: "Room 1",
          // missing room_type
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await roomController.updateRoom(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Thiếu room_name hoặc room_type",
      });
    });

    it("should return 404 if room not found", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const req = {
        params: { roomId: "999" },
        body: {
          room_name: "Room 1",
          room_type: "2D",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await roomController.updateRoom(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Phòng không tồn tại" });
    });

    it("should handle errors when updating room", async () => {
      mockPool.query.mockRejectedValue(new Error("Database error"));

      const req = {
        params: { roomId: "1" },
        body: {
          room_name: "Room 1",
          room_type: "2D",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await roomController.updateRoom(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Lỗi khi cập nhật phòng chiếu",
      });
    });
  });

  describe("deleteRoom", () => {
    it("should delete room successfully", async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Room exists
        .mockResolvedValueOnce({ rows: [] }); // Delete success

      const req = { params: { roomId: "1" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await roomController.deleteRoom(req, res);

      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT * FROM rooms WHERE id = $1",
        ["1"]
      );
      expect(mockPool.query).toHaveBeenCalledWith(
        "DELETE FROM rooms WHERE id = $1",
        ["1"]
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Xóa phòng chiếu thành công",
      });
    });

    it("should return 404 if room not found", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const req = { params: { roomId: "999" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await roomController.deleteRoom(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Phòng không tồn tại" });
    });

    it("should handle errors when deleting room", async () => {
      mockPool.query.mockRejectedValue(new Error("Database error"));

      const req = { params: { roomId: "1" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await roomController.deleteRoom(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Lỗi khi xóa phòng chiếu",
      });
    });
  });

  describe("getRoomsByTheater", () => {
    it("should get all rooms for a theater successfully", async () => {
      const mockRooms = [
        { id: 1, room_name: "Room 1", room_type: "2D", name: "Theater 1" },
        { id: 2, room_name: "Room 2", room_type: "3D", name: "Theater 1" },
      ];

      mockPool.query.mockResolvedValue({ rows: mockRooms });

      const req = { params: { theaterId: "1" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await roomController.getRoomsByTheater(req, res);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT r.id, r.room_name"),
        ["1"]
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRooms);
    });

    it("should handle errors when getting rooms by theater", async () => {
      mockPool.query.mockRejectedValue(new Error("Database error"));

      const req = { params: { theaterId: "1" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await roomController.getRoomsByTheater(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Lỗi khi lấy danh sách phòng chiếu",
      });
    });
  });
});
