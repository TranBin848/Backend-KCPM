const getRoomsByTheater = require("../../controllers/roomController/getRoomsByTheater");

describe("getRoomsByTheater", () => {
  let mockPool;
  let handler;
  let mockReq;
  let mockRes;
  let consoleErrorSpy;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    handler = getRoomsByTheater({ pool: mockPool });
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
  // Condition: Valid ID -> DB Returns Rows (or Empty) -> Return 200
  it("UTCID01: should return 200 and list of rooms when valid theaterId provided", async () => {
    mockReq.params.theaterId = "1";
    const mockData = [
      { id: 1, room_name: "A", room_type: "2D", name: "Theater 1" },
    ];

    // Mock: SELECT returns rows
    mockPool.query.mockResolvedValueOnce({ rows: mockData });

    await handler(mockReq, mockRes);

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT r.id, r.room_name"),
      ["1"]
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockData);
  });

  // Test Case: UTCID02
  // Condition: Any ID + DB Throws Error -> Return 500
  it("UTCID02: should return 500 when database error occurs", async () => {
    mockReq.params.theaterId = "1";

    // Mock: Query throws error
    mockPool.query.mockRejectedValue(new Error("DB Error"));

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Lỗi khi lấy danh sách phòng chiếu",
    });
  });
});