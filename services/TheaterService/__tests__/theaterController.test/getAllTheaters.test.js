const getAllTheaters = require("../../controllers/theaterController/getAllTheaters");

describe("getAllTheaters", () => {
  let mockPool;
  let handler;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    handler = getAllTheaters({ pool: mockPool });
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // Test Case: UTCID01
  // Condition: DB Success -> 200
  it("UTCID01: should return 200 and list of theaters", async () => {
    const mockData = [{ id: 1, name: "Theater A" }];
    // Mock: SELECT success
    mockPool.query.mockResolvedValueOnce({ rows: mockData });

    await handler(mockReq, mockRes);

    expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining("SELECT * FROM theaters"));
    expect(mockRes.json).toHaveBeenCalledWith(mockData);
  });

  // Test Case: UTCID02
  // Condition: DB Error -> 500
  it("UTCID02: should return 500 when database error occurs", async () => {
    mockPool.query.mockRejectedValue(new Error("DB Error"));

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});