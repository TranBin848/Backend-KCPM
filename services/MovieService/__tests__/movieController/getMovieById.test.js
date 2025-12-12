const mongoose = require('mongoose');
const createMovieController = require("../../controllers/movieController");

describe("getMovieById Controller", () => {
  let mockReq;
  let mockRes;
  let controller;
  let mockFindById;
  let MockMovieModel;
  let validId;

  beforeEach(() => {
    validId = new mongoose.Types.ObjectId().toString();

    mockReq = {
      params: { id: validId }, 
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockFindById = jest.fn();
    MockMovieModel = {
      findById: mockFindById,
    };

    // Khởi tạo Controller
    controller = createMovieController({ Movie: MockMovieModel });

    jest.clearAllMocks();
  });
  
  // --- Test Case 1: Lấy phim thành công ---
  it("should return 200 and the movie when a valid ID is provided and movie is found", async () => {
    // Setup: Định nghĩa dữ liệu trả về khi tìm thấy
    const mockMovie = {
      _id: validId,
      title: "Test Movie",
      status: "now_showing",
    };
    mockFindById.mockResolvedValue(mockMovie);

    // Execute
    await controller.getMovieById(mockReq, mockRes);

    // Assertions
    expect(mockFindById).toHaveBeenCalledWith(validId);
    expect(mockRes.json).toHaveBeenCalledWith(mockMovie);
  });

  // --- Test Case 2: ID không hợp lệ (Bad Request) ---
  it("should return 400 when an invalid ObjectId is provided", async () => {
    mockReq.params.id = "invalid-id-format"; // Thay thế ID mặc định

    // Execute
    await controller.getMovieById(mockReq, mockRes);

    // Assertions
    expect(mockFindById).not.toHaveBeenCalled(); 
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "ID không hợp lệ",
    });
  });

  // --- Test Case 3: Không tìm thấy phim (Not Found) ---
  it("should return 404 when valid ID is provided but movie not found", async () => {
    // Setup: Giả lập không tìm thấy (trả về null)
    mockFindById.mockResolvedValue(null);
    
    // Execute
    await controller.getMovieById(mockReq, mockRes);

    // Assertions
    expect(mockFindById).toHaveBeenCalledWith(validId);
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Không tìm thấy phim",
    });
  });

  // --- Test Case 4: Lỗi Database (Internal Server Error) ---
  it("should handle database errors and return 500", async () => {
    // Setup: Giả lập lỗi từ DB
    const error = new Error("Database connection error");
    mockFindById.mockRejectedValue(error);

    // Execute
    await controller.getMovieById(mockReq, mockRes);

    // Assertions
    expect(mockFindById).toHaveBeenCalledWith(validId);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Lỗi khi lấy phim",
    });
  });
});