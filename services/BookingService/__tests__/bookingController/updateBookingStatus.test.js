const updateBookingStatus = require("../../controllers/bookingController/updateBookingStatus");

describe("updateBookingStatus", () => {
  let mockPool;
  let mockRedisClient;
  let handler;
  let mockReq;
  let mockRes;
  let mockClient;

  beforeEach(() => {
    // 1. Mock Client (cho Transaction)
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    // 2. Mock Pool
    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
    };

    // 3. Mock Redis
    mockRedisClient = {
      get: jest.fn(),
      del: jest.fn(),
    };

    // 4. Init handler
    handler = updateBookingStatus({
      pool: mockPool,
      redisClient: mockRedisClient,
    });

    // 5. Mock Req/Res
    mockReq = { params: {}, body: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test Case: UTCID01
  // Condition: Valid Status (PAID) + Exists + Cache Exists -> 200 + COMMIT + Cache Deleted
  it("UTCID01: should return 200, COMMIT and delete cache when status is PAID and cache exists", async () => {
    mockReq.params.id = "1";
    mockReq.body.status = "PAID";
    const mockBooking = { id: 1, showtime_id: 10, status: "PAID" };

    // Mock Client Query Sequence:
    // 1. BEGIN
    // 2. UPDATE booking -> Returns row
    // 3. SELECT booking_seats -> Returns seats
    // 4. COMMIT
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [mockBooking] }) // UPDATE
      .mockResolvedValueOnce({ rows: [{ seat_id: 101 }] }) // SELECT seats
      .mockResolvedValueOnce({}); // COMMIT

    // Mock Redis: Cache exists
    mockRedisClient.get.mockResolvedValue(JSON.stringify([101, 102]));
    mockRedisClient.del.mockResolvedValue(1);

    await handler(mockReq, mockRes);

    // Verify DB Transaction
    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");

    // Verify Redis Cache Deleted
    expect(mockRedisClient.del).toHaveBeenCalledWith("locked_seats:10");

    // Verify Response
    expect(mockRes.json).toHaveBeenCalledWith(mockBooking);
  });

  // Test Case: UTCID02
  // Condition: Valid Status (PENDING) -> 200 + COMMIT (Cache ignored)
  it("UTCID02: should return 200 and COMMIT when status is PENDING (Cache skipped)", async () => {
    mockReq.params.id = "1";
    mockReq.body.status = "PENDING"; // Not PAID/CANCELLED
    const mockBooking = { id: 1, showtime_id: 10, status: "PENDING" };

    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [mockBooking] }) // UPDATE
      .mockResolvedValueOnce({}); // COMMIT

    await handler(mockReq, mockRes);

    // Verify DB Transaction
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");

    // Verify Redis NOT touched
    expect(mockRedisClient.get).not.toHaveBeenCalled();
    expect(mockRedisClient.del).not.toHaveBeenCalled();

    expect(mockRes.json).toHaveBeenCalledWith(mockBooking);
  });

  // Test Case: UTCID03
  // Condition: Invalid Status -> 400
  it("UTCID03: should return 400 when status is invalid", async () => {
    mockReq.params.id = "1";
    mockReq.body.status = "INVALID_STATUS";

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Invalid status value" });
    // Ensure no DB connection
    expect(mockPool.connect).not.toHaveBeenCalled();
  });

  // Test Case: UTCID04
  // Condition: Valid Status + ID Not Found -> 404 + ROLLBACK
  it("UTCID04: should return 404 and ROLLBACK when booking not found", async () => {
    mockReq.params.id = "999";
    mockReq.body.status = "PAID";

    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [] }); // UPDATE returns empty

    await handler(mockReq, mockRes);

    // Verify ROLLBACK
    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Booking not found" });
  });

  // Test Case: UTCID05
  // Condition: Valid Status (PAID) + Cache Not Exists -> 200 + COMMIT (No Delete)
  it("UTCID05: should return 200 and COMMIT but NOT delete cache if cache missing", async () => {
    mockReq.params.id = "1";
    mockReq.body.status = "PAID";
    const mockBooking = { id: 1, showtime_id: 10 };

    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [mockBooking] }) // UPDATE
      .mockResolvedValueOnce({ rows: [] }) // SELECT seats
      .mockResolvedValueOnce({}); // COMMIT

    // Mock Redis: Cache MISS
    mockRedisClient.get.mockResolvedValue(null);

    await handler(mockReq, mockRes);

    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    // Verify get called but del NOT called
    expect(mockRedisClient.get).toHaveBeenCalled();
    expect(mockRedisClient.del).not.toHaveBeenCalled();

    expect(mockRes.json).toHaveBeenCalledWith(mockBooking);
  });

  // Test Case: UTCID06
  // Condition: DB Error -> 500 + ROLLBACK
  it("UTCID06: should return 500 and ROLLBACK when exception occurs", async () => {
    mockReq.params.id = "1";
    mockReq.body.status = "PAID";

    // Mock Error during UPDATE
    const dbError = new Error("DB Error");
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockRejectedValueOnce(dbError); // UPDATE fails

    await handler(mockReq, mockRes);

    // Verify ROLLBACK
    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "DB Error" });
  });
});