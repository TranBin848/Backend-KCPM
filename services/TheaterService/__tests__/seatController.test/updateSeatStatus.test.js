const updateSeatStatus = require("../../controllers/seatController/updateSeatStatus");

describe("updateSeatStatus", () => {
  let mockPool;
  let handler;
  let mockReq;
  let mockRes;
  let consoleErrorSpy;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    handler = updateSeatStatus({ pool: mockPool });
    mockReq = { params: {}, body: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  // Test Case: UTCID01
  // Condition: Valid Status (active/inactive) + Found Seat -> Update Success -> Return 200
  it("UTCID01: should return 200 and update status when valid", async () => {
    mockReq.params.id = "1";
    mockReq.body.status = "inactive";

    // Mock 1: SELECT Check Found
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    // Mock 2: UPDATE Success
    mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

    await handler(mockReq, mockRes);

    expect(mockPool.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("UPDATE seats SET status"),
      ["inactive", "1"]
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Đã cập nhật trạng thái ghế thành 'inactive'",
    });
  });

  // Test Case: UTCID02
  // Condition: Invalid Status -> Return 400
  it("UTCID02: should return 400 when status is invalid", async () => {
    mockReq.params.id = "1";
    mockReq.body.status = "broken"; // Invalid

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Trạng thái ghế không hợp lệ. Chỉ chấp nhận 'active' hoặc 'inactive'",
    });
    // Ensure DB is not called
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  // Test Case: UTCID03
  // Condition: Valid Status + Seat Not Found -> Return 404
  it("UTCID03: should return 404 when seat not found", async () => {
    mockReq.params.id = "999";
    mockReq.body.status = "active";

    // Mock: SELECT returns empty
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Không tìm thấy ghế",
    });
    // Ensure UPDATE is not called
    expect(mockPool.query).toHaveBeenCalledTimes(1);
  });

  // Test Case: UTCID04
  // Condition: DB Error -> Return 500
  it("UTCID04: should return 500 when database error occurs", async () => {
    mockReq.params.id = "1";
    mockReq.body.status = "active";

    // Mock: Error during SELECT
    mockPool.query.mockRejectedValue(new Error("DB Error"));

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Lỗi khi cập nhật trạng thái ghế",
    });
  });
});