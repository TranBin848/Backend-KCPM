const requestRefund = require("../../controllers/bookingController/requestRefund");

describe("requestRefund", () => {
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
    handler = requestRefund({
      pool: mockPool,
      getIO: mockGetIO,
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
  // Condition: Valid Momo + Found -> 200 + COMMIT + Insert Momo Fields
  it("UTCID01: should return 200, COMMIT and insert Momo fields when valid", async () => {
    mockReq.params.id = "1";
    mockReq.body = {
      amount: 100000,
      method: "momo",
      phone: "0901234567",
      momo_account_name: "User A"
    };

    // Mock Client Query Sequence:
    // 1. BEGIN
    // 2. UPDATE booking -> Returns Found
    // 3. INSERT refund_booking -> Success
    // 4. COMMIT
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // UPDATE success
      .mockResolvedValueOnce({}) // INSERT success
      .mockResolvedValueOnce({}); // COMMIT

    await handler(mockReq, mockRes);

    // Verify DB Transaction
    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");

    // Verify Insert Query arguments for Momo (phone, momo_account_name present)
    // 4th arg is phone, 5th is momo_name. Bank fields (6,7,8) should be null.
    // Query call index 2 is the INSERT
    expect(mockClient.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("INSERT INTO refund_booking"),
      ["1", 100000, "momo", "0901234567", "User A", null, null, null]
    );

    // Verify Response
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Refund request submitted successfully" });
  });

  // Test Case: UTCID02
  // Condition: Valid Bank + Found -> 200 + COMMIT + Insert Bank Fields
  it("UTCID02: should return 200, COMMIT and insert Bank fields when valid", async () => {
    mockReq.params.id = "1";
    mockReq.body = {
      amount: 200000,
      method: "bank",
      bank_account_name: "User B",
      bank_name: "VCB",
      bank_account_number: "123456"
    };

    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // UPDATE success
      .mockResolvedValueOnce({}) // INSERT success
      .mockResolvedValueOnce({}); // COMMIT

    await handler(mockReq, mockRes);

    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");

    // Verify Insert Query arguments for Bank
    // Momo fields (4,5) null. Bank fields (6,7,8) present.
    expect(mockClient.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("INSERT INTO refund_booking"),
      ["1", 200000, "bank", null, null, "User B", "VCB", "123456"]
    );

    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  // Test Case: UTCID03
  // Condition: Missing/Invalid Data -> 400 (No DB Transaction started yet if check is before connect, but logic here checks connect later? No, logic checks params first)
  it("UTCID03: should return 400 when required fields are missing", async () => {
    mockReq.params.id = "1";
    // Case: Missing specific fields for method
    mockReq.body = {
      amount: 100000,
      method: "momo"
      // Missing phone/momo_account_name
    };

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Missing required refund information" });
    
    // Ensure DB connect is NOT called (validation is before connect)
    expect(mockPool.connect).not.toHaveBeenCalled();
  });

  // Test Case: UTCID04
  // Condition: Update Returns Empty (Not Found) -> 404 + ROLLBACK
  it("UTCID04: should return 404 and ROLLBACK when booking is not found during update", async () => {
    mockReq.params.id = "999";
    mockReq.body = {
      amount: 100000,
      method: "momo",
      phone: "090",
      momo_account_name: "A"
    };

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
  // Condition: DB Error -> 500 + ROLLBACK + Execute Catch
  it("UTCID05: should return 500 and ROLLBACK when a database error occurs", async () => {
    mockReq.params.id = "1";
    mockReq.body = {
      amount: 100000,
      method: "momo",
      phone: "090",
      momo_account_name: "A"
    };

    // Mock Error during UPDATE
    const dbError = new Error("DB Error");
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockRejectedValueOnce(dbError); // UPDATE fails

    await handler(mockReq, mockRes);

    // Verify ROLLBACK
    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Failed to submit refund request" });
  });
});