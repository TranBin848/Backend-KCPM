const deleteRoom = require("../../controllers/roomController/deleteRoom");

describe("deleteRoom", () => {
  let mockPool;
  let handler;
  let mockReq;
  let mockRes;
  let consoleErrorSpy;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    handler = deleteRoom({ pool: mockPool });
    mockReq = { params: {} };
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
  // Condition: Valid Existing ID -> DB Found -> Execute DELETE -> Return 200
  it("UTCID01: should return 200 and delete room when room exists", async () => {
    mockReq.params.roomId = "1";

    // Mock 1: SELECT returns row (Found)
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    // Mock 2: DELETE executes successfully
    mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

    await handler(mockReq, mockRes);

    // Verify Select Logic
    expect(mockPool.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("SELECT * FROM rooms"),
      ["1"]
    );
    // Verify Delete Logic
    expect(mockPool.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("DELETE FROM rooms"),
      ["1"]
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Xóa phòng chiếu thành công",
    });
  });

  // Test Case: UTCID02
  // Condition: Valid Non-Existing ID -> DB Empty -> Return 404
  it("UTCID02: should return 404 when room does not exist", async () => {
    mockReq.params.roomId = "999";

    // Mock 1: SELECT returns empty (Not Found)
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Phòng không tồn tại",
    });
    // Ensure DELETE is NOT called
    expect(mockPool.query).toHaveBeenCalledTimes(1);
  });

  // Test Case: UTCID03
  // Condition: DB Throws Error -> Return 500
  it("UTCID03: should return 500 when database error occurs", async () => {
    mockReq.params.roomId = "1";

    // Mock: Query throws error
    mockPool.query.mockRejectedValue(new Error("DB Error"));

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Lỗi khi xóa phòng chiếu",
    });
  });
});