const mongoose = require('mongoose'); 

describe("updateMovie Controller", () => {
  let mockReq;
  let mockRes;
  let controller;
  let mockFindByIdAndUpdate;
  let MockMovieModel;
  let movieId;

  beforeEach(() => {
    movieId = new mongoose.Types.ObjectId().toString();
    
    mockReq = {
      params: { id: movieId },
      body: { data: JSON.stringify({}) }, 
      file: null,
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Thiết lập Mock Mongoose findByIdAndUpdate
    mockFindByIdAndUpdate = jest.fn();
    MockMovieModel = {
      findByIdAndUpdate: mockFindByIdAndUpdate,
    };

    // Khởi tạo Controller
    controller = createMovieController({ Movie: MockMovieModel });

    jest.clearAllMocks();
  });

  it("should update movie successfully without new poster", async () => {
    // Setup
    const updateData = {
      title: "Updated Movie",
      description: "Updated description",
    };
    mockReq.body.data = JSON.stringify(updateData);
    
    const updatedMovie = {
      _id: movieId,
      ...updateData,
      poster: "old-poster.jpg", // Poster cũ vẫn được giữ
    };

    mockFindByIdAndUpdate.mockResolvedValue(updatedMovie);

    // Execute
    await controller.updateMovie(mockReq, mockRes);

    // Assertions
    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      movieId,
      expect.not.objectContaining({ poster: expect.anything() }), 
      { new: true }
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(updatedMovie);
  });

  it("should update movie with new poster path when file is provided", async () => {
    // Setup
    const updateData = { title: "Updated Movie" };
    mockReq.body.data = JSON.stringify(updateData);
    
    // Thiết lập file mới
    mockReq.file = {
      filename: "new-poster.jpg",
      path: "uploads/new-poster.jpg", 
    };

    const expectedPosterPath = `uploads/${mockReq.file.filename}`;
    const updatedMovie = {
      _id: movieId,
      ...updateData,
      poster: expectedPosterPath,
    };

    mockFindByIdAndUpdate.mockResolvedValue(updatedMovie);

    // Execute
    await controller.updateMovie(mockReq, mockRes);

    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      movieId,
      expect.objectContaining({
        ...updateData,
        poster: expectedPosterPath,
      }),
      { new: true }
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(updatedMovie);
  });

  // --- Test Case 3: Không tìm thấy phim ---
  it("should return 404 when movie not found", async () => {
    // Setup
    mockReq.body.data = JSON.stringify({ title: "Test" });
    mockFindByIdAndUpdate.mockResolvedValue(null);

    // Execute
    await controller.updateMovie(mockReq, mockRes);

    // Assertions
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Phim không tồn tại",
    });
  });
  it("should handle update errors and return 500", async () => {
    // Setup
    mockReq.body.data = JSON.stringify({ title: "Test" });
    const error = new Error("Database validation failed");
    mockFindByIdAndUpdate.mockRejectedValue(error);

    // Execute
    await controller.updateMovie(mockReq, mockRes);

    // Assertions
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Lỗi máy chủ",
    });
  });
  
  // --- Test Case 5: Lỗi JSON không hợp lệ (Bad Request) ---
  it("should return 400 when invalid JSON data is provided", async () => {
    // Setup
    mockReq.body.data = "invalid json string";
    
    await controller.updateMovie(mockReq, mockRes);

    // Assertions
    expect(mockRes.status).toHaveBeenCalledWith(400); 
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: "Dữ liệu cập nhật không hợp lệ (JSON)",
    }));
    // Quan trọng: Hàm DB không được gọi
    expect(mockFindByIdAndUpdate).not.toHaveBeenCalled();
  });
});