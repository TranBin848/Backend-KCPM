describe("createMovie Controller", () => {
  let mockReq;
  let mockRes;
  let controller;
  let MockMovieModel;

  beforeEach(() => {
    mockReq = {
      body: {},
      file: null,
    };
    mockRes = {
      status: jest.fn().mockReturnThis(), 
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("should create movie successfully without poster", async () => {
    const movieData = {
      title: "New Movie",
      description: "A great movie",
      status: "coming_soon",
    };

    // Setup Request
    mockReq.body = { data: JSON.stringify(movieData) };
    
    // Setup Mock Return
    const mockSavedMovie = { _id: "123", ...movieData, poster: null };
    const mockSave = jest.fn().mockResolvedValue(mockSavedMovie);

    // Mock Constructor của Mongoose
    MockMovieModel = jest.fn().mockImplementation((data) => ({
      ...data,
      save: mockSave,
    }));

    // Khởi tạo controller với Mock Model
    controller = createMovieController({ Movie: MockMovieModel });

    // Execute
    await controller.createMovie(mockReq, mockRes);

    // Assertions
    expect(MockMovieModel).toHaveBeenCalledWith(expect.objectContaining(movieData));
    expect(mockSave).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Thêm phim thành công",
      movie: mockSavedMovie,
    });
  });

  it("should create movie successfully with poster", async () => {
    const movieData = {
      title: "New Movie",
      description: "A great movie",
      status: "coming_soon",
    };

    mockReq.body = { data: JSON.stringify(movieData) };
    mockReq.file = { filename: "test-poster.jpg" };

    const expectedPosterPath = "uploads/test-poster.jpg";
    const mockSavedMovie = {
      _id: "123",
      ...movieData,
      poster: expectedPosterPath,
    };

    const mockSave = jest.fn().mockResolvedValue(mockSavedMovie);
    MockMovieModel = jest.fn().mockImplementation((data) => ({
      ...data,
      save: mockSave,
    }));

    controller = createMovieController({ Movie: MockMovieModel });

    await controller.createMovie(mockReq, mockRes);

    // Kiểm tra xem Model có được gọi với đường dẫn poster đúng không
    expect(MockMovieModel).toHaveBeenCalledWith(
      expect.objectContaining({
        poster: expectedPosterPath,
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Thêm phim thành công",
      movie: mockSavedMovie,
    });
  });

  it("should return 400 when invalid JSON data", async () => {
    mockReq.body = { data: "invalid json" }; // Chuỗi này sẽ gây lỗi khi JSON.parse
    
    // Dù không gọi đến Model, ta vẫn cần truyền nó vào để khởi tạo controller không bị lỗi
    MockMovieModel = jest.fn(); 
    controller = createMovieController({ Movie: MockMovieModel });

    await controller.createMovie(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Lỗi khi thêm phim",
      details: expect.any(String), // Chấp nhận bất kỳ chuỗi thông báo lỗi nào từ cú pháp JSON
    });
  });

  it("should handle save errors (Validation failed)", async () => {
    const movieData = { title: "Test Movie" };
    mockReq.body = { data: JSON.stringify(movieData) };

    const saveError = new Error("Validation failed");
    
    // Mock hàm save để trả về lỗi (reject)
    const mockSave = jest.fn().mockRejectedValue(saveError);
    MockMovieModel = jest.fn().mockImplementation(() => ({
      save: mockSave,
    }));

    controller = createMovieController({ Movie: MockMovieModel });

    await controller.createMovie(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Lỗi khi thêm phim",
      details: "Validation failed",
    });
  });
});