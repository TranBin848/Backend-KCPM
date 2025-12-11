const getRefundBookingById = require("../../controllers/bookingController/getRefundBookingById");

describe("getRefundBookingById", () => {
  let mockPool;
  let handler;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // 1. Mock Pool
    mockPool = { query: jest.fn() };
    
    // 2. Init handler
    handler = getRefundBookingById({ pool: mockPool });

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
  // Condition: ID Exists in DB -> Return Row -> Response 200
  it("UTCID01: should return 200 (implied) and refund record when id exists", async () => {
    mockReq.params.id = "1";
    const mockRecord = { 
      id: 1, 
      booking_id: 10, 
      amount: 100000, 
      method: "momo" 
    };

    // Mock: Query returns data
    mockPool.query.mockResolvedValueOnce({ rows: [mockRecord] });

    await handler(mockReq, mockRes);

    // Verify Execute: Select Query
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT * FROM refund_booking WHERE id"),
      ["1"]
    );

    // Verify Response: Code 200 (implied by json call with data)
    expect(mockRes.json).toHaveBeenCalledWith(mockRecord);
  });

  // Test Case: UTCID02
  // Condition: ID Not in DB -> Return Empty -> Response 404
  it("UTCID02: should return 404 when refund record does not exist", async () => {
    mockReq.params.id = "999";

    // Mock: Query returns empty array
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await handler(mockReq, mockRes);

    // Verify Response Code: 404
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Refund record not found",
    });
  });

  // Test Case: UTCID03
  // Condition: DB Query Error -> Response 500
  it("UTCID03: should return 500 when database error occurs", async () => {
    mockReq.params.id = "1";

    // Mock: DB Error
    const dbError = new Error("DB Connection Failed");
    mockPool.query.mockRejectedValue(dbError);

    await handler(mockReq, mockRes);

    // Verify Response Code: 500
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "DB Connection Failed",
    });
  });
});