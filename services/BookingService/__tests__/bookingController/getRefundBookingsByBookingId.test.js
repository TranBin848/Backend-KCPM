const getRefundBookingsByBookingId = require("../../controllers/bookingController/getRefundBookingsByBookingId");

describe("getRefundBookingsByBookingId", () => {
  let mockPool;
  let handler;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // 1. Mock Pool
    mockPool = { query: jest.fn() };
    
    // 2. Init handler
    handler = getRefundBookingsByBookingId({ pool: mockPool });

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
  // Condition: bookingId Exists in DB (D2 = False) -> Return Rows -> Response 200
  it("UTCID01: should return 200 (implied) and refund records when booking_id exists", async () => {
    mockReq.params.bookingId = "100";
    const mockRecords = [
      { id: 1, booking_id: 100, amount: 50000, method: "momo" },
      { id: 2, booking_id: 100, amount: 20000, method: "bank" }
    ];

    // Mock: Query returns rows (length > 0)
    mockPool.query.mockResolvedValueOnce({ rows: mockRecords });

    await handler(mockReq, mockRes);

    // Verify Execute: Select Query
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT * FROM refund_booking WHERE booking_id"),
      ["100"]
    );

    // Verify Response: Code 200 (Confirmed via data return)
    expect(mockRes.json).toHaveBeenCalledWith(mockRecords);
  });

  // Test Case: UTCID02
  // Condition: bookingId Not in DB (D2 = True) -> Return Empty -> Response 404
  it("UTCID02: should return 404 when no refund records found for booking_id", async () => {
    mockReq.params.bookingId = "999";

    // Mock: Query returns empty array
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await handler(mockReq, mockRes);

    // Verify Response Code: 404
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Refund record not found for this booking",
    });
  });

  // Test Case: UTCID03
  // Condition: DB Query Error (D1 = True) -> Response 500
  it("UTCID03: should return 500 when database error occurs", async () => {
    mockReq.params.bookingId = "100";

    // Mock: DB Error
    const dbError = new Error("DB Connection Error");
    mockPool.query.mockRejectedValue(dbError);

    await handler(mockReq, mockRes);

    // Verify Response Code: 500
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "DB Connection Error",
    });
  });
});