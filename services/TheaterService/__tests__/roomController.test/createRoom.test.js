const createRoom = require("../../controllers/roomController/createRoom");

describe("createRoom", () => {
  let mockPool;
  let handler;
  let mockReq;
  let mockRes;
  let consoleErrorSpy;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    handler = createRoom({ pool: mockPool });
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

  // UTCID01: Valid Data + No Conflict -> Insert Success -> Return 201
  it("UTCID01: should return 201 and create room when data is valid and no conflict", async () => {
    mockReq.body = {
      room_name: "Room A",
      theater_id: 1,
      room_type: "2D",
    };

    // Mock 1: SELECT returns empty (No Conflict)
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    // Mock 2: INSERT success (Returning ID)
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 10 }] });

    await handler(mockReq, mockRes);

    // Verify Execute: INSERT (Dù ảnh ghi UPDATE do lỗi typo, bản chất logic là INSERT)
    expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO rooms"),
        expect.arrayContaining(["Room A", "2D"])
    );
    expect(mockRes.status).toHaveBeenCalledWith(201); 
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Tạo phòng chiếu thành công",
      roomId: 10,
    });
  });

  // UTCID02: Missing Info -> Return 400
  it("UTCID02: should return 400 when required info is missing", async () => {
    mockReq.body = { room_name: "Room A" }; // Missing theater_id, room_type

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Thiếu room_name, theater_id hoặc room_type",
    });
  });

  // UTCID03: Conflict (Duplicate Name) -> Return 409
  it("UTCID03: should return 409 when room name exists in theater", async () => {
    mockReq.body = {
      room_name: "Room A",
      theater_id: 1,
      room_type: "2D",
    };

    // Mock 1: SELECT returns rows (Conflict found)
    mockPool.query.mockResolvedValueOnce({ rows: [{ 1: 1 }] });

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(409);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Tên phòng đã tồn tại trong rạp này",
    });
  });

  // UTCID04: DB Error -> Exec console.error -> Return 500
  it("UTCID04: should return 500 when database error occurs", async () => {
    mockReq.body = {
      room_name: "Room A",
      theater_id: 1,
      room_type: "2D",
    };

    mockPool.query.mockRejectedValue(new Error("DB Error"));

    await handler(mockReq, mockRes);

    // Verify Execute: catch(error)
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});