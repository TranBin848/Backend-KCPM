const getSeatById = require("../../controllers/seatController/getSeatById");

describe("getSeatById", () => {
  let mockPool;
  let handler;
  let mockReq;
  let mockRes;
  let consoleErrorSpy;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    handler = getSeatById({ pool: mockPool });
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
  // Condition: Valid Existing ID -> Return Rows -> Return 200
  it("UTCID01: should return 200 and seat details when found", async () => {
    mockReq.params.id = "10";
    const mockSeat = { id: 10, seat_number: "A1", type: "regular" };

    // Mock: Found seat
    mockPool.query.mockResolvedValueOnce({ rows: [mockSeat] });

    await handler(mockReq, mockRes);

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT * FROM seats WHERE id"),
      ["10"]
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockSeat);
  });

  // Test Case: UTCID02
  // Condition: Valid Non-Existing ID -> Return Empty -> Return 404
  it("UTCID02: should return 404 when seat not found", async () => {
    mockReq.params.id = "999";

    // Mock: Empty rows
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Không tìm thấy ghế",
    });
  });

  // Test Case: UTCID03
  // Condition: DB Error -> Return 500
  it("UTCID03: should return 500 when database error occurs", async () => {
    mockReq.params.id = "10";

    // Mock: Error
    mockPool.query.mockRejectedValue(new Error("DB Error"));

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Không thể lấy thông tin ghế",
    });
  });
});