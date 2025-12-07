describe("getAllMovies Controller", () => {
  let mockReq;
  let mockRes;
  let controller;
  let mockFind;
  let MockMovieModel;

  beforeEach(() => {
    // 1. Reset Req/Res
    mockReq = {
      query: {}, 
    };
    mockRes = {
      status: jest.fn().mockReturnThis(), 
      json: jest.fn(),
    };

    // 2. Reset Mock Function
    mockFind = jest.fn();

    // 3. Tạo Mock Model
    MockMovieModel = {
      find: mockFind,
    };

    // 4. Khởi tạo Controller với Dependency Injection
    controller = createMovieController({ Movie: MockMovieModel });

    jest.clearAllMocks();
  });

  it("should return all movies when no status filter is provided", async () => {
    // Setup
    const mockMovies = [
      { _id: "1", title: "Movie 1", status: "now_showing" },
      { _id: "2", title: "Movie 2", status: "coming_soon" },
    ];
    mockFind.mockResolvedValue(mockMovies);

    // Execute
    await controller.getAllMovies(mockReq, mockRes);

    // Assertions
    expect(mockFind).toHaveBeenCalledWith({}); 
    
    
    expect(mockRes.json).toHaveBeenCalledWith(mockMovies);
  });

  it("should return filtered movies when status is provided", async () => {
    // Setup
    mockReq.query.status = "now_showing";
    
    const mockMovies = [
      { _id: "1", title: "Movie 1", status: "now_showing" },
    ];
    mockFind.mockResolvedValue(mockMovies);

    // Execute
    await controller.getAllMovies(mockReq, mockRes);

    // Assertions
    expect(mockFind).toHaveBeenCalledWith({ status: "now_showing" });
    expect(mockRes.json).toHaveBeenCalledWith(mockMovies);
  });

  it("should handle database errors", async () => {
    // Setup
    const error = new Error("Database connection failed");
    mockFind.mockRejectedValue(error);

    // Execute
    await controller.getAllMovies(mockReq, mockRes);

    // Assertions
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Lỗi lấy danh sách phim",
    });
  });
});