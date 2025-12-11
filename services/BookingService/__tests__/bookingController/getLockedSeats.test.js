const getLockedSeats = require("../../controllers/bookingController/getLockedSeats");

describe("getLockedSeats", () => {
  let mockPool;
  let mockRedisClient;
  let handler;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // 1. Mock Dependencies
    mockPool = { query: jest.fn() };
    mockRedisClient = {
      get: jest.fn(),
      setEx: jest.fn(),
    };

    // 2. Init handler
    handler = getLockedSeats({
      pool: mockPool,
      redisClient: mockRedisClient,
    });

    // 3. Mock Req/Res
    mockReq = { params: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test Case: UTCID01
  // Condition: Cache Hit -> Return Data from Redis -> DB & SetEx NOT Called -> Response 200
  it("UTCID01: should return cached seats and NOT query DB when cache hit", async () => {
    mockReq.params.showtimeId = "10";
    const cachedSeats = [101, 102];

    // Mock Redis GET returns string
    mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedSeats));

    await handler(mockReq, mockRes);

    // Verify Redis Get
    expect(mockRedisClient.get).toHaveBeenCalledWith("locked_seats:10");

    // Verify DB Query NOT Called
    expect(mockPool.query).not.toHaveBeenCalled();

    // Verify Redis SetEx NOT Called
    expect(mockRedisClient.setEx).not.toHaveBeenCalled();

    // Verify Response
    expect(mockRes.json).toHaveBeenCalledWith({ locked_seat_ids: cachedSeats });
  });

  // Test Case: UTCID02
  // Condition: Cache Miss -> Query DB -> Set Cache -> Response 200
  it("UTCID02: should query DB and update cache when cache miss", async () => {
    mockReq.params.showtimeId = "10";
    const dbSeats = [{ seat_id: 201 }, { seat_id: 202 }];

    // Mock Redis GET returns null (Miss)
    mockRedisClient.get.mockResolvedValue(null);
    // Mock DB Query returns rows
    mockPool.query.mockResolvedValueOnce({ rows: dbSeats });

    await handler(mockReq, mockRes);

    // Verify Redis Get
    expect(mockRedisClient.get).toHaveBeenCalledWith("locked_seats:10");

    // Verify DB Query Called
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT bs.seat_id"),
      ["10"]
    );

    // Verify Redis SetEx Called
    expect(mockRedisClient.setEx).toHaveBeenCalledWith(
      "locked_seats:10",
      60,
      JSON.stringify([201, 202])
    );

    // Verify Response
    expect(mockRes.json).toHaveBeenCalledWith({ locked_seat_ids: [201, 202] });
  });

  // Test Case: UTCID03
  // Condition: Error (e.g., Redis Error) -> Response 500
  it("UTCID03: should return 500 when an error occurs", async () => {
    mockReq.params.showtimeId = "10";

    // Mock Redis Error (Trigger Catch)
    const error = new Error("Redis Connection Failed");
    mockRedisClient.get.mockRejectedValue(error);

    await handler(mockReq, mockRes);

    // Verify Response Code: 500
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Redis Connection Failed" });
  });
});