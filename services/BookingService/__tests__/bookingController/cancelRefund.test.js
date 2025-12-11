const cancelRefund = require("../../controllers/bookingController/cancelRefund");

describe("cancelRefund", () => {
  let mockPool;
  let mockGetIO;
  let handler;
  let mockReq;
  let mockRes;
  let mockClient;
  let mockIO;

  beforeEach(() => {
    // 1. Mock Client (for Transaction)
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    // 2. Mock Pool
    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
    };

    // 3. Mock Socket IO
    mockIO = { emit: jest.fn() };
    mockGetIO = jest.fn(() => mockIO);

    // 4. Init handler
    handler = cancelRefund({
      pool: mockPool,
      getIO: mockGetIO,
    });

    // 5. Mock Req/Res
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
  // Condition: Valid ID + Found (REFUND_REQUESTED) -> 200 + COMMIT + UPDATE + DELETE
  it("UTCID01: should return 200, COMMIT, UPDATE booking, and DELETE refund when request is valid", async () => {
    mockReq.params.id = "1";

    // Mock Client Query Sequence:
    // 1. BEGIN
    // 2. SELECT (Check existence) -> Returns Found
    // 3. UPDATE booking -> Success
    // 4. DELETE refund_booking -> Success
    // 5. COMMIT
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, status: 'REFUND_REQUESTED' }] }) // SELECT success
      .mockResolvedValueOnce({}) // UPDATE booking
      .mockResolvedValueOnce({}) // DELETE refund
      .mockResolvedValueOnce({}); // COMMIT

    await handler(mockReq, mockRes);

    // Verify DB Transaction
    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");

    // Verify UPDATE booking execute
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE booking SET status = 'PAID'"),
      ["1"]
    );

    // Verify DELETE refund execute
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM refund_booking WHERE booking_id"),
      ["1"]
    );

    // Verify Response
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Refund request canceled and booking status set to PAID",
    });
    // Status 200 is implied by json call, or not explicitly set in code (defaults to 200)
    // If your code explicitly calls status(200), add expectation here.
    // Based on provided code: res.json(...) is used.
  });

  // Test Case: UTCID02
  // Condition: Valid ID but Not Found/Wrong Status (Returns Empty) -> 404 + ROLLBACK
  it("UTCID02: should return 404 and ROLLBACK when refund request is not found", async () => {
    mockReq.params.id = "999";

    // Mock Client Query Sequence:
    // 1. BEGIN
    // 2. SELECT -> Returns Empty
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [] }); // SELECT returns empty

    await handler(mockReq, mockRes);

    // Verify ROLLBACK
    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");

    // Verify Response
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "No refund request to cancel",
    });
  });

  // Test Case: UTCID03
  // Condition: DB Error -> 500 + ROLLBACK + Execute Catch
  it("UTCID03: should return 500 and ROLLBACK when a database error occurs", async () => {
    mockReq.params.id = "1";

    // Mock Error during SELECT
    const dbError = new Error("DB Error");
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockRejectedValueOnce(dbError); // SELECT fails

    await handler(mockReq, mockRes);

    // Verify ROLLBACK
    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");

    // Verify Response
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "DB Error" });
  });
});