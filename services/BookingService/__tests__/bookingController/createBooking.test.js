const createBooking = require("../../controllers/bookingController/createBooking");

describe("createBooking", () => {
  let mockPool;
  let mockRedisClient;
  let mockClient;
  let handler;
  let mockReq;
  let mockRes;

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
      query: jest.fn(),
    };

    mockRedisClient = {
      get: jest.fn(),
      setEx: jest.fn(),
      del: jest.fn(),
    };

    handler = createBooking({ pool: mockPool, redisClient: mockRedisClient });

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
    it("should create booking with multiple seats successfully", async () => {
      mockReq.body = {
        user_id: 1,
        showtime_id: 10,
        room_id: 5,
        movie_id: 20,
        seat_ids: [101, 102, 103],
        total_price: 150000,
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT booking
        .mockResolvedValueOnce(undefined) // INSERT seat 1
        .mockResolvedValueOnce(undefined) // INSERT seat 2
        .mockResolvedValueOnce(undefined) // INSERT seat 3
        .mockResolvedValueOnce(undefined); // COMMIT

      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setEx.mockResolvedValue("OK");

      await handler(mockReq, mockRes);

      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO booking"),
        [1, 10, 5, 20, 150000]
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        "INSERT INTO booking_seats (booking_id, seat_id) VALUES ($1, $2)",
        [1, 101]
      );
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        "locked_seats:10",
        600,
        JSON.stringify([101, 102, 103])
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Booking created",
        booking_id: 1,
      });
    });

    it("should create booking with single seat", async () => {
      mockReq.body = {
        user_id: 2,
        showtime_id: 15,
        room_id: 3,
        movie_id: 25,
        seat_ids: [50],
        total_price: 80000,
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // INSERT booking
        .mockResolvedValueOnce(undefined) // INSERT seat
        .mockResolvedValueOnce(undefined); // COMMIT

      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setEx.mockResolvedValue("OK");

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Booking created",
        booking_id: 2,
      });
    });

    it("should merge with existing locked seats in Redis", async () => {
      mockReq.body = {
        user_id: 3,
        showtime_id: 20,
        room_id: 6,
        movie_id: 30,
        seat_ids: [105, 106],
        total_price: 120000,
      };

      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ id: 3 }] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      mockRedisClient.get.mockResolvedValue(JSON.stringify([101, 102]));
      mockRedisClient.setEx.mockResolvedValue("OK");

      await handler(mockReq, mockRes);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        "locked_seats:20",
        600,
        JSON.stringify([101, 102, 105, 106])
      );
    });

    it("should avoid duplicate seats in Redis cache", async () => {
      mockReq.body = {
        user_id: 4,
        showtime_id: 25,
        room_id: 7,
        movie_id: 35,
        seat_ids: [101, 102],
        total_price: 100000,
      };

      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ id: 4 }] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      mockRedisClient.get.mockResolvedValue(JSON.stringify([101, 103]));
      mockRedisClient.setEx.mockResolvedValue("OK");

      await handler(mockReq, mockRes);

      const setExCall = mockRedisClient.setEx.mock.calls[0];
      const cachedSeats = JSON.parse(setExCall[2]);
      expect(cachedSeats).toEqual(expect.arrayContaining([101, 102, 103]));
      expect(cachedSeats.length).toBe(3); // No duplicates
    });
  });

  describe("Validation cases", () => {
    it("should return 400 when user_id is missing", async () => {
      mockReq.body = {
        showtime_id: 10,
        room_id: 5,
        movie_id: 20,
        seat_ids: [101],
        total_price: 100000,
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Missing or invalid required fields",
      });
    });

    it("should return 400 when showtime_id is missing", async () => {
      mockReq.body = {
        user_id: 1,
        room_id: 5,
        movie_id: 20,
        seat_ids: [101],
        total_price: 100000,
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when room_id is missing", async () => {
      mockReq.body = {
        user_id: 1,
        showtime_id: 10,
        movie_id: 20,
        seat_ids: [101],
        total_price: 100000,
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when movie_id is missing", async () => {
      mockReq.body = {
        user_id: 1,
        showtime_id: 10,
        room_id: 5,
        seat_ids: [101],
        total_price: 100000,
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when seat_ids is missing", async () => {
      mockReq.body = {
        user_id: 1,
        showtime_id: 10,
        room_id: 5,
        movie_id: 20,
        total_price: 100000,
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when seat_ids is not an array", async () => {
      mockReq.body = {
        user_id: 1,
        showtime_id: 10,
        room_id: 5,
        movie_id: 20,
        seat_ids: "101",
        total_price: 100000,
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when seat_ids is empty array", async () => {
      mockReq.body = {
        user_id: 1,
        showtime_id: 10,
        room_id: 5,
        movie_id: 20,
        seat_ids: [],
        total_price: 100000,
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when total_price is missing", async () => {
      mockReq.body = {
        user_id: 1,
        showtime_id: 10,
        room_id: 5,
        movie_id: 20,
        seat_ids: [101],
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Transaction rollback cases", () => {
    it("should rollback on booking insertion error", async () => {
      mockReq.body = {
        user_id: 1,
        showtime_id: 10,
        room_id: 5,
        movie_id: 20,
        seat_ids: [101],
        total_price: 100000,
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockRejectedValueOnce(new Error("Booking insertion failed")); // INSERT booking

      await handler(mockReq, mockRes);

      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
      expect(mockClient.release).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Booking insertion failed",
      });
    });

    it("should rollback on seat insertion error", async () => {
      mockReq.body = {
        user_id: 1,
        showtime_id: 10,
        room_id: 5,
        movie_id: 20,
        seat_ids: [101, 102],
        total_price: 100000,
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT booking
        .mockResolvedValueOnce(undefined) // INSERT seat 1
        .mockRejectedValueOnce(new Error("Seat insertion failed")); // INSERT seat 2

      await handler(mockReq, mockRes);

      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
      expect(mockClient.release).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it("should release client even on error", async () => {
      mockReq.body = {
        user_id: 1,
        showtime_id: 10,
        room_id: 5,
        movie_id: 20,
        seat_ids: [101],
        total_price: 100000,
      };

      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("Error"));

      await handler(mockReq, mockRes);

      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe("Redis error handling", () => {
    it("should continue even if Redis get fails", async () => {
      mockReq.body = {
        user_id: 1,
        showtime_id: 10,
        room_id: 5,
        movie_id: 20,
        seat_ids: [101],
        total_price: 100000,
      };

      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      mockRedisClient.get.mockRejectedValue(new Error("Redis get failed"));
      mockRedisClient.setEx.mockResolvedValue("OK");

      await handler(mockReq, mockRes);

      // Should still return success since database transaction succeeded
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Booking created",
        booking_id: 1,
      });
    });

    it("should continue even if Redis setEx fails", async () => {
      mockReq.body = {
        user_id: 1,
        showtime_id: 10,
        room_id: 5,
        movie_id: 20,
        seat_ids: [101],
        total_price: 100000,
      };

      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setEx.mockRejectedValue(new Error("Redis setEx failed"));

      await handler(mockReq, mockRes);

      // Should still return success since database transaction succeeded
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe("Edge cases", () => {
    it("should handle very large seat_ids array", async () => {
      const largeSeatArray = Array.from({ length: 50 }, (_, i) => i + 1);

      mockReq.body = {
        user_id: 1,
        showtime_id: 10,
        room_id: 5,
        movie_id: 20,
        seat_ids: largeSeatArray,
        total_price: 500000,
      };

      mockClient.query.mockImplementation((query) => {
        if (query === "BEGIN") return Promise.resolve(undefined);
        if (query === "COMMIT") return Promise.resolve(undefined);
        if (query.includes("INSERT INTO booking"))
          return Promise.resolve({ rows: [{ id: 1 }] });
        return Promise.resolve(undefined);
      });

      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setEx.mockResolvedValue("OK");

      await handler(mockReq, mockRes);

      // Should insert all 50 seats
      const seatInsertCalls = mockClient.query.mock.calls.filter((call) =>
        call[0].includes("booking_seats")
      );
      expect(seatInsertCalls.length).toBe(50);
    });

    it("should handle total_price of 0", async () => {
      mockReq.body = {
        user_id: 1,
        showtime_id: 10,
        room_id: 5,
        movie_id: 20,
        seat_ids: [101],
        total_price: 0,
      };

      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setEx.mockResolvedValue("OK");

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle very large total_price", async () => {
      mockReq.body = {
        user_id: 1,
        showtime_id: 10,
        room_id: 5,
        movie_id: 20,
        seat_ids: [101],
        total_price: 99999999,
      };

      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setEx.mockResolvedValue("OK");

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });
});
