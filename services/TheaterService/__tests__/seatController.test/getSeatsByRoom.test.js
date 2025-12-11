const getSeatsByRoom = require("../../controllers/seatController/getSeatsByRoom");

describe("getSeatsByRoom", () => {
  let mockPool;
  let handler;
  let mockReq;
  let mockRes;
  let consoleErrorSpy;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    handler = getSeatsByRoom({ pool: mockPool });
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
  // Condition: Valid Room ID -> DB Returns Rows (or Empty) -> Return 200
  it("UTCID01: should return 200 and list of seats when successful", async () => {
    mockReq.params.room_id = "5";
    const mockSeats = [
      { id: 1, seat_number: "A1" },
      { id: 2, seat_number: "A2" },
    ];

    // Mock: Returns rows
    mockPool.query.mockResolvedValueOnce({ rows: mockSeats });

    await handler(mockReq, mockRes);

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT * FROM seats WHERE room_id"),
      ["5"]
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ seats: mockSeats });
  });

  // Test Case: UTCID02
  // Condition: DB Error -> Return 500
  it("UTCID02: should return 500 when database error occurs", async () => {
    mockReq.params.room_id = "5";

    // Mock: Error
    mockPool.query.mockRejectedValue(new Error("DB Error"));

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Không thể lấy danh sách ghế",
    });
  });
});