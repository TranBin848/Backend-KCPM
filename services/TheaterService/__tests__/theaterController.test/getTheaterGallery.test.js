const getTheaterGallery = require("../../controllers/theaterController/getTheaterGallery");

describe("getTheaterGallery", () => {
  let mockPool;
  let handler;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    handler = getTheaterGallery({ pool: mockPool });
    mockReq = { params: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // Test Case: UTCID01
  // Condition: Valid ID + Query Success -> 200
  it("UTCID01: should return 200 and gallery list", async () => {
    mockReq.params.id = "1";
    // Mock: Success
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1, image_url: "url" }] });

    await handler(mockReq, mockRes);

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT id, image_url FROM theater_galleries"),
      ["1"]
    );
    expect(mockRes.json).toHaveBeenCalledWith([{ id: 1, image_url: "url" }]);
  });

  // Test Case: UTCID02
  // Condition: DB Error -> 500
  it("UTCID02: should return 500 when database error occurs", async () => {
    mockReq.params.id = "1";
    mockPool.query.mockRejectedValue(new Error("DB Error"));

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Lỗi khi lấy ảnh gallery." });
  });
});