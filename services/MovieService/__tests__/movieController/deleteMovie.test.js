const mongoose = require('mongoose');
const createMovieController = require("../../controllers/movieController");

describe("deleteMovie Controller", () => {
  let mockReq;
  let mockRes;
  let controller;
  let mockFindByIdAndDelete;
  let MockMovieModel;

  // Giả lập một ID hợp lệ dùng chung
  const movieId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    // Reset req, res
    mockReq = {
      params: { id: movieId },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(), 
      json: jest.fn(),
    };

    mockFindByIdAndDelete = jest.fn();
    
    MockMovieModel = {
      findByIdAndDelete: mockFindByIdAndDelete,
    };

    // Khởi tạo controller
    controller = createMovieController({ Movie: MockMovieModel });
    
    jest.clearAllMocks();
  });

  it("should delete movie successfully", async () => {
    // Setup: Giả lập tìm thấy và xóa phim
    const deletedMovie = {
      _id: movieId,
      title: "Deleted Movie",
    };
    mockFindByIdAndDelete.mockResolvedValue(deletedMovie);

    // Execute
    await controller.deleteMovie(mockReq, mockRes);

    // Assertions
    expect(mockFindByIdAndDelete).toHaveBeenCalledWith(movieId);

    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Xóa phim thành công",
    });
  });

  it("should return 404 when movie not found", async () => {
    // Setup: Giả lập không tìm thấy phim (trả về null)
    mockFindByIdAndDelete.mockResolvedValue(null);

    // Execute
    await controller.deleteMovie(mockReq, mockRes);

    // Assertions
    expect(mockFindByIdAndDelete).toHaveBeenCalledWith(movieId);
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Không tìm thấy phim để xóa",
    });
  });

  it("should handle delete errors (Database error)", async () => {
    // Setup: Giả lập lỗi từ DB
    const error = new Error("Delete failed");
    mockFindByIdAndDelete.mockRejectedValue(error);

    // Execute
    await controller.deleteMovie(mockReq, mockRes);

    // Assertions
    expect(mockRes.status).toHaveBeenCalledWith(400); 
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Lỗi khi xóa phim",
      details: "Delete failed",
    });
  });
});