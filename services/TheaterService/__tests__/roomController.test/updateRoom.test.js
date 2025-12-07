const updateRoom = require("../../controllers/roomController/updateRoom");

describe("updateRoom", () => {
  let mockPool;
  let handler;
  let mockReq;
  let mockRes;
  let consoleErrorSpy;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    handler = updateRoom({ pool: mockPool });
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
  // Condition: Valid Data + Existing ID -> DB Found -> Update Success -> Return 200
  it("UTCID01: should return 200 and update room when data is valid and room exists", async () => {
    mockReq.params.roomId = "1";
    mockReq.body = { room_name: "New Name", room_type: "IMAX" };

    // Mock 1: SELECT returns row (Found)
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    // Mock 2: UPDATE success
    mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

    await handler(mockReq, mockRes);

    expect(mockPool.query).toHaveBeenCalledTimes(2);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Cập nhật phòng thành công",
    });
  });

  // Test Case: UTCID02
  // Condition: Missing Info -> Return 400
  it("UTCID02: should return 400 when required info is missing", async () => {
    mockReq.params.roomId = "1";
    // Missing room_type
    mockReq.body = { room_name: "New Name" }; 

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Thiếu room_name hoặc room_type",
    });
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  // Test Case: UTCID03
  // Condition: Valid Data + Non-Existing ID -> DB Empty -> Return 404
  it("UTCID03: should return 404 when room does not exist", async () => {
    mockReq.params.roomId = "999";
    mockReq.body = { room_name: "New Name", room_type: "IMAX" };

    // Mock 1: SELECT returns empty (Not Found)
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Phòng không tồn tại",
    });
    // Ensure UPDATE is NOT executed
    expect(mockPool.query).toHaveBeenCalledTimes(1);
  });

  // Test Case: UTCID04
  // Condition: DB Throws Error -> Return 500
  it("UTCID04: should return 500 when database error occurs", async () => {
    mockReq.params.roomId = "1";
    mockReq.body = { room_name: "New Name", room_type: "IMAX" };

    // Mock: Query throws error
    mockPool.query.mockRejectedValue(new Error("DB Error"));

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Lỗi khi cập nhật phòng chiếu",
    });
  });
});