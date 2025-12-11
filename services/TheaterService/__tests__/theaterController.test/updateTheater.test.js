const updateTheater = require("../../controllers/theaterController/updateTheater");
const fs = require("fs");

jest.mock("fs");

describe("updateTheater", () => {
  let mockPool;
  let handler;
  let mockReq;
  let mockRes;
  let consoleErrorSpy;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    handler = updateTheater({ pool: mockPool });
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    
    // Default fs.unlink mock success
    fs.unlink.mockImplementation((path, cb) => cb(null));
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  // UTCID01: Update + Delete Old Img + New Img -> Return 200
  it("UTCID01: should return 200 and handle updates, deletions, and insertions", async () => {
    mockReq = {
      params: { id: "1" },
      body: {
        data: JSON.stringify({
          name: "Updated Name",
          deletedImages: ["http://localhost:8080/theaters/uploads/old.jpg"],
        }),
      },
      files: [{ filename: "new.jpg" }],
    };

    // Mock 1: UPDATE theater returns row
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1, name: "Updated Name" }] });
    // Mock 2: DELETE from gallery
    mockPool.query.mockResolvedValueOnce({ rowCount: 1 });
    // Mock 3: INSERT into gallery
    mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

    await handler(mockReq, mockRes);

    // Verify Executes: UPDATE theater, DELETE gallery, INSERT gallery (3 calls)
    expect(mockPool.query).toHaveBeenCalledTimes(3);
    // Verify Executes: unlinkFile
    expect(fs.unlink).toHaveBeenCalled();
    expect(mockRes.json).toHaveBeenCalledWith({ id: 1, name: "Updated Name" });
  });

  // UTCID02: Update Info Only -> Return 200
  it("UTCID02: should return 200 when updating info only", async () => {
    mockReq = {
      params: { id: "1" },
      body: { data: JSON.stringify({ name: "Updated Name" }) },
    }; 

    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    await handler(mockReq, mockRes);

    expect(mockPool.query).toHaveBeenCalledTimes(1);
    expect(mockRes.json).toHaveBeenCalled();
  });

  // UTCID03: Unlink Fails -> Exec console.error -> Return 200
  it("UTCID03: should log error but return 200 if image deletion fails", async () => {
    mockReq = {
      params: { id: "1" },
      body: {
        data: JSON.stringify({
          name: "Upd",
          deletedImages: ["http://localhost:8080/theaters/uploads/fail.jpg"],
        }),
      },
    };

    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    mockPool.query.mockResolvedValueOnce({ rowCount: 1 }); 

    // Mock: FS Unlink throws error
    fs.unlink.mockImplementation((path, cb) => cb(new Error("File Locked")));

    await handler(mockReq, mockRes);

    // Verify Execute: console.error (Unlink Fail)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Không thể xóa ảnh"), 
      expect.any(Error)
    );
    expect(mockRes.json).toHaveBeenCalled(); 
  });

  // UTCID04: Not Found -> Return 404
  it("UTCID04: should return 404 when theater not found", async () => {
    mockReq = {
      params: { id: "999" },
      body: { data: JSON.stringify({ name: "A" }) },
    };

    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
  });

  // UTCID05: DB Error -> Exec catch -> Return 500
  it("UTCID05: should return 500 when database error occurs", async () => {
    mockReq = {
      params: { id: "1" },
      body: { data: JSON.stringify({ name: "A" }) },
    };

    mockPool.query.mockRejectedValue(new Error("DB Error"));

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});