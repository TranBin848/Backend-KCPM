const getTheaterById = require("../../controllers/theaterController/getTheaterById");

describe("getTheaterById", () => {
  let mockPool;
  let handler;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    handler = getTheaterById({ pool: mockPool });
    mockReq = { params: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // Test Case: UTCID01
  // Condition: Valid ID + Found -> 200
  it("UTCID01: should return 200 and theater info when found", async () => {
    mockReq.params.id = "1";
    // Mock: Found
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    await handler(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({ id: 1 });
  });

  // Test Case: UTCID02
  // Condition: Valid ID + Not Found -> 404
  it("UTCID02: should return 404 when theater not found", async () => {
    mockReq.params.id = "999";
    // Mock: Empty
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Theater not found" });
  });

  // Test Case: UTCID03
  // Condition: DB Error -> 500
  it("UTCID03: should return 500 when database error occurs", async () => {
    mockReq.params.id = "1";
    mockPool.query.mockRejectedValue(new Error("DB Error"));

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});