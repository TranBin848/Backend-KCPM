const createBookingController = require("../controllers/bookingController");

describe("BookingController", () => {
  let mockPool;
  let mockRedisClient;
  let mockGetIO;
  let controller;
  let mockReq;
  let mockRes;
  let mockClient;
  let consoleErrorSpy;

  beforeAll(() => {
    // Suppress console.error globally for all tests
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    // Setup mock pool
    mockPool = {
      query: jest.fn(),
      connect: jest.fn().mockResolvedValue(mockClient),
    };

    // Setup mock Redis client
    mockRedisClient = {
      get: jest.fn(),
      setEx: jest.fn(),
      del: jest.fn(),
    };

    // Setup mock Socket.IO
    mockGetIO = jest.fn(() => ({
      emit: jest.fn(),
    }));

    // Create controller with mocked dependencies
    controller = createBookingController({
      pool: mockPool,
      redisClient: mockRedisClient,
      getIO: mockGetIO,
    });

    // Setup mock request and response objects
    mockReq = {
      params: {},
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllBookings", () => {
    it("should return all bookings successfully", async () => {
      const mockBookings = [
        { id: 1, user_id: 1, total_price: 100 },
        { id: 2, user_id: 2, total_price: 200 },
      ];

      mockPool.query.mockResolvedValue({ rows: mockBookings });

      await controller.getAllBookings(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT * FROM booking ORDER BY id DESC"
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockBookings);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      mockPool.query.mockRejectedValue(error);

      await controller.getAllBookings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Database connection failed",
      });
    });
  });

  describe("getBookingById", () => {
    it("should return booking with seat_ids when found", async () => {
      mockReq.params.id = "1";
      const mockBooking = { id: 1, user_id: 1, total_price: 100 };
      const mockSeats = [{ seat_id: 101 }, { seat_id: 102 }];

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockBooking] })
        .mockResolvedValueOnce({ rows: mockSeats });

      await controller.getBookingById(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(mockRes.json).toHaveBeenCalledWith({
        ...mockBooking,
        seat_ids: [101, 102],
      });
    });

    it("should return 404 when booking not found", async () => {
      mockReq.params.id = "999";
      mockPool.query.mockResolvedValue({ rows: [] });

      await controller.getBookingById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Booking not found",
      });
    });
  });

  describe("createBooking", () => {
    it("should create booking successfully with valid data", async () => {
      mockReq.body = {
        user_id: 1,
        showtime_id: 10,
        room_id: 5,
        seat_ids: [101, 102],
        total_price: 200,
        movie_id: 7,
      };

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 123 }] }) // INSERT booking
        .mockResolvedValueOnce({}) // INSERT seat 1
        .mockResolvedValueOnce({}) // INSERT seat 2
        .mockResolvedValueOnce({}); // COMMIT

      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setEx.mockResolvedValue("OK");

      await controller.createBooking(mockReq, mockRes);

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
      expect(mockClient.release).toHaveBeenCalled();

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        "locked_seats:10",
        600,
        JSON.stringify([101, 102])
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Booking created",
        booking_id: 123,
      });
    });

    it("should merge with existing locked seats in Redis", async () => {
      mockReq.body = {
        user_id: 1,
        showtime_id: 10,
        room_id: 5,
        seat_ids: [103, 104],
        total_price: 200,
        movie_id: 7,
      };

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 124 }] }) // INSERT booking
        .mockResolvedValueOnce({}) // INSERT seat 1
        .mockResolvedValueOnce({}) // INSERT seat 2
        .mockResolvedValueOnce({}); // COMMIT

      // Existing seats in Redis
      mockRedisClient.get.mockResolvedValue(JSON.stringify([101, 102]));
      mockRedisClient.setEx.mockResolvedValue("OK");

      await controller.createBooking(mockReq, mockRes);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        "locked_seats:10",
        600,
        JSON.stringify([101, 102, 103, 104])
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should return 400 when required fields are missing", async () => {
      mockReq.body = {
        user_id: 1,
        showtime_id: 10,
        // missing other required fields
      };

      await controller.createBooking(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Missing or invalid required fields",
      });
      expect(mockPool.connect).not.toHaveBeenCalled();
    });

    it("should rollback transaction on error", async () => {
      mockReq.body = {
        user_id: 1,
        showtime_id: 10,
        room_id: 5,
        seat_ids: [101, 102],
        total_price: 200,
        movie_id: 7,
      };

      const dbError = new Error("Database error");
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN succeeds
        .mockRejectedValueOnce(dbError) // INSERT booking fails
        .mockResolvedValueOnce({}); // ROLLBACK succeeds

      await controller.createBooking(mockReq, mockRes);

      // Verify ROLLBACK was called
      const queryCalls = mockClient.query.mock.calls;
      expect(queryCalls.some((call) => call[0] === "BEGIN")).toBe(true);
      expect(queryCalls.some((call) => call[0] === "ROLLBACK")).toBe(true);

      expect(mockClient.release).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Database error",
      });
    });
  });

  describe("updateBookingStatus", () => {
    it("should update status to PAID successfully", async () => {
      mockReq.params.id = "1";
      mockReq.body = { status: "PAID" };

      const mockBooking = { id: 1, showtime_id: 10, status: "PAID" };
      const mockSeats = [{ seat_id: 101 }, { seat_id: 102 }];

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [mockBooking] }) // UPDATE status
        .mockResolvedValueOnce({ rows: mockSeats }) // SELECT seats
        .mockResolvedValueOnce({}); // COMMIT

      mockRedisClient.get.mockResolvedValue(
        JSON.stringify([101, 102, 103, 104])
      );
      mockRedisClient.del.mockResolvedValue(1);

      await controller.updateBookingStatus(mockReq, mockRes);

      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
      expect(mockRedisClient.del).toHaveBeenCalledWith("locked_seats:10");
      expect(mockRes.json).toHaveBeenCalledWith(mockBooking);
    });

    it("should return 400 for invalid status", async () => {
      mockReq.params.id = "1";
      mockReq.body = { status: "INVALID_STATUS" };

      await controller.updateBookingStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Invalid status value",
      });
      expect(mockPool.connect).not.toHaveBeenCalled();
    });

    it("should return 404 when booking not found", async () => {
      mockReq.params.id = "999";
      mockReq.body = { status: "PAID" };

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // UPDATE returns empty

      await controller.updateBookingStatus(mockReq, mockRes);

      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Booking not found",
      });
    });
  });

  describe("deleteBooking", () => {
    it("should delete booking and clear Redis cache", async () => {
      mockReq.params.id = "1";

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ showtime_id: 10 }] }) // SELECT showtime_id
        .mockResolvedValueOnce({}) // DELETE booking_seats
        .mockResolvedValueOnce({}) // DELETE booking
        .mockResolvedValueOnce({}); // COMMIT

      mockRedisClient.del.mockResolvedValue(1);

      await controller.deleteBooking(mockReq, mockRes);

      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
      expect(mockRedisClient.del).toHaveBeenCalledWith("locked_seats:10");
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Booking deleted",
      });
    });

    it("should return 404 when booking not found", async () => {
      mockReq.params.id = "999";

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // SELECT returns empty

      await controller.deleteBooking(mockReq, mockRes);

      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Booking not found",
      });
    });
  });

  describe("getLockedSeats", () => {
    it("should return locked seats from Redis cache when available", async () => {
      mockReq.params.showtimeId = "10";
      const cachedSeats = [101, 102, 103];

      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedSeats));

      await controller.getLockedSeats(mockReq, mockRes);

      expect(mockRedisClient.get).toHaveBeenCalledWith("locked_seats:10");
      expect(mockRes.json).toHaveBeenCalledWith({
        locked_seat_ids: cachedSeats,
      });
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it("should query database and cache result when Redis cache misses", async () => {
      mockReq.params.showtimeId = "10";
      const mockSeats = [{ seat_id: 101 }, { seat_id: 102 }];

      mockRedisClient.get.mockResolvedValue(null);
      mockPool.query.mockResolvedValue({ rows: mockSeats });
      mockRedisClient.setEx.mockResolvedValue("OK");

      await controller.getLockedSeats(mockReq, mockRes);

      expect(mockRedisClient.get).toHaveBeenCalledWith("locked_seats:10");
      expect(mockPool.query).toHaveBeenCalled();
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        "locked_seats:10",
        60,
        JSON.stringify([101, 102])
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        locked_seat_ids: [101, 102],
      });
    });
  });

  describe("requestRefund", () => {
    it("should create refund request with momo method", async () => {
      mockReq.params.id = "1";
      mockReq.body = {
        amount: 200,
        method: "momo",
        phone: "0123456789",
        momo_account_name: "Nguyen Van A",
      };

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // UPDATE booking
        .mockResolvedValueOnce({}) // INSERT refund_booking
        .mockResolvedValueOnce({}); // COMMIT

      const mockIO = { emit: jest.fn() };
      mockGetIO.mockReturnValue(mockIO);

      await controller.requestRefund(mockReq, mockRes);

      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
      expect(mockIO.emit).toHaveBeenCalledWith(
        "booking_refund_requested",
        expect.objectContaining({
          bookingId: "1",
          amount: 200,
          method: "momo",
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Refund request submitted successfully",
      });
    });

    it("should create refund request with bank method", async () => {
      mockReq.params.id = "2";
      mockReq.body = {
        amount: 300,
        method: "bank",
        bank_account_name: "Nguyen Van B",
        bank_name: "Vietcombank",
        bank_account_number: "123456789",
      };

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // UPDATE booking
        .mockResolvedValueOnce({}) // INSERT refund_booking
        .mockResolvedValueOnce({}); // COMMIT

      const mockIO = { emit: jest.fn() };
      mockGetIO.mockReturnValue(mockIO);

      await controller.requestRefund(mockReq, mockRes);

      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 when required momo fields are missing", async () => {
      mockReq.params.id = "1";
      mockReq.body = {
        amount: 200,
        method: "momo",
        // missing phone and momo_account_name
      };

      await controller.requestRefund(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Missing required refund information",
      });
      expect(mockPool.connect).not.toHaveBeenCalled();
    });

    it("should return 400 when required bank fields are missing", async () => {
      mockReq.params.id = "1";
      mockReq.body = {
        amount: 200,
        method: "bank",
        bank_account_name: "Test",
        // missing bank_name and bank_account_number
      };

      await controller.requestRefund(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Missing required refund information",
      });
    });

    it("should return 404 when booking not found", async () => {
      mockReq.params.id = "999";
      mockReq.body = {
        amount: 200,
        method: "momo",
        phone: "0123456789",
        momo_account_name: "Test",
      };

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // UPDATE returns empty

      await controller.requestRefund(mockReq, mockRes);

      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Booking not found",
      });
    });
  });

  describe("cancelRefund", () => {
    it("should cancel refund request successfully", async () => {
      mockReq.params.id = "1";

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [{ id: 1, status: "REFUND_REQUESTED" }],
        }) // SELECT
        .mockResolvedValueOnce({}) // UPDATE status
        .mockResolvedValueOnce({}) // DELETE refund_booking
        .mockResolvedValueOnce({}); // COMMIT

      const mockIO = { emit: jest.fn() };
      mockGetIO.mockReturnValue(mockIO);

      await controller.cancelRefund(mockReq, mockRes);

      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
      expect(mockIO.emit).toHaveBeenCalledWith("booking_refund_cancelled", {
        bookingId: "1",
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Refund request canceled and booking status set to PAID",
      });
    });

    it("should return 404 when no refund request to cancel", async () => {
      mockReq.params.id = "999";

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // SELECT returns empty

      await controller.cancelRefund(mockReq, mockRes);

      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "No refund request to cancel",
      });
    });
  });

  describe("getRefundBookings", () => {
    it("should return all refund bookings", async () => {
      const mockRefunds = [
        { id: 1, booking_id: 1, amount: 100 },
        { id: 2, booking_id: 2, amount: 200 },
      ];

      mockPool.query.mockResolvedValue({ rows: mockRefunds });

      await controller.getRefundBookings(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT * FROM refund_booking ORDER BY id DESC"
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockRefunds);
    });
  });

  describe("updateTotalPrice", () => {
    it("should update total price successfully", async () => {
      mockReq.params.id = "1";
      mockReq.body = { total_price: 250 };

      const updatedBooking = { id: 1, total_price: 250 };
      mockPool.query.mockResolvedValue({ rows: [updatedBooking] });

      await controller.updateTotalPrice(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Total price updated",
        booking: updatedBooking,
      });
    });

    it("should return 400 when total_price is invalid", async () => {
      mockReq.params.id = "1";
      mockReq.body = { total_price: "invalid" };

      await controller.updateTotalPrice(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Invalid or missing total_price",
      });
      expect(mockPool.query).not.toHaveBeenCalled();
    });
  });
});
