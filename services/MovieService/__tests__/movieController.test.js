const mongoose = require("mongoose");
const createMovieController = require("../controllers/movieController");

describe("MovieController", () => {
  let mockMovie;
  let controller;
  let mockReq;
  let mockRes;
  let consoleErrorSpy;

  beforeAll(() => {
    // Suppress console.error globally for all tests
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    // Setup mock Movie model
    mockMovie = {
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    // Mock constructor and save
    const MockMovieConstructor = jest.fn(function (data) {
      this.data = data;
      this.save = jest.fn().mockResolvedValue(this);
      return this;
    });

    // Copy static methods to constructor
    Object.assign(MockMovieConstructor, mockMovie);

    // Create controller with mocked Movie model
    controller = createMovieController({ Movie: MockMovieConstructor });

    // Setup mock request and response objects
    mockReq = {
      params: {},
      query: {},
      body: {},
      file: null,
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllMovies", () => {
    it("should return all movies when no status filter", async () => {
      const mockMovies = [
        { _id: "1", title: "Movie 1", status: "now_showing" },
        { _id: "2", title: "Movie 2", status: "coming_soon" },
      ];

      mockMovie.find.mockResolvedValue(mockMovies);

      await controller.getAllMovies(mockReq, mockRes);

      expect(mockMovie.find).toHaveBeenCalledWith();
      expect(mockRes.json).toHaveBeenCalledWith(mockMovies);
    });

    it("should return filtered movies when status is provided", async () => {
      mockReq.query.status = "now_showing";
      const mockMovies = [
        { _id: "1", title: "Movie 1", status: "now_showing" },
      ];

      mockMovie.find.mockResolvedValue(mockMovies);

      await controller.getAllMovies(mockReq, mockRes);

      expect(mockMovie.find).toHaveBeenCalledWith({ status: "now_showing" });
      expect(mockRes.json).toHaveBeenCalledWith(mockMovies);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      mockMovie.find.mockRejectedValue(error);

      await controller.getAllMovies(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi lấy danh sách phim",
      });
    });
  });

  describe("getMovieById", () => {
    it("should return movie when valid ID is provided", async () => {
      const validId = new mongoose.Types.ObjectId().toString();
      mockReq.params.id = validId;

      const mockMovie = {
        _id: validId,
        title: "Test Movie",
        status: "now_showing",
      };

      controller = createMovieController({
        Movie: {
          ...mockMovie,
          findById: jest.fn().mockResolvedValue(mockMovie),
        },
      });

      await controller.getMovieById(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockMovie);
    });

    it("should return 400 when invalid ObjectId is provided", async () => {
      mockReq.params.id = "invalid-id";

      await controller.getMovieById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "ID không hợp lệ",
      });
    });

    it("should return 404 when movie not found", async () => {
      const validId = new mongoose.Types.ObjectId().toString();
      mockReq.params.id = validId;

      controller = createMovieController({
        Movie: {
          findById: jest.fn().mockResolvedValue(null),
        },
      });

      await controller.getMovieById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Không tìm thấy phim",
      });
    });

    it("should handle database errors", async () => {
      const validId = new mongoose.Types.ObjectId().toString();
      mockReq.params.id = validId;

      const error = new Error("Database error");
      controller = createMovieController({
        Movie: {
          findById: jest.fn().mockRejectedValue(error),
        },
      });

      await controller.getMovieById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi lấy phim",
      });
    });
  });

  describe("createMovie", () => {
    it("should create movie successfully without poster", async () => {
      const movieData = {
        title: "New Movie",
        description: "A great movie",
        status: "coming_soon",
      };

      mockReq.body.data = JSON.stringify(movieData);
      mockReq.file = null;

      const mockSavedMovie = { _id: "123", ...movieData, poster: null };
      const MockMovieConstructor = jest.fn(function (data) {
        this.data = data;
        this.save = jest.fn().mockResolvedValue(mockSavedMovie);
        return this;
      });

      controller = createMovieController({ Movie: MockMovieConstructor });

      await controller.createMovie(mockReq, mockRes);

      expect(MockMovieConstructor).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Thêm phim thành công",
        movie: expect.any(Object),
      });
    });

    it("should create movie successfully with poster", async () => {
      const movieData = {
        title: "New Movie",
        description: "A great movie",
        status: "coming_soon",
      };

      mockReq.body.data = JSON.stringify(movieData);
      mockReq.file = {
        filename: "test-poster.jpg",
        path: "uploads/test-poster.jpg",
      };

      const MockMovieConstructor = jest.fn(function (data) {
        this.data = data;
        this.save = jest.fn().mockResolvedValue({
          _id: "123",
          ...data,
        });
        return this;
      });

      controller = createMovieController({ Movie: MockMovieConstructor });

      await controller.createMovie(mockReq, mockRes);

      expect(MockMovieConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          poster: "uploads/test-poster.jpg",
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should return 400 when invalid JSON data", async () => {
      mockReq.body.data = "invalid json";

      await controller.createMovie(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi thêm phim",
        details: expect.any(String),
      });
    });

    it("should handle save errors", async () => {
      const movieData = { title: "Test Movie" };
      mockReq.body.data = JSON.stringify(movieData);

      const saveError = new Error("Validation failed");
      const MockMovieConstructor = jest.fn(function (data) {
        this.save = jest.fn().mockRejectedValue(saveError);
        return this;
      });

      controller = createMovieController({ Movie: MockMovieConstructor });

      await controller.createMovie(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi thêm phim",
        details: "Validation failed",
      });
    });
  });

  describe("updateMovie", () => {
    it("should update movie successfully without new poster", async () => {
      const movieId = new mongoose.Types.ObjectId().toString();
      mockReq.params.id = movieId;

      const updateData = {
        title: "Updated Movie",
        description: "Updated description",
      };
      mockReq.body.data = JSON.stringify(updateData);
      mockReq.file = null;

      const updatedMovie = {
        _id: movieId,
        ...updateData,
        poster: "old-poster.jpg",
      };

      controller = createMovieController({
        Movie: {
          findByIdAndUpdate: jest.fn().mockResolvedValue(updatedMovie),
        },
      });

      await controller.updateMovie(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(updatedMovie);
    });

    it("should update movie with new poster", async () => {
      const movieId = new mongoose.Types.ObjectId().toString();
      mockReq.params.id = movieId;

      const updateData = { title: "Updated Movie" };
      mockReq.body.data = JSON.stringify(updateData);
      mockReq.file = {
        filename: "new-poster.jpg",
        path: "uploads/new-poster.jpg",
      };

      const updatedMovie = {
        _id: movieId,
        ...updateData,
        poster: "uploads/new-poster.jpg",
      };

      const mockFindByIdAndUpdate = jest.fn().mockResolvedValue(updatedMovie);

      controller = createMovieController({
        Movie: {
          findByIdAndUpdate: mockFindByIdAndUpdate,
        },
      });

      await controller.updateMovie(mockReq, mockRes);

      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        movieId,
        expect.objectContaining({
          poster: "uploads/new-poster.jpg",
        }),
        { new: true }
      );
      expect(mockRes.json).toHaveBeenCalledWith(updatedMovie);
    });

    it("should return 404 when movie not found", async () => {
      const movieId = new mongoose.Types.ObjectId().toString();
      mockReq.params.id = movieId;
      mockReq.body.data = JSON.stringify({ title: "Test" });

      controller = createMovieController({
        Movie: {
          findByIdAndUpdate: jest.fn().mockResolvedValue(null),
        },
      });

      await controller.updateMovie(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Phim không tồn tại",
      });
    });

    it("should handle update errors", async () => {
      const movieId = new mongoose.Types.ObjectId().toString();
      mockReq.params.id = movieId;
      mockReq.body.data = JSON.stringify({ title: "Test" });

      const error = new Error("Update failed");
      controller = createMovieController({
        Movie: {
          findByIdAndUpdate: jest.fn().mockRejectedValue(error),
        },
      });

      await controller.updateMovie(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi máy chủ",
      });
    });

    it("should handle invalid JSON in update", async () => {
      const movieId = new mongoose.Types.ObjectId().toString();
      mockReq.params.id = movieId;
      mockReq.body.data = "invalid json";

      await controller.updateMovie(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi máy chủ",
      });
    });
  });

  describe("deleteMovie", () => {
    it("should delete movie successfully", async () => {
      const movieId = new mongoose.Types.ObjectId().toString();
      mockReq.params.id = movieId;

      const deletedMovie = {
        _id: movieId,
        title: "Deleted Movie",
      };

      controller = createMovieController({
        Movie: {
          findByIdAndDelete: jest.fn().mockResolvedValue(deletedMovie),
        },
      });

      await controller.deleteMovie(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Xóa phim thành công",
      });
    });

    it("should return 404 when movie not found", async () => {
      const movieId = new mongoose.Types.ObjectId().toString();
      mockReq.params.id = movieId;

      controller = createMovieController({
        Movie: {
          findByIdAndDelete: jest.fn().mockResolvedValue(null),
        },
      });

      await controller.deleteMovie(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Không tìm thấy phim để xóa",
      });
    });

    it("should handle delete errors", async () => {
      const movieId = new mongoose.Types.ObjectId().toString();
      mockReq.params.id = movieId;

      const error = new Error("Delete failed");
      controller = createMovieController({
        Movie: {
          findByIdAndDelete: jest.fn().mockRejectedValue(error),
        },
      });

      await controller.deleteMovie(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lỗi khi xóa phim",
        details: "Delete failed",
      });
    });
  });

  describe("Edge cases and integration scenarios", () => {
    it("should handle empty movie list", async () => {
      mockMovie.find.mockResolvedValue([]);

      await controller.getAllMovies(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it("should handle movie creation with minimal data", async () => {
      const minimalData = { title: "Minimal Movie" };
      mockReq.body.data = JSON.stringify(minimalData);

      const MockMovieConstructor = jest.fn(function (data) {
        this.save = jest.fn().mockResolvedValue({ _id: "123", ...data });
        return this;
      });

      controller = createMovieController({ Movie: MockMovieConstructor });

      await controller.createMovie(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should preserve existing poster when updating without file", async () => {
      const movieId = new mongoose.Types.ObjectId().toString();
      mockReq.params.id = movieId;
      mockReq.body.data = JSON.stringify({ title: "Updated" });
      mockReq.file = null;

      const existingMovie = {
        _id: movieId,
        title: "Updated",
        poster: "existing-poster.jpg",
      };

      const mockFindByIdAndUpdate = jest.fn((id, data, options) => {
        // Simulate that poster is NOT in update data when file is null
        expect(data).not.toHaveProperty("poster");
        return Promise.resolve(existingMovie);
      });

      controller = createMovieController({
        Movie: { findByIdAndUpdate: mockFindByIdAndUpdate },
      });

      await controller.updateMovie(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(existingMovie);
    });
  });
});
