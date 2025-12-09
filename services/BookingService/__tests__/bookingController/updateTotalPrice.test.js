const updateTotalPrice = require("../../controllers/bookingController/updateTotalPrice");

describe("updateTotalPrice", () => {
  let mockPool;
  let handler;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // 1. Mock Pool
    mockPool = { query: jest.fn() };
    
    // 2. Init handler
    handler = updateTotalPrice({ pool: mockPool });

    // 3. Mock Req/Res
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
  // Condition: Valid Price + ID Exists -> Return 200 (Success)
  it("UTCID01: should return 200 and updated booking when input is valid", async () => {
    mockReq.params.id = "1";
    mockReq.body.total_price = 150000;

    const mockUpdatedBooking = { id: 1, total_price: 150000 };

    // Mock: Query returns updated row
    mockPool.query.mockResolvedValueOnce({ rows: [mockUpdatedBooking] });

    await handler(mockReq, mockRes);

    // Verify Execute: UPDATE query
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE booking SET total_price"),
      [150000, "1"]
    );

    // Verify Response: 200 (Implied by json call with success message)
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Total price updated",
      booking: mockUpdatedBooking,
    });
  });

  // Test Case: UTCID02
  // Condition: Invalid Price (undefined/NaN) -> Return 400
  it("UTCID02: should return 400 when total_price is invalid or missing", async () => {
    mockReq.params.id = "1";
    // Case A: Missing
    mockReq.body = {}; 

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Invalid or missing total_price" });

    // Case B: NaN
    jest.clearAllMocks();
    mockReq.body = { total_price: "not-a-number" };
    
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  // Test Case: UTCID03
  // Condition: Valid Price + ID Not Found -> Return 404
  it("UTCID03: should return 404 when booking id does not exist", async () => {
    mockReq.params.id = "999";
    mockReq.body.total_price = 150000;

    // Mock: Query returns empty rows
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Booking not found" });
  });

  // Test Case: UTCID04
  // Condition: Valid Price + DB Error -> Return 500
  it("UTCID04: should return 500 when database error occurs", async () => {
    mockReq.params.id = "1";
    mockReq.body.total_price = 150000;

    // Mock: DB Error
    const dbError = new Error("DB Update Failed");
    mockPool.query.mockRejectedValue(dbError);

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "DB Update Failed" });
  });
});