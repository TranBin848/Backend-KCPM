const createTheater = require("../../controllers/theaterController/createTheater");
const fs = require("fs");

// Mock fs module
jest.mock("fs");

describe("createTheater", () => {
  let mockPool;
  let handler;
  let mockReq;
  let mockRes;
  let consoleErrorSpy;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    handler = createTheater({ pool: mockPool });
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    
    // Default fs.unlink mock success
    fs.unlink.mockImplementation((path, callback) => callback(null));
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  // UTCID01: Valid JSON + Files -> Insert Theater & Gallery -> Return 201
  it("UTCID01: should return 201 and create theater with gallery when files exist", async () => {
    mockReq = {
      body: { data: JSON.stringify({ name: "Theater A" }) },
      files: [{ filename: "img1.jpg", path: "uploads/img1.jpg" }],
    };

    // Mock 1: Insert Theater Success
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1, name: "Theater A" }] });
    // Mock 2: Insert Gallery Success
    mockPool.query.mockResolvedValue({ rowCount: 1 });

    await handler(mockReq, mockRes);

    // Verify Execute: Insert Gallery
    expect(mockPool.query).toHaveBeenCalledTimes(2);
    expect(mockRes.status).toHaveBeenCalledWith(201);
  });

  // UTCID02: Valid JSON + No Files -> Insert Theater Only -> Return 201
  it("UTCID02: should return 201 and create theater without gallery", async () => {
    mockReq = {
      body: { data: JSON.stringify({ name: "Theater B" }) },
      files: [], 
    };

    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 2 }] });

    await handler(mockReq, mockRes);

    expect(mockPool.query).toHaveBeenCalledTimes(1); 
    expect(mockRes.status).toHaveBeenCalledWith(201);
  });

  // UTCID03: Duplicate Name -> Return 400
  it("UTCID03: should return 400 when theater name exists (code 23505)", async () => {
    mockReq = {
      body: { data: JSON.stringify({ name: "Theater Duplicate" }) },
    };

    const error = new Error("Duplicate");
    error.code = "23505";
    mockPool.query.mockRejectedValue(error);

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  // UTCID04: Generic Error + Has Files -> Execute unlinkFile -> Return 500
  it("UTCID04: should return 500 and cleanup files when generic error occurs", async () => {
    mockReq = {
      body: { data: JSON.stringify({ name: "Theater Err" }) },
      files: [{ filename: "temp.jpg", path: "uploads/temp.jpg" }],
    };

    mockPool.query.mockRejectedValue(new Error("DB Error"));
    
    await handler(mockReq, mockRes);

    // Verify Execute: unlinkFile
    expect(fs.unlink).toHaveBeenCalledWith("uploads/temp.jpg", expect.any(Function));
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  // UTCID05: Generic Error + Unlink Fail -> Execute console.error -> Return 500
  it("UTCID05: should return 500 even if file cleanup fails", async () => {
    mockReq = {
      body: { data: JSON.stringify({ name: "Theater Err" }) },
      files: [{ filename: "temp.jpg", path: "uploads/temp.jpg" }],
    };

    mockPool.query.mockRejectedValue(new Error("DB Error"));

    // Mock: unlink throws error
    fs.unlink.mockImplementation((path, cb) => cb(new Error("Delete Fail")));

    await handler(mockReq, mockRes);

    // Verify Execute: console.error (Cleanup fail)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Không thể xoá ảnh rác:",
      expect.any(String),
      expect.any(Error)
    );
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});