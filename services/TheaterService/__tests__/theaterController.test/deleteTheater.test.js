const deleteTheater = require("../../controllers/theaterController/deleteTheater");

describe("deleteTheater", () => {
  let mockPool;
  let handler;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    handler = deleteTheater({ pool: mockPool });
    mockReq = { params: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // Test Case: UTCID01
  // Condition: Valid ID + Row Deleted -> 200
  it("UTCID01: should return 200 when theater deleted successfully", async () => {
    mockReq.params.id = "1";

    // Mock: DELETE returns deleted row
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    await handler(mockReq, mockRes);

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM theaters"),
      ["1"]
    );
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Theater deleted" });
  });

  // Test Case: UTCID02
  // Condition: Valid ID + No Row Deleted -> 404
  it("UTCID02: should return 404 when theater not found", async () => {
    mockReq.params.id = "999";

    // Mock: DELETE returns empty
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