const generateSeats = require("../../controllers/seatController/generateSeats");

describe("generateSeats", () => {
  let mockPool;
  let handler;
  let mockReq;
  let mockRes;
  let consoleErrorSpy;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    handler = generateSeats({ pool: mockPool });
    mockReq = { body: {} };
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

  // UTCID01: Valid Data -> Delete Old -> Loop Insert -> Return 201
  it("UTCID01: should return 201 and generate seats when inputs are valid", async () => {
    mockReq.body = {
      room_id: 1,
      rows: 2,
      columns: 2,
    };

    // Mock 1: DELETE success
    mockPool.query.mockResolvedValueOnce({ rowCount: 5 }); 
    // Mock 2-5: INSERT success (Loop runs 4 times for 2x2 matrix)
    mockPool.query.mockResolvedValue({ rowCount: 1 });

    await handler(mockReq, mockRes);

    // Verify Execute: DELETE FROM seats (Called FIRST)
    expect(mockPool.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("DELETE FROM seats"),
      [1]
    );

    // Verify Execute: Loop & INSERT (Total calls = 1 delete + 4 inserts = 5)
    expect(mockPool.query).toHaveBeenCalledTimes(5);
    
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Tạo ghế thành công cho phòng",
      room_id: 1,
    });
  });

  // UTCID02: Invalid Data -> Return 400
  it("UTCID02: should return 400 when input is invalid", async () => {
    mockReq.body = {
      room_id: 1,
      rows: 0, 
      columns: 5
    };

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  // UTCID03: DB Error -> Exec catch -> Return 500
  it("UTCID03: should return 500 when database error occurs", async () => {
    mockReq.body = {
      room_id: 1,
      rows: 2,
      columns: 2,
    };

    mockPool.query.mockRejectedValue(new Error("DB Connection Failed"));

    await handler(mockReq, mockRes);

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});