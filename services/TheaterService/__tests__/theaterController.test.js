const createTheaterController = require("../controllers/theaterController");
const fs = require("fs");

// Mock fs module
jest.mock("fs", () => ({
  unlinkSync: jest.fn(),
}));

describe("theaterController", () => {
  let mockPool;
  let theaterController;

  beforeAll(() => {
    // Suppress console.error during tests
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  beforeEach(() => {
    // Create mock pool
    mockPool = {
      query: jest.fn(),
    };

    // Create controller instance
    theaterController = createTheaterController({ pool: mockPool });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllTheaters", () => {
    it("should return all theaters successfully", async () => {
      const mockTheaters = [
        { id: 1, name: "Theater 1", location: "Location 1" },
        { id: 2, name: "Theater 2", location: "Location 2" },
      ];

      mockPool.query.mockResolvedValue({ rows: mockTheaters });

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await theaterController.getAllTheaters(req, res);

      expect(mockPool.query).toHaveBeenCalledWith("SELECT * FROM theaters");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTheaters);
    });

    it("should handle errors when getting all theaters", async () => {
      mockPool.query.mockRejectedValue(new Error("Database error"));

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await theaterController.getAllTheaters(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Lỗi khi lấy danh sách rạp",
      });
    });
  });

  describe("getTheaterById", () => {
    it("should return theater by id successfully", async () => {
      const mockTheater = { id: 1, name: "Theater 1", location: "Location 1" };

      mockPool.query.mockResolvedValue({ rows: [mockTheater] });

      const req = { params: { id: "1" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await theaterController.getTheaterById(req, res);

      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT * FROM theaters WHERE id = $1",
        ["1"]
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTheater);
    });

    it("should return 404 if theater not found", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const req = { params: { id: "999" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await theaterController.getTheaterById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Rạp không tồn tại" });
    });

    it("should handle errors when getting theater by id", async () => {
      mockPool.query.mockRejectedValue(new Error("Database error"));

      const req = { params: { id: "1" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await theaterController.getTheaterById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Lỗi khi lấy thông tin rạp",
      });
    });
  });

  describe("getTheaterGallery", () => {
    it("should return theater gallery successfully", async () => {
      const mockTheater = {
        id: 1,
        name: "Theater 1",
        image_1: "image1.jpg",
        image_2: "image2.jpg",
        image_3: null,
      };

      mockPool.query.mockResolvedValue({ rows: [mockTheater] });

      const req = { params: { id: "1" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await theaterController.getTheaterGallery(req, res);

      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT id, name, image_1, image_2, image_3, image_4 FROM theaters WHERE id = $1",
        ["1"]
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        id: 1,
        name: "Theater 1",
        gallery: ["image1.jpg", "image2.jpg"],
      });
    });

    it("should return 404 if theater not found", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const req = { params: { id: "999" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await theaterController.getTheaterGallery(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Rạp không tồn tại" });
    });

    it("should handle errors when getting theater gallery", async () => {
      mockPool.query.mockRejectedValue(new Error("Database error"));

      const req = { params: { id: "1" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await theaterController.getTheaterGallery(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Lỗi khi lấy gallery rạp",
      });
    });
  });

  describe("createTheater", () => {
    it("should create theater with images successfully", async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ id: 1 }],
      });

      const req = {
        body: {
          name: "Theater 1",
          location: "Location 1",
          description: "Description",
          phone: "0123456789",
          email: "test@example.com",
        },
        files: {
          image_1: [{ filename: "image1.jpg" }],
          image_2: [{ filename: "image2.jpg" }],
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await theaterController.createTheater(req, res);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO theaters"),
        expect.arrayContaining([
          "Theater 1",
          "Location 1",
          "Description",
          "0123456789",
          "test@example.com",
          "image1.jpg",
          "image2.jpg",
        ])
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Tạo rạp thành công",
        theaterId: 1,
      });
    });

    it("should return 400 if required fields are missing", async () => {
      const req = {
        body: {},
        files: {},
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await theaterController.createTheater(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Thiếu thông tin bắt buộc",
      });
    });

    it("should handle errors when creating theater", async () => {
      mockPool.query.mockRejectedValue(new Error("Database error"));

      const req = {
        body: {
          name: "Theater 1",
          location: "Location 1",
        },
        files: {},
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await theaterController.createTheater(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Lỗi khi tạo rạp" });
    });
  });

  describe("updateTheater", () => {
    it("should update theater successfully without changing images", async () => {
      const mockTheater = {
        id: 1,
        name: "Old Theater",
        image_1: "old1.jpg",
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockTheater] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const req = {
        params: { id: "1" },
        body: {
          name: "New Theater",
          location: "New Location",
        },
        files: {},
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await theaterController.updateTheater(req, res);

      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Cập nhật rạp thành công",
      });
    });

    it("should update theater and replace old image", async () => {
      const mockTheater = {
        id: 1,
        name: "Old Theater",
        image_1: "old1.jpg",
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockTheater] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const req = {
        params: { id: "1" },
        body: {
          name: "New Theater",
        },
        files: {
          image_1: [{ filename: "new1.jpg" }],
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await theaterController.updateTheater(req, res);

      expect(fs.unlinkSync).toHaveBeenCalledWith(
        expect.stringContaining("old1.jpg")
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 if theater not found", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const req = {
        params: { id: "999" },
        body: { name: "Theater" },
        files: {},
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await theaterController.updateTheater(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Rạp không tồn tại" });
    });

    it("should handle errors when updating theater", async () => {
      mockPool.query.mockRejectedValue(new Error("Database error"));

      const req = {
        params: { id: "1" },
        body: { name: "Theater" },
        files: {},
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await theaterController.updateTheater(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Lỗi khi cập nhật rạp",
      });
    });
  });

  describe("deleteTheater", () => {
    it("should delete theater successfully", async () => {
      const mockTheater = {
        id: 1,
        name: "Theater 1",
        image_1: "image1.jpg",
        image_2: null,
        image_3: null,
        image_4: null,
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockTheater] })
        .mockResolvedValueOnce({ rows: [] });

      const req = { params: { id: "1" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await theaterController.deleteTheater(req, res);

      expect(fs.unlinkSync).toHaveBeenCalledWith(
        expect.stringContaining("image1.jpg")
      );
      expect(mockPool.query).toHaveBeenCalledWith(
        "DELETE FROM theaters WHERE id = $1",
        ["1"]
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Xóa rạp thành công",
      });
    });

    it("should return 404 if theater not found", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const req = { params: { id: "999" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await theaterController.deleteTheater(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Rạp không tồn tại" });
    });

    it("should handle errors when deleting theater", async () => {
      mockPool.query.mockRejectedValue(new Error("Database error"));

      const req = { params: { id: "1" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await theaterController.deleteTheater(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Lỗi khi xóa rạp" });
    });
  });
});
